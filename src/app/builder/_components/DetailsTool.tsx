'use client'

interface Props {
  name: string
  description: string
  templateLoaded: boolean
  submitError: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
}

export default function DetailsTool({
  name, description, templateLoaded, submitError,
  onNameChange, onDescriptionChange,
}: Props) {
  const MAX_NAME_LENGTH = 80

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
        Room Details
      </p>

      {templateLoaded && (
        <p className="mono" style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>
          ✓ Template loaded — fields prefilled
        </p>
      )}

      <div>
        <div className="field-label" style={{ marginBottom: '6px' }}>Room Name</div>
        <input
          type="text"
          className="input-field"
          placeholder="Untitled Room"
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, MAX_NAME_LENGTH))}
          maxLength={MAX_NAME_LENGTH}
          style={{ minHeight: '44px', fontSize: '14px' }}
        />
        <div className="mono" style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginTop: '4px' }}>
          {name.trim().length}/{MAX_NAME_LENGTH}{!name.trim() ? ' • Will save as "Untitled Room"' : ''}
        </div>
      </div>

      <div>
        <div className="field-label" style={{ marginBottom: '6px' }}>Description (Optional)</div>
        <textarea
          className="input-field"
          placeholder="Add a short description for your room vibe..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
          maxLength={500}
          style={{ minHeight: '120px', resize: 'vertical', fontSize: '14px' }}
        />
        <div className="mono" style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginTop: '4px' }}>
          {description.trim().length}/500
        </div>
      </div>

      {submitError && (
        <div style={{
          padding: '12px', background: 'var(--destructive)',
          color: 'var(--destructive-foreground)',
          border: '2px solid var(--foreground)', fontSize: '13px', fontWeight: 600,
        }}>
          {submitError}
        </div>
      )}

      <p className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
        Use top-right actions to save private or publish publicly.
      </p>
    </div>
  )
}
