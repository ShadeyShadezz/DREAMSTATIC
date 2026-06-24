'use client'

import { ReactNode } from 'react'

export type ToolKey = 'image' | 'palette' | 'tags' | 'music' | 'details'

interface Props {
  activeTool: ToolKey
  onToolChange: (tool: ToolKey) => void
  children: ReactNode
}

const tools: { key: ToolKey; label: string; icon: string }[] = [
  { key: 'image', label: 'Image', icon: '🖼' },
  { key: 'palette', label: 'Palette', icon: '🎨' },
  { key: 'tags', label: 'Tags', icon: '🏷' },
  { key: 'music', label: 'Music', icon: '🎵' },
  { key: 'details', label: 'Details', icon: '⚙️' },
]

export default function Sidebar({ activeTool, onToolChange, children }: Props) {
  return (
    <div style={{
      width: '340px', flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '2px',
        background: 'var(--muted)', border: '2px solid var(--foreground)',
      }}>
        {tools.map(t => {
          const active = t.key === activeTool
          return (
            <button
              key={t.key}
              onClick={() => onToolChange(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 16px',
                background: active ? 'var(--card)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                border: 'none', borderBottom: '2px solid var(--foreground)',
                cursor: 'pointer', fontSize: '14px', fontWeight: active ? 700 : 500,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                textAlign: 'left', transition: 'all 0.1s',
              }}
            >
              <span style={{ fontSize: '18px' }}>{t.icon}</span>
              {t.label}
              {active && (
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>▼</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="surface" style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
