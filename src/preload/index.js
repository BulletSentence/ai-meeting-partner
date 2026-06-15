import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  onTranscription: (callback) => ipcRenderer.on('on-transcription', (_event, value) => callback(value)),
  onAiAnswer: (callback) => ipcRenderer.on('on-ai-answer', (_event, value) => callback(value)),
  startInterview: (data) => ipcRenderer.send('start-interview', data),
  stopInterview: () => ipcRenderer.send('stop-interview'),
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),
  onWindowLockChange: (cb) => ipcRenderer.on('window-unlocked', (_e, val) => cb(val)),
  getSavedSessions: () => ipcRenderer.invoke('get-saved-sessions'),
  toggleAudioSource: (source) => ipcRenderer.send('toggle-audio-source', source),
  onAudioLevel: (cb) => ipcRenderer.on('audio-level', (_e, val) => cb(val)),
  setWindowInteractive: () => ipcRenderer.send('set-window-interactive'),
  setWindowClickthrough: () => ipcRenderer.send('set-window-clickthrough'),
  maximize: () => ipcRenderer.send('maximize-window')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
