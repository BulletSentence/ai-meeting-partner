# 🛸 AI Interview Copilot

An elite, local-first technical interview copilot built for Linux. It runs as a stealth overlay HUD, capturing system audio loopback to transcribe and analyze the interview stream in real time, delivering short talking points, behavioral cues, and algorithmic architectures.

---

## 💡 Key Features

- **Stealth Overlay HUD**: A transparent, click-through ghost window overlay. Hovering over the top title bar instantly enables drag, resize, and window controls (Minimize, Maximize, Close), reverting back to click-through when the mouse leaves.
- **Native Linux Audio Loopback**: Captures real-time dual-channel audio using PulseAudio (`parec`).
  - **SYSTEM**: Captures the interviewer's voice from default sink loopback.
  - **MIC (Ask Doubt Mode)**: Swappable at the click of a button to capture the candidate's mic and target specific queries.
- **Offline Speech-To-Text**: Fully private, local audio stream transcription using Vosk.
- **On-Screen OCR Capture**: Instantly grabs on-screen text via Tesseract.js (using `Ctrl+Shift+S`) to add code problems, whiteboard drawings, or diagrams directly to the AI context.
- **Resilient AI Fallback Router**: Re-routes requests using a priority cascade with a **5-second timeout** race condition:
  1. `Gemini 2.5 Flash` (Cloud API - Primary)
  2. `Ollama gemma2:2b` (Local LLM - Secondary)
  3. `Anthropic Claude 3.5 Sonnet` (Cloud API - Tertiary)
  4. `OpenAI GPT-4o Mini` (Cloud API - Quaternary)
- **Local Session Archiving**: Automatically logs setup configurations, raw transcripts, and AI suggestions into chronological JSON files under `/interviews`.

---

## 🛠 Tech Stack

- **Framework**: Electron + React.js
- **Tooling**: Vite (via `electron-vite`)
- **Speech recognition**: Vosk (running in a dedicated Node.js child process)
- **OCR Engine**: Tesseract.js
- **Local LLM**: Ollama (`gemma2:2b`)
- **Cloud APIs**: Google Gen AI SDK, Anthropic Node SDK, OpenAI Node SDK

---

## 🚀 Getting Started

*For step-by-step setup instructions, please see [INSTALLATION.md](INSTALLATION.md).*
