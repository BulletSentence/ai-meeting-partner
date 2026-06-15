import { GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Gemini client with fallback
const geminiApiKey = process.env.GEMINI_API_KEY || 'DUMMY_KEY_FOR_STARTUP'
const ai = new GoogleGenAI({ apiKey: geminiApiKey })

let dynamicSystemInstruction = ''
let conversationHistory = []
let useOllama = false

/**
 * Configures the AI system instruction and resets the conversation history.
 * @param {object} userData Data containing candidate profile and target job role.
 */
export function configureAI(userData) {
  const { name, college, jobRole, jobDescription, cvText } = userData

  dynamicSystemInstruction = `
You are a high-speed live interview copilot for ${name || 'the candidate'}. Your outputs must be ultra-crisp, clear, bulleted talking points, and limited to a maximum of 3 sentences or 60 words per response. Avoid verbose blocks of text.

Candidate Context:
- Name: ${name || 'N/A'}
- College: ${college || 'N/A'}
- Target Job Role: ${jobRole || 'Software Engineer'}

Job Description:
${jobDescription || 'Technical software engineering interview.'}

Candidate CV/Resume:
${cvText || 'No CV text provided.'}

You must evaluate the complete engineering interview canvas: seamlessly validate CV-specific technical projects (like smart data loggers or automated image pipelines), technical stack conceptual questions, and behavioral communication, instead of only tracking code syntax.

Focus on:
1. Coding Challenges: Suggest optimal data structures, algorithmic design, and pseudo-code templates (JS/Python/C++).
2. CV Projects & Concept Deep-Dives: Provide talking points for CV projects, architecture cues, and technical stack details.
3. Behavioral & Soft Skills: Communication tips matching the STAR method (Situation, Task, Action, Result).
4. Complexities: State optimal time/space complexity (e.g. O(N), O(1)) in bold.
`
  // Set toggle for Ollama local usage
  useOllama = userData?.useOllama === true
  
  // Clear conversation history for new interview session
  conversationHistory = []
  console.log(`[AI Service] Configured prompt (Ollama: ${useOllama}) and reset history for candidate: ${name || 'Unknown'}`)
}

/**
 * Calls local Ollama service.
 * @param {string} systemInstruction System prompt instructions.
 * @param {array} conversationHistory History messages.
 * @returns {Promise<string>} The response text from Ollama.
 */
async function callOllama(systemInstruction, conversationHistory) {
  const prompt = `${systemInstruction}\n\nConversation History:\n${conversationHistory.map(m => `${m.role === 'model' || m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n')}\n\nAI:`
  
  console.log('[AI Service] Attempting local text generation via Ollama (gemma2:2b)...')
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma2:2b',
      prompt: prompt,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.response ? data.response.trim() : ''
}

/**
 * Generates real-time interview helper tips with automatic fallback across providers, utilizing rolling context history.
 * @param {string} transcriptText The collected transcript text.
 * @param {function(string, string)} onAnswerReady Callback triggered with the AI-generated help text and provider name.
 */
export async function generateInterviewHelp(transcriptText, onAnswerReady) {
  // Push the current chunk/screen text context to conversation history
  conversationHistory.push({ role: 'user', content: transcriptText })

  // Restrict history buffer size to the last 20 messages
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20)
  }

  // If local Ollama toggle is forced, attempt direct local routing
  if (useOllama) {
    try {
      const text = await callOllama(dynamicSystemInstruction, conversationHistory)
      if (text) {
        conversationHistory.push({ role: 'model', content: text })
        onAnswerReady(text, 'Ollama Local')
        return
      }
      throw new Error('Ollama returned an empty response.')
    } catch (ollamaErr) {
      console.warn(`[AI Service] Direct Ollama call failed: ${ollamaErr.message}. Falling back to cascade...`)
    }
  }

  // Primary: Try Gemini 2.5 Flash with 5000ms timeout
  try {
    console.log('[AI Service] Attempting text generation with Gemini 2.5 Flash (5s Timeout)...')
    
    // Map history to the required parts array structure of Gemini SDK
    const geminiContents = conversationHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }))

    const geminiCall = (async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: geminiContents,
        config: {
          systemInstruction: dynamicSystemInstruction || 'Act as a coding interview copilot.'
        }
      })
      const text = response.text || (response.candidates && response.candidates[0].content.parts[0].text)
      if (!text) {
        throw new Error('Gemini returned an empty response.')
      }
      return text
    })()

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Gemini request timed out after 5000ms'))
      }, 5000)
    })

    const text = await Promise.race([geminiCall, timeoutPromise])
    conversationHistory.push({ role: 'model', content: text })
    onAnswerReady(text, 'Gemini 2.5 Flash')
    return
  } catch (geminiErr) {
    console.warn(`[AI Service] Gemini failed or timed out: ${geminiErr.message}. Falling back to Ollama...`)

    // Secondary: Try local Ollama instance
    try {
      const text = await callOllama(dynamicSystemInstruction, conversationHistory)
      if (text) {
        conversationHistory.push({ role: 'model', content: text })
        onAnswerReady(text, 'Ollama Local')
        return
      }
      throw new Error('Ollama returned an empty response.')
    } catch (ollamaErr) {
      console.warn(`[AI Service] Ollama fallback failed: ${ollamaErr.message}. Falling back to Claude...`)

      // Tertiary: Try Anthropic Claude 3.5 Sonnet
      try {
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY
        if (!anthropicApiKey) {
          throw new Error('ANTHROPIC_API_KEY is not defined.')
        }

        console.log('[AI Service] Attempting text generation with Claude 3.5 Sonnet...')
        const anthropic = new Anthropic({ apiKey: anthropicApiKey })
        
        const anthropicMessages = conversationHistory.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content
        }))

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 1024,
          system: dynamicSystemInstruction || 'Act as a coding interview copilot.',
          messages: anthropicMessages
        })

        const text = response.content[0].text
        if (text) {
          conversationHistory.push({ role: 'model', content: text })
          onAnswerReady(text, 'Claude 3.5 Sonnet')
          return
        }
        throw new Error('Anthropic returned an empty response.')
      } catch (anthropicErr) {
        console.warn(`[AI Service] Anthropic failed: ${anthropicErr.message}. Trying OpenAI...`)

        // Quaternary: Try OpenAI GPT-4o Mini
        try {
          const openaiApiKey = process.env.OPENAI_API_KEY
          if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY is not defined.')
          }

          console.log('[AI Service] Attempting text generation with GPT-4o Mini...')
          const openai = new OpenAI({ apiKey: openaiApiKey })
          
          const openaiMessages = [
            { role: 'system', content: dynamicSystemInstruction || 'Act as a coding interview copilot.' },
            ...conversationHistory.map(msg => ({
              role: msg.role === 'model' ? 'assistant' : msg.role,
              content: msg.content
            }))
          ]

          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: openaiMessages
          })

          const text = response.choices[0].message.content
          if (text) {
            conversationHistory.push({ role: 'model', content: text })
            onAnswerReady(text, 'GPT-4o Mini')
            return
          }
          throw new Error('OpenAI returned an empty response.')
        } catch (openaiErr) {
          console.error(`[AI Service] All AI Fallback layers exhausted. Final error: ${openaiErr.message}`)
        }
      }
    }
  }
}

/**
 * Returns the rolling conversation history buffer.
 * @returns {array} The current conversation history.
 */
export function getConversationHistory() {
  return conversationHistory
}
