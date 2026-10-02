# AI Assistant

[Português](#português) · [English](#english)

> Assistente desktop para preparação e anotações durante entrevistas. Use somente com consentimento das pessoas envolvidas e de acordo com as regras da plataforma.

---

## Português

O **AI Assistant** é um aplicativo desktop para Linux que transcreve áudio localmente, extrai texto da tela com OCR e gera sugestões curtas para entrevistas técnicas. Ele é feito com Electron e React e funciona em uma janela transparente, sempre visível.

### Recursos

- Transcrição em tempo real com **Vosk**, para português brasileiro e inglês.
- Captura de áudio do sistema ou microfone com `parec` (PulseAudio/PipeWire).
- OCR da tela com `Ctrl+Shift+S`, para adicionar enunciados ou código ao contexto.
- Sugestões de IA para algoritmos, projetos, currículo e comunicação comportamental.
- Roteamento entre **Gemini**, **Ollama** local, **Claude** e **OpenAI**.
- Histórico de sessões em JSON, salvo localmente em `interviews/`.
- Janela sem moldura, sempre no topo e com modo click-through durante a sessão.

### Requisitos

- Linux com PulseAudio ou PipeWire e o comando `parec`.
- Node.js 20 e npm (`.nvmrc` define a versão).
- Modelos Vosk baixados separadamente:
  - português em `vosk-model-pt/`;
  - inglês em `vosk-model/`.
- Uma opção de IA configurada: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` ou Ollama local com `gemma2:2b`.

### Instalação

```bash
git clone git@github.com:BulletSentence/ai-interview-copilot.git
cd ai-interview-copilot
nvm use
npm install
cp .env.example .env
```

Adicione as chaves dos provedores desejados em `.env`:

```env
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

Para usar geração local, instale o Ollama e baixe o modelo:

```bash
ollama pull gemma2:2b
```

Extraia também os modelos Vosk nas pastas indicadas em [Requisitos](#requisitos).

### Uso

```bash
npm run dev
```

1. Informe o perfil, a vaga, a descrição e, se quiser, o currículo.
2. Escolha o idioma e ative o Ollama para priorizar o modelo local.
3. Clique em **Iniciar entrevista**; a captura começa pelo áudio do sistema.
4. Alterne para **MIC** para usar o microfone.
5. Pressione `Ctrl+Shift+S` para capturar a tela e executar o OCR.
6. Pare a sessão para gravar o histórico em `interviews/`.

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o app em desenvolvimento. |
| `npm run lint` | Executa o ESLint. |
| `npm run format` | Formata com Prettier. |
| `npm run build` | Gera os arquivos de produção. |
| `npm run build:linux` | Gera pacotes AppImage, Snap e DEB. |
| `npm run build:win` | Gera o pacote Windows. |
| `npm run build:mac` | Gera o pacote macOS. |

### Privacidade

A transcrição Vosk é local. Ao usar um provedor de IA em nuvem, o contexto da sessão — transcrição, OCR e informações preenchidas — pode ser enviado a ele para gerar respostas. Não inclua dados sensíveis sem autorização.

---

## English

**AI Assistant** is a Linux desktop app for interview preparation and live note-taking. It transcribes audio locally, extracts on-screen text through OCR, and generates concise technical-interview prompts. It is built with Electron and React and runs in an always-on-top transparent window.

### Features

- Real-time local speech-to-text with **Vosk** for Brazilian Portuguese and English.
- System-audio or microphone capture through `parec` (PulseAudio/PipeWire).
- Screen OCR with `Ctrl+Shift+S` for adding problem statements or code to the context.
- AI prompts for algorithms, projects, resume context, and behavioral communication.
- Routing across **Gemini**, local **Ollama**, **Claude**, and **OpenAI**.
- Local JSON session history in `interviews/`.
- Frameless, always-on-top window with click-through mode during a session.

### Prerequisites

- Linux with PulseAudio or PipeWire and the `parec` command.
- Node.js 20 and npm (see `.nvmrc`).
- Separately downloaded Vosk models:
  - Portuguese in `vosk-model-pt/`;
  - English in `vosk-model/`.
- One configured AI option: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or a local Ollama instance running `gemma2:2b`.

### Installation

```bash
git clone git@github.com:BulletSentence/ai-interview-copilot.git
cd ai-interview-copilot
nvm use
npm install
cp .env.example .env
```

Add credentials for the cloud providers you want to use to `.env`:

```env
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

For local generation, install Ollama and download the model:

```bash
ollama pull gemma2:2b
```

Extract the Vosk language models into the folders listed in [Prerequisites](#prerequisites).

### Usage

```bash
npm run dev
```

1. Enter the candidate profile, target role, job description, and optionally resume text.
2. Select the transcription language and enable Ollama to prioritize the local model.
3. Click **Iniciar entrevista** to start with system-audio capture.
4. Switch to **MIC** when microphone input is needed.
5. Press `Ctrl+Shift+S` to capture the screen and run OCR.
6. Stop the session to save history under `interviews/`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the app in development mode. |
| `npm run lint` | Runs ESLint. |
| `npm run format` | Formats with Prettier. |
| `npm run build` | Creates production files. |
| `npm run build:linux` | Builds AppImage, Snap, and DEB packages. |
| `npm run build:win` | Builds the Windows package. |
| `npm run build:mac` | Builds the macOS package. |

### Privacy

Vosk transcription is local. When using a cloud AI provider, session context — including transcription, OCR output, and form data — may be sent to that provider to generate a response. Do not include sensitive information without authorization.

## License

No license has been defined yet. Add one before distributing the project or accepting external contributions.
