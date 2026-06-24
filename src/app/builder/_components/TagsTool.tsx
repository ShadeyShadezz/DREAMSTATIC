'use client'

import { ALL_TAGS } from '../../_lib/tags'

interface Props {
  tags: string[]
  autoTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function TagsTool({ tags, autoTags, onTagsChange }: Props) {
  const toggleTag = (tag: string) => {
    onTagsChange(
      tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
        Select Tags
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {ALL_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`filter-tag ${tags.includes(tag) ? 'active' : ''}`}
            style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 10px' }}
          >
            {tag}
          </button>
        ))}
      </div>

      {autoTags.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
            Auto-detected from image
          </p>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {autoTags.map(t => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`filter-tag ${tags.includes(t) ? 'active' : ''}`}
                style={{ cursor: 'pointer', fontSize: '10px', padding: '3px 8px', opacity: 0.85 }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
        {tags.length} tag{tags.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  )
}
