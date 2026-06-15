import fs from 'fs/promises'
import { join } from 'path'

/**
 * Saves the interview session details, including transcripts and AI history.
 * @param {object} userData Configuration setup details.
 * @param {array} conversationHistory Rolling STT and AI history.
 */
export async function saveInterviewSession(userData, conversationHistory) {
  try {
    const dir = join(process.cwd(), 'interviews')
    // Create 'interviews' directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const filename = `interview_${timestamp}.json`
    const filePath = join(dir, filename)

    const sessionData = {
      timestamp: new Date().toISOString(),
      candidate: {
        name: userData?.name || 'N/A',
        college: userData?.college || 'N/A',
        jobRole: userData?.jobRole || 'N/A',
      },
      jobDescription: userData?.jobDescription || 'N/A',
      cvText: userData?.cvText || 'N/A',
      conversationHistory: conversationHistory || []
    }

    await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2), 'utf-8')
    console.log(`[Session Logger] Saved session file to: ${filePath}`)
  } catch (err) {
    console.error(`[Session Logger] Failed to save session: ${err.message}`)
  }
}
