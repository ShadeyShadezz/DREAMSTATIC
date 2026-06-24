'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { MUSIC_LIBRARY, MusicTrack } from '../_lib/music'

export default function MusicPage() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const genres = ['All', ...Array.from(new Set(MUSIC_LIBRARY.map(t => t.genre)))]

  const filtered = MUSIC_LIBRARY.filter(t => {
    if (genre !== 'All' && t.genre !== genre) return false
    if (search) {
      const q = search.toLowerCase()
      return t.track.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    }
    return true
  })

  const togglePlay = (track: MusicTrack) => {
    if (playing === track.id) {
      audioRef.current?.pause()
      setPlaying(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(track.previewUrl)
    audio.volume = 0.5
    audio.onended = () => setPlaying(null)
    audio.play().catch(() => {})
    audioRef.current = audio
    setPlaying(track.id)
  }

  return (
    <div className="container" style={{ padding: '40px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
          Music Library
        </h1>
        <p className="mono" style={{ color: 'var(--muted-foreground)', marginTop: '8px' }}>
          BROWSE_TRACKS // {MUSIC_LIBRARY.length} available
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Search tracks or artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {genres.map(g => (
            <button
              key={g}
              className={`filter-tag ${genre === g ? 'active' : ''}`}
              onClick={() => setGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(track => (
          <div
            key={track.id}
            className="surface"
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px',
              border: playing === track.id ? '2px solid var(--primary)' : '2px solid var(--foreground)',
            }}
          >
            <div style={{
              width: '56px', height: '56px', flexShrink: 0,
              border: '2px solid var(--foreground)', overflow: 'hidden',
            }}>
              <img src={track.artwork} alt={track.track} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{track.track}</div>
              <div className="mono" style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{track.artist}</div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>{track.genre}</div>
            </div>
            <div className="mono" style={{ fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
              {track.duration}s
            </div>
            <button
              className="play-btn"
              onClick={() => togglePlay(track)}
              style={{ width: '40px', height: '40px', flexShrink: 0 }}
              title={playing === track.id ? 'Stop' : 'Preview'}
            >
              {playing === track.id ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
            <Link
              href={`/builder?track=${track.id}`}
              className="btn"
              style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', flexShrink: 0 }}
            >
              Use in Builder
            </Link>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--foreground)' }}>
          <p className="mono" style={{ color: 'var(--muted-foreground)' }}>No tracks match your search.</p>
        </div>
      )}
    </div>
  )
}
