import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startAudioCapture } from './audioCapture'
import { processAudioStream } from './transcriber'
import { configureAI, generateInterviewHelp, getConversationHistory } from './aiService'
import { captureScreenAndExtractText } from './screenCapture'
import { saveInterviewSession } from './sessionLogger'

let mainWindow = null
let isLocked = false

// Rolling context variables
let transcriptSentences = []
let aiTimeout = null

// Session state variables
let currentInterviewData = null
let audioCaptureProcess = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })



  // OCR screen grab hotkey (Ctrl+Shift+S)
  globalShortcut.register('CommandOrControl+Shift+S', async () => {
    console.log('[OCR] Screen Capture and OCR starting...')
    const startTime = Date.now()

    const extractedText = await captureScreenAndExtractText()

    const latency = Date.now() - startTime
    console.log(`[OCR] Screen Capture and OCR completed in ${latency}ms`)

    if (extractedText) {
      console.log(`[OCR Context] Detected text (length: ${extractedText.length})`)

      const prefix = `[Screen Context Detected]: ${extractedText}`
      transcriptSentences.push(prefix)

      const fullTranscript = transcriptSentences.join(' ')

      if (aiTimeout) {
        clearTimeout(aiTimeout)
      }

      generateInterviewHelp(fullTranscript, (answer, provider) => {
        console.log(`[AI Answer] [${provider}]: ${answer}`)
        if (mainWindow) {
          mainWindow.webContents.send('on-ai-answer', { answer, provider })
        }
      })
    } else {
      console.log('[OCR] No text extracted from primary screen.')
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

let currentAudioSource = 'system'
let lastAudioLevelSentTime = 0

function calculateAndSendAudioLevel(chunk) {
  const now = Date.now()
  if (now - lastAudioLevelSentTime < 100) {
    return
  }
  
  if (!chunk || chunk.length < 2) {
    return
  }
  
  let sum = 0
  let sampleCount = 0
  for (let i = 0; i < chunk.length - 1; i += 2) {
    const sample = chunk.readInt16LE(i)
    sum += sample * sample
    sampleCount++
  }
  
  if (sampleCount === 0) return
  
  const rms = Math.sqrt(sum / sampleCount)
  const referenceMaxRms = 8000
  const rawLevel = (rms / referenceMaxRms) * 100
  const level = Math.min(100, Math.max(0, Math.floor(rawLevel)))
  
  lastAudioLevelSentTime = now
  if (mainWindow) {
    mainWindow.webContents.send('audio-level', level)
  }
}

function switchAudioSource(source) {
  currentAudioSource = source
  console.log(`[Main] Switched active audio source variable to: ${source}`)
  
  if (audioCaptureProcess) {
    try {
      audioCaptureProcess.kill()
    } catch (e) {
      console.error('[Main] Error killing audio process on switch:', e.message)
    }
    audioCaptureProcess = null
  }
  
  if (currentInterviewData) {
    audioCaptureProcess = startAudioCapture((chunk) => {
      // Measure chunk sizes
      const chunkSize = chunk.length
      
      calculateAndSendAudioLevel(chunk)
      
      processAudioStream(chunk, (text) => {
        console.log(`[Transcription] [${currentAudioSource}]: ${text}`)
        if (mainWindow) {
          mainWindow.webContents.send('on-transcription', text)
        }
        
        let formattedText = text
        if (currentAudioSource === 'mic') {
          formattedText = `[Candidate Question / Doubt]: ${text}`
        }
        
        transcriptSentences.push(formattedText)
        const fullTranscript = transcriptSentences.join(' ')
        
        if (aiTimeout) {
          clearTimeout(aiTimeout)
        }
        
        aiTimeout = setTimeout(() => {
          generateInterviewHelp(fullTranscript, (answer, provider) => {
            console.log(`[AI Answer] [${provider}]: ${answer}`)
            if (mainWindow) {
              mainWindow.webContents.send('on-ai-answer', { answer, provider })
            }
          })
        }, 1500)
      })
    }, source)
  }
}

/**
 * Halts active capture sessions and saves transcript records.
 */
function handleStopSession() {
  if (audioCaptureProcess) {
    try {
      audioCaptureProcess.kill()
    } catch (e) {
      console.error('[Main] Error stopping parec capture:', e.message)
    }
    audioCaptureProcess = null
  }

  if (currentInterviewData) {
    const history = getConversationHistory()
    if (history.length > 0) {
      saveInterviewSession(currentInterviewData, history)
    }
    currentInterviewData = null
  }
}

// IPC: Minimize Window
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize()
})

// IPC: Close Window
ipcMain.on('close-window', () => {
  app.quit()
})

// IPC: Stop Interview Session Manually
ipcMain.on('stop-interview', () => {
  console.log('[Main] Stopping interview session manually.')
  handleStopSession()
  
  // Unlock mouse events and notify renderer
  isLocked = false
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(false)
    mainWindow.webContents.send('window-unlocked', true)
  }
})

// IPC: Start Interview Session
ipcMain.on('start-interview', (_event, data) => {
  currentInterviewData = data

  // Configure AI prompt instructions
  configureAI(data)

  // Reset transcript array
  transcriptSentences = []
  if (aiTimeout) {
    clearTimeout(aiTimeout)
    aiTimeout = null
  }

  // Start audio capture in system monitor mode initially
  switchAudioSource('system')

  // Lock click-through on start
  isLocked = true
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(true, { forwardToDesktop: true })
    mainWindow.webContents.send('window-unlocked', false)
  }
})

// IPC: Toggle Audio Source
ipcMain.on('toggle-audio-source', (_event, source) => {
  switchAudioSource(source)
})

// IPC: Interactive and Clickthrough Window Hover controls
ipcMain.on('set-window-interactive', () => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(false)
  }
})

ipcMain.on('set-window-clickthrough', () => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(true, { forwardToDesktop: true })
  }
})

// IPC: Standard Window Maximize
ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

// IPC Handler: Read and return historical interview sessions
ipcMain.handle('get-saved-sessions', async () => {
  try {
    const dir = join(process.cwd(), 'interviews')
    await fs.mkdir(dir, { recursive: true })
    const files = await fs.readdir(dir)
    const sessions = []
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(dir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        sessions.push({
          filename: file,
          data: JSON.parse(content)
        })
      }
    }
    // Sort descending by filename timestamp
    sessions.sort((a, b) => b.filename.localeCompare(a.filename))
    return sessions
  } catch (err) {
    console.error('[Main] get-saved-sessions failed:', err.message)
    return []
  }
})

// App Lifecycle
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  handleStopSession()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  handleStopSession()
  globalShortcut.unregisterAll()
})
