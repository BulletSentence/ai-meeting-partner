import { spawn } from 'child_process'
import { join } from 'path'

const childPath = join(process.cwd(), 'src/main/transcriberChild.js')
let child = null
let sentenceCallback = null
let currentModelDirectory = null

/**
 * Starts the speech recognizer for the requested language.
 * @param {string} language Supported values are pt-BR and en-US.
 */
export function configureTranscriber(language = 'pt-BR') {
  const modelDirectory = language === 'en-US' ? 'vosk-model' : 'vosk-model-pt'

  if (child && currentModelDirectory === modelDirectory) {
    return
  }

  if (child) {
    child.kill()
  }

  currentModelDirectory = modelDirectory
  console.log(`[Transcriber] Spawning child process with ${modelDirectory}`)
  const spawnedChild = spawn('node', [childPath, modelDirectory], {
    stdio: ['pipe', 'inherit', 'inherit', 'ipc']
  })
  child = spawnedChild

  spawnedChild.on('message', (msg) => {
    if (msg && msg.text && typeof sentenceCallback === 'function') {
      sentenceCallback(msg.text)
    }
  })

  spawnedChild.on('error', (err) => {
    console.error(`[Transcriber] Child process error: ${err.message}`)
  })

  spawnedChild.on('close', (code) => {
    console.warn(`[Transcriber] Child process closed with code ${code}`)
    if (child === spawnedChild) {
      child = null
    }
  })
}

/**
 * Feeds a chunk of PCM audio data into the child transcriber process.
 * @param {Buffer} data Raw PCM audio buffer.
 * @param {function(string)} onSentence Callback invoked when a complete sentence is recognized.
 */
export function processAudioStream(data, onSentence) {
  sentenceCallback = onSentence
  if (!child) {
    configureTranscriber()
  }
  if (child?.stdin.writable) {
    child.stdin.write(data)
  }
}
