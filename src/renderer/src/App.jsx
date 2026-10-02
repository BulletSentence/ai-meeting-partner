import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function App() {
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(true)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    jobRole: '',
    jobDescription: '',
    cvText: '',
    language: 'pt-BR',
    useOllama: false
  })

  // History Log States
  const [savedSessions, setSavedSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)

  // HUD State
  const [transcription, setTranscription] = useState('')
  const [transcriptionHistory, setTranscriptionHistory] = useState([])
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiProvider, setAiProvider] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioSource, setAudioSource] = useState('SYSTEM')
  const transcriptEndRef = useRef(null)

  // Load saved sessions when returning to the setup screen
  const loadSavedSessions = async () => {
    try {
      const sessions = await window.api.getSavedSessions()
      setSavedSessions(sessions)
    } catch (err) {
      console.error('Error loading saved sessions:', err)
    }
  }

  useEffect(() => {
    if (!isSetupComplete) {
      loadSavedSessions()
    }
  }, [isSetupComplete])

  useEffect(() => {
    // Listen for speech-to-text transcriptions
    window.api.onTranscription((text) => {
      setTranscription(text)
      setTranscriptionHistory((prev) => [...prev, text])
    })

    // Listen for AI assistant updates
    window.api.onAiAnswer((data) => {
      if (data && typeof data === 'object') {
        setAiAnswer(data.answer)
        setAiProvider(data.provider)
      }
    })

    // Listen for lock/unlock changes via hotkey toggle
    window.api.onWindowLockChange((unlocked) => {
      setIsUnlocked(unlocked)
    })

    // Listen for audio levels
    window.api.onAudioLevel((level) => {
      setAudioLevel(level)
    })
  }, [])

  // Auto-scroll the live transcript view to the latest entry
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcriptionHistory, transcription])

  const handleStart = () => {
    window.api.startInterview(formData)
    setIsSetupComplete(true)
  }

  const handleStop = () => {
    window.api.stopInterview()
    setTranscription('')
    setTranscriptionHistory([])
    setAiAnswer('')
    setAiProvider('')
    setAudioLevel(0)
    setAudioSource('SYSTEM')
    setIsSetupComplete(false)
  }

  const handleToggleDoubt = () => {
    const nextSource = audioSource === 'SYSTEM' ? 'MIC' : 'SYSTEM'
    setAudioSource(nextSource)
    window.api.toggleAudioSource(nextSource.toLowerCase())
  }

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    color: '#ffffff',
    padding: '10px 14px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
  }

  if (!isSetupComplete) {
    return (
      <div style={{
        width: '860px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15, 15, 20, 0.95)',
        backdropFilter: 'blur(30px)',
        borderRadius: '28px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        padding: '24px 30px 20px 30px',
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <style>{`
          .markdown-content p {
            margin: 0 0 10px 0;
          }
          .markdown-content ul, .markdown-content ol {
            margin: 0 0 10px 0;
            padding-left: 20px;
          }
          .markdown-content li {
            margin-bottom: 6px;
          }
          .markdown-content code {
            background: rgba(255, 255, 255, 0.08);
            color: #22d3ee;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 0.85em;
          }
          .markdown-content pre {
            background: rgba(0, 0, 0, 0.25);
            padding: 12px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 12px 0;
            border: 1px solid rgba(255, 255, 255, 0.04);
          }
          .markdown-content pre code {
            background: transparent;
            color: #e2e8f0;
            padding: 0;
            border-radius: 0;
            font-size: 0.85em;
          }
          .markdown-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 12px 0;
          }
          .markdown-content th, .markdown-content td {
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 8px 12px;
            text-align: left;
            font-size: 0.85rem;
          }
          .markdown-content th {
            background: rgba(255, 255, 255, 0.03);
            color: #22d3ee;
            font-weight: 600;
          }
          
          /* Custom scrollbar styles */
          ::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>

        {/* Drawer overlay for inspecting a past session */}
        {selectedSession && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 10, 15, 0.98)',
            borderRadius: '28px',
            padding: '30px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#22d3ee', fontWeight: '700' }}>
                  📂 Histórico da sessão: {selectedSession.data.candidate.jobRole}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Gravada em {new Date(selectedSession.data.timestamp).toLocaleString('pt-BR')} para {selectedSession.data.candidate.name}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                Fechar
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
              {/* Left Box: Transcript history */}
              <div style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.01)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                overflowY: 'auto'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#cbd5e1', fontWeight: '600' }}>🎙️ Histórico completo da transcrição</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedSession.data.conversationHistory
                    .filter(msg => msg.role === 'user')
                    .map((msg, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
                        {msg.content}
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Box: AI responses */}
              <div style={{
                flex: 1.2,
                background: 'rgba(34, 211, 238, 0.01)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(34, 211, 238, 0.04)',
                overflowY: 'auto'
              }} className="markdown-content">
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#22d3ee', fontWeight: '600' }}>🧠 Sugestões geradas pela IA</h4>
                {selectedSession.data.conversationHistory
                  .filter(msg => msg.role === 'model' || msg.role === 'assistant')
                  .map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Config Form Fields */}
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', color: '#22d3ee', fontWeight: '700', letterSpacing: '0.5px' }}>
            🛸 Configuração do Copilot
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#64748b' }}>
            Preencha seu perfil e os detalhes da entrevista antes de iniciar.
          </p>

          <div style={{ display: 'flex', gap: '30px' }}>
            {/* Left Form Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex.: João da Silva"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Faculdade / Universidade</label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="Ex.: Universidade de São Paulo"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Cargo desejado</label>
                <input
                  type="text"
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  placeholder="Ex.: Desenvolvedor Full Stack Sênior"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Idioma das transcrições e respostas</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  style={inputStyle}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">Inglês (Estados Unidos)</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="useOllama"
                  checked={formData.useOllama || false}
                  onChange={(e) => setFormData({ ...formData, useOllama: e.target.checked })}
                  style={{
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                    accentColor: '#22d3ee',
                  }}
                />
                <label htmlFor="useOllama" style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', cursor: 'pointer' }}>
                  Usar modelo local do Ollama (gemma2:2b / offline)
                </label>
              </div>
            </div>

            {/* Right Form Column */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Descrição da vaga</label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Cole a descrição da vaga ou o foco técnico principal..."
                  style={{ ...inputStyle, height: '70px', resize: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Currículo / resumo profissional</label>
                <textarea
                  value={formData.cvText}
                  onChange={(e) => setFormData({ ...formData, cvText: e.target.value })}
                  placeholder="Cole experiências, destaques e projetos do seu currículo..."
                  style={{ ...inputStyle, height: '70px', resize: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Saved Sessions list at the bottom */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
            📂 Histórico de sessões salvas
          </h4>
          <div style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {savedSessions.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '10px 0' }}>
                Nenhuma sessão salva. Inicie uma entrevista para registrar uma.
              </div>
            ) : (
              savedSessions.map((session, index) => (
                <div 
                  key={index} 
                  onClick={() => setSelectedSession(session)}
                  style={{
                    flexShrink: 0,
                    width: '230px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {session.data.candidate.jobRole}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    {session.data.candidate.name} • {session.data.candidate.college}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>
                    {new Date(session.data.timestamp).toLocaleDateString('pt-BR')} às {new Date(session.data.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={handleStart}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 28px',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.5)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 14px rgba(6, 182, 212, 0.35)'}
          >
            🚀 Iniciar entrevista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '860px',
      height: '600px',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(15, 15, 20, 0.82)',
      backdropFilter: 'blur(25px)',
      borderRadius: '28px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      overflow: 'hidden'
    }}>
      <style>{`
        .window-control-btn {
          -webkit-app-region: no-drag !important;
          cursor: pointer !important;
          font-family: monospace !important;
          font-size: 0.85rem !important;
          padding: 2px 6px !important;
          user-select: none !important;
        }

        .markdown-content p {
          margin: 0 0 10px 0;
        }
        .markdown-content ul, .markdown-content ol {
          margin: 0 0 10px 0;
          padding-left: 20px;
        }
        .markdown-content li {
          margin-bottom: 6px;
        }
        .markdown-content code {
          background: rgba(255, 255, 255, 0.08);
          color: #22d3ee;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 0.85em;
        }
        .markdown-content pre {
          background: rgba(0, 0, 0, 0.25);
          padding: 12px;
          border-radius: 10px;
          overflow-x: auto;
          margin: 12px 0;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .markdown-content pre code {
          background: transparent;
          color: #e2e8f0;
          padding: 0;
          border-radius: 0;
          font-size: 0.85em;
        }
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        .markdown-content th, .markdown-content td {
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 12px;
          text-align: left;
          font-size: 0.85rem;
        }
        .markdown-content th {
          background: rgba(255, 255, 255, 0.03);
          color: #22d3ee;
          font-weight: 600;
        }
      `}</style>

      {/* Draggable Top Bar */}
      <div 
        onMouseEnter={() => window.api.setWindowInteractive()}
        onMouseLeave={() => window.api.setWindowClickthrough()}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          height: '32px',
          background: 'rgba(30, 41, 59, 0.98)',
          borderBottom: '2px solid #22d3ee',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(34, 211, 238, 0.15)',
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: '600' }}>
          🛸 Copilot de entrevista com IA (passe o mouse aqui para arrastar ou redimensionar)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', WebkitAppRegion: 'no-drag' }}>
          <span
            onClick={handleStop}
            className="window-control-btn"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              marginRight: '8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              WebkitAppRegion: 'no-drag'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.25)'
              e.target.style.transform = 'scale(1.03)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.12)'
              e.target.style.transform = 'scale(1.0)'
            }}
          >
            ⏹ Encerrar sessão
          </span>
          <button
            onClick={() => window.api.minimize()}
            className="window-control-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '4px 8px',
              transition: 'color 0.2s, transform 0.2s',
              WebkitAppRegion: 'no-drag'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#22d3ee'
              e.target.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#cbd5e1'
              e.target.style.transform = 'scale(1.0)'
            }}
          >
            [ ─ ]
          </button>
          <button
            onClick={() => window.api.maximize()}
            className="window-control-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '4px 8px',
              transition: 'color 0.2s, transform 0.2s',
              WebkitAppRegion: 'no-drag'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#22d3ee'
              e.target.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#cbd5e1'
              e.target.style.transform = 'scale(1.0)'
            }}
          >
            [ ▢ ]
          </button>
          <button
            onClick={() => window.api.close()}
            className="window-control-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '4px 8px',
              transition: 'color 0.2s, transform 0.2s',
              WebkitAppRegion: 'no-drag'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ef4444'
              e.target.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#f87171'
              e.target.style.transform = 'scale(1.0)'
            }}
          >
            [ ✕ ]
          </button>
        </div>
      </div>

      {/* Main HUD Dashboard */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '20px',
        padding: '24px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Left Column: Live Audio Transcription History */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '18px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎙️</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#cbd5e1', fontWeight: '600', letterSpacing: '0.5px' }}>
                Transcrição ao vivo
              </h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Audio Visualizer Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: audioSource === 'MIC' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 211, 238, 0.15)',
                border: audioSource === 'MIC' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: '20px',
                padding: '4px 10px',
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: audioSource === 'MIC' ? '#ef4444' : '#22d3ee',
                  transform: `scale(${1 + (audioLevel / 100) * 0.8})`,
                  boxShadow: audioSource === 'MIC' ? '0 0 10px #ef4444' : '0 0 10px #22d3ee',
                  transition: 'transform 0.1s ease-out'
                }} />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: audioSource === 'MIC' ? '#fca5a5' : '#99f6e4',
                  letterSpacing: '0.5px'
                }}>
                  {audioSource}
                </span>
              </div>

              {/* Ask Doubt Button */}
              <button
                onClick={handleToggleDoubt}
                style={{
                  background: audioSource === 'MIC' 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: audioSource === 'MIC' 
                    ? 'none' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: audioSource === 'MIC' 
                    ? '0 4px 12px rgba(239, 68, 68, 0.35)' 
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)'
                  if (audioSource !== 'MIC') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1.0)'
                  if (audioSource !== 'MIC') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <span>🎙️</span>
                <span>{audioSource === 'MIC' ? 'Cancelar' : 'Perguntar'}</span>
              </button>
            </div>
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {transcriptionHistory.map((text, index) => (
              <div key={index} style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: '1.5' }}>
                {text}
              </div>
            ))}
            {transcription && (
              <div style={{ fontSize: '1.05rem', color: '#4ade80', fontWeight: '600', lineHeight: '1.5' }}>
                {transcription}...
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Right Column: AI Copilot Assistant Suggestions */}
        <div style={{
          flex: 1.4,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(34, 211, 238, 0.02)',
          borderRadius: '18px',
          padding: '20px',
          border: '1px solid rgba(34, 211, 238, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🧠</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#22d3ee', fontWeight: '600', letterSpacing: '0.5px' }}>
                Sugestões da IA
              </h3>
            </div>
            {aiProvider && (
              <span style={{
                fontSize: '0.75rem',
                color: '#64748b',
                background: 'rgba(34, 211, 238, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(34, 211, 238, 0.15)',
                fontWeight: '500'
              }}>
                Fornecido por {aiProvider}
              </span>
            )}
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: '#f1f5f9',
            paddingRight: '6px'
          }} className="markdown-content">
            {aiAnswer ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnswer}</ReactMarkdown>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.9rem',
                textAlign: 'center',
                lineHeight: '1.6'
              }}>
                Ouvindo o áudio do sistema...<br />As sugestões e soluções da IA aparecerão aqui.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
