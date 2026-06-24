'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { MUSIC_LIBRARY } from '../../_lib/music'

interface MusicData {
  track: string
  artist: string
  artwork: string
  previewUrl: string
}

interface Props {
  music: MusicData | null
  search: string
  onMusicChange: (music: MusicData | null) => void
  onSearchChange: (search: string) => void
}

const AUDIO_MB_LIMIT = 10
const AUDIO_BYTE_LIMIT = AUDIO_MB_LIMIT * 1024 * 1024

export default function MusicTool({ music, search, onMusicChange, onSearchChange }: Props) {
  const audioInputRef = useRef<HTMLInputElement>(null)

  const handleAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/')) return

    if (file.size > AUDIO_BYTE_LIMIT) {
      alert(`Audio file must be under ${AUDIO_MB_LIMIT} MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const name = file.name.replace(/\.[^/.]+$/, '')
      onMusicChange({
        track: name,
        artist: 'Uploaded',
        artwork: '',
        previewUrl: dataUrl,
      })
    }
    reader.onerror = () => {
      alert('Failed to read audio file.')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleAudioFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleAudioFile(file)
    e.target.value = ''
  }

  const filtered = MUSIC_LIBRARY.filter(
    t => !search || t.track.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
        Soundtrack
      </p>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)' }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--foreground)' }}
        onDrop={handleDrop}
        onClick={() => audioInputRef.current?.click()}
        style={{
          border: '2px dashed var(--foreground)',
          padding: '16px', textAlign: 'center', cursor: 'pointer',
          background: 'var(--muted)', transition: 'border-color 0.15s',
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
          Upload your own audio
        </p>
        <p className="mono" style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
          MP3, WAV, OGG, AAC &middot; Max {AUDIO_MB_LIMIT}MB
        </p>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        color: 'var(--muted-foreground)', fontSize: '11px',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }} />
        <span className="mono">or choose from library</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--foreground)' }} />
      </div>

      <input
        type="text"
        className="input-field"
        placeholder="Search tracks..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ minHeight: '40px', fontSize: '13px' }}
      />

      {music && (
        <div style={{
          padding: '12px', background: 'var(--secondary)',
          border: '2px solid var(--foreground)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          {music.artwork ? (
            <img src={music.artwork} alt="" style={{ width: '40px', height: '40px', border: '2px solid var(--foreground)' }} />
          ) : (
            <div style={{
              width: '40px', height: '40px', border: '2px solid var(--foreground)',
              background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
            }}>
              ♪
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {music.track}
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--secondary-foreground)' }}>
              {music.artist}
            </div>
          </div>
          <button
            onClick={() => onMusicChange(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 700, padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
        {filtered.map(track => {
          const selected = music?.track === track.track && music?.artist === track.artist
          return (
            <button
              key={track.id}
              onClick={() => onMusicChange(selected ? null : { track: track.track, artist: track.artist, artwork: track.artwork, previewUrl: track.previewUrl })}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px', background: selected ? 'var(--secondary)' : 'var(--card)',
                border: '2px solid var(--foreground)', cursor: 'pointer',
                textAlign: 'left', width: '100%', transition: 'all 0.1s',
              }}
            >
              <img src={track.artwork} alt="" style={{ width: '36px', height: '36px', border: '2px solid var(--foreground)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.track}
                </div>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  {track.artist}
                </div>
              </div>
              <div style={{
                width: '28px', height: '28px',
                background: selected ? 'var(--success)' : 'var(--foreground)',
                color: selected ? 'var(--success-foreground)' : 'var(--background)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px', flexShrink: 0,
              }}>
                {selected ? '✓' : '+'}
              </div>
            </button>
          )
        })}
      </div>

      <Link href="/music" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', textAlign: 'center' }}>
        Browse Full Library →
      </Link>
    </div>
  )
}
