import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are DreamAI, a creative assistant for the Dreamstatic404 app. You help users with:
- Room name suggestions
- Color palette ideas
- Tag recommendations (Y2K, Cyber, Liminal, Glitch, Synthwave, Hardware, Retro, Futuristic)
- Design inspiration for dream rooms
- General creative brainstorming

CRITICAL RULES:
- NEVER ask for, request, or store personal user data (name, email, location, etc.)
- NEVER log or remember any user inputs across sessions
- Keep responses creative, concise, and focused on room/design topics
- If asked about personal data, politely decline and redirect to design help
- Be enthusiastic and match the Y2K/brutalist aesthetic vibe`

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Truncate to prevent abuse
    const sanitizedMessage = message.trim().slice(0, 1000)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: sanitizedMessage },
      ],
      max_tokens: 500,
      temperature: 0.8,
    })

    const reply = completion.choices[0]?.message?.content || 'No response generated.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Chat service unavailable' }, { status: 500 })
  }
}
