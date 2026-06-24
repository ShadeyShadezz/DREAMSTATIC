'use client'

import { RefObject } from 'react'

interface Props {
  image: string | null
  imagePalette: string[]
  autoTags: string[]
  extracting: boolean
  error: string
  onImageSelect: (file: File) => void
  onRemoveImage: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
}

export default function ImageTool({
  image, imagePalette, autoTags, extracting, error,
  onImageSelect, onRemoveImage, fileInputRef,
}: Props) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onImageSelect(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onImageSelect(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>
          Upload Mood Image
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)' }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--foreground)' }}
          onDrop={handleDrop}
          onClick={() => !image && !extracting && fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--foreground)',
            padding: '24px', textAlign: 'center', cursor: image ? 'default' : 'pointer',
            background: 'var(--muted)', transition: 'border-color 0.15s',
          }}
        >
          {extracting ? (
            <p className="mono" style={{ color: 'var(--muted-foreground)' }}>Extracting colors...</p>
          ) : image ? (
            <div style={{ position: 'relative' }}>
              <img src={image} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '160px', border: '2px solid var(--foreground)' }} />
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveImage() }}
                style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  background: 'var(--destructive)', color: 'var(--destructive-foreground)',
                  border: '2px solid var(--foreground)', padding: '2px 8px',
                  cursor: 'pointer', fontWeight: 700, fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Drop image or click to browse
              </p>
              <p className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                Colors & tags extracted automatically
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px', background: 'var(--destructive)',
          color: 'var(--destructive-foreground)',
          border: '2px solid var(--foreground)', fontSize: '12px', fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {imagePalette.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
            Extracted Palette
          </p>
          <div className="palette-row" style={{ height: '28px' }}>
            {imagePalette.map((c, i) => (
              <div key={`${c}-${i}`} className="color-swatch" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </div>
      )}

      {autoTags.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
            Suggested Tags
          </p>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {autoTags.map(t => (
              <span key={t} className="filter-tag active" style={{ fontSize: '10px', padding: '3px 8px' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
        Max 6MB · JPEG/PNG/GIF
      </p>
    </div>
  )
}
