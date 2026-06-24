'use client'

const palettePresets = [
  ['#ff00ff', '#00ffff', '#1a1a2e', '#e94560', '#0f3460'],
  ['#d1d5db', '#9ca3af', '#4b5563', '#ef4444', '#111827'],
  ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
  ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#74b9ff'],
  ['#00ff00', '#003300', '#006600', '#009900', '#00cc00'],
  ['#ff9ff3', '#feca57', '#ff6b6b', '#48dbfb', '#1dd1a1'],
  ['#8e44ad', '#d35400', '#2c3e50', '#16a085', '#c0392b'],
  ['#f5f5dc', '#deb887', '#8b4513', '#a0522d', '#d2b48c'],
  ['#0a0a0a', '#1a1a2e', '#16213e', '#0f3460', '#e94560'],
]

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}

interface Props {
  palette: string[]
  imagePalette: string[]
  onPaletteChange: (palette: string[]) => void
}

export default function PaletteTool({ palette, imagePalette, onPaletteChange }: Props) {
  const replaceSwatch = (index: number) => {
    const next = [...palette]
    next[index] = randomHex()
    onPaletteChange(next)
  }

  const setSwatch = (index: number, color: string) => {
    const next = [...palette]
    next[index] = color
    onPaletteChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
            Palette
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {imagePalette.length > 0 && (
              <button
                onClick={() => onPaletteChange([...imagePalette])}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '10px' }}
              >
                From Image
              </button>
            )}
            <button
              onClick={() => onPaletteChange(Array.from({ length: palette.length || 5 }, () => randomHex()))}
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '10px' }}
            >
              Randomize
            </button>
          </div>
        </div>

        {palette.length > 0 ? (
          <div className="palette-row" style={{ height: '36px' }}>
            {palette.map((color, i) => (
              <div
                key={`${color}-${i}`}
                className="color-swatch"
                style={{ backgroundColor: color, position: 'relative' }}
                title={color}
              >
                <button
                  onClick={() => replaceSwatch(i)}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    border: 'none', cursor: 'pointer', padding: '2px 6px',
                    fontSize: '12px', opacity: 0, transition: 'opacity 0.15s',
                  }}
                  className="color-edit-btn"
                >
                  ↺
                </button>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setSwatch(i, e.target.value)}
                  style={{
                    position: 'absolute', bottom: '2px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px', height: '14px', padding: 0,
                    border: '1px solid var(--foreground)',
                    cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
                  }}
                  className="color-picker-btn"
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', border: '2px dashed var(--foreground)', background: 'var(--muted)' }}>
            <p className="mono" style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              No palette yet
            </p>
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase' }}>
          Presets
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {palettePresets.map((preset, i) => (
            <button
              key={i}
              onClick={() => onPaletteChange([...preset])}
              className="palette-row"
              style={{
                cursor: 'pointer', height: '24px',
                border: '2px solid var(--foreground)',
                outline: palette.join(',') === preset.join(',') ? '3px solid var(--primary)' : 'none',
                outlineOffset: '2px',
              }}
            >
              {preset.map((c, j) => (
                <div key={j} className="color-swatch" style={{ backgroundColor: c }} />
              ))}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .color-swatch:hover .color-edit-btn,
        .color-swatch:hover .color-picker-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
