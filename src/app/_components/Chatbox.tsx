'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chatbox() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hey! I\'m DreamAI. Ask me for room name ideas, color palette suggestions, or design inspiration. I don\'t collect any of your data.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to get response')
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '56px', height: '56px',
          background: 'var(--primary)', color: 'var(--primary-foreground)',
          border: '3px solid var(--foreground)',
          boxShadow: '4px 4px 0 var(--foreground)',
          cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', fontWeight: 900,
        }}
        title="DreamAI Chat"
      >
        {open ? '✕' : 'AI'}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '92px', right: '24px',
          width: '380px', height: '520px',
          background: 'var(--card)', zIndex: 999,
          border: '3px solid var(--foreground)',
          boxShadow: '8px 8px 0 var(--foreground)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px', background: 'var(--foreground)', color: 'var(--background)',
            fontWeight: 700, fontSize: '14px', textTransform: 'uppercase',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>DreamAI // Chat</span>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>NO DATA COLLECTED</span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {messages.map((msg, i) => (
              <div key={`${i}-${msg.role}`} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--muted)',
                  color: msg.role === 'user' ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: '2px solid var(--foreground)',
                  fontSize: '14px', lineHeight: 1.4,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px', background: 'var(--muted)',
                  border: '2px solid var(--foreground)',
                  fontSize: '14px',
                }}>
                  Thinking...
                </div>
              </div>
            )}
            {error && (
              <div style={{
                padding: '8px 12px', background: 'var(--destructive)',
                color: 'var(--destructive-foreground)',
                border: '2px solid var(--foreground)', fontSize: '12px', fontWeight: 600,
              }}>
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px', borderTop: '2px solid var(--foreground)',
            display: 'flex', gap: '8px',
          }}>
            <input
              type="text"
              className="input-field"
              style={{ minHeight: 'auto', flex: 1, padding: '10px 12px' }}
              placeholder="Ask DreamAI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn"
              style={{ width: 'auto', padding: '10px 16px', opacity: loading || !input.trim() ? 0.5 : 1 }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}
