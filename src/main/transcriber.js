import { spawn } from 'child_process'
import { join } from 'path'

// Resolve path to transcriberChild.js
const childPath = join(process.cwd(), 'src/main/transcriberChild.js')
console.log(`[Transcriber] Spawning child process: ${childPath}`)

const child = spawn('node', [childPath], {
  stdio: ['pipe', 'inherit', 'inherit', 'ipc']
})

let sentenceCallback = null

child.on('message', (msg) => {
  if (msg && msg.text && typeof sentenceCallback === 'function') {
    sentenceCallback(msg.text)
  }
})

child.on('error', (err) => {
  console.error(`[Transcriber] Child process error: ${err.message}`)
})

child.on('close', (code) => {
  console.warn(`[Transcriber] Child process closed with code ${code}`)
})

/**
 * Feeds a chunk of PCM audio data into the child transcriber process.
 * @param {Buffer} data Raw PCM audio buffer.
 * @param {function(string)} onSentence Callback invoked when a complete sentence is recognized.
 */
export function processAudioStream(data, onSentence) {
  sentenceCallback = onSentence
  if (child.stdin.writable) {
    child.stdin.write(data)
  }
}
