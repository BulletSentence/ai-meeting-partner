const vosk = require('vosk')
const path = require('path')

// Suppress vosk spam logs
vosk.setLogLevel(-1)

// Path to the vosk model
const modelPath = path.join(process.cwd(), 'vosk-model')
console.log(`[Child Transcriber] Loading model from: ${modelPath}`)

const model = new vosk.Model(modelPath)
const recognizer = new vosk.Recognizer({ model: model, sampleRate: 16000 })

// Listen to binary data on stdin
process.stdin.on('data', (chunk) => {
  try {
    if (recognizer.acceptWaveform(chunk)) {
      const result = recognizer.result()
      if (result && result.text && result.text.trim()) {
        if (process.send) {
          process.send({ text: result.text })
        }
      }
    }
  } catch (err) {
    console.error(`[Child Transcriber] Error: ${err.message}`)
  }
})

process.stdin.on('end', () => {
  process.exit(0)
})
