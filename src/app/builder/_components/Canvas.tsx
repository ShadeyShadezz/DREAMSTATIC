'use client'

import { useRef, useState, useEffect } from 'react'

interface RoomData {
  image: string | null
  imagePalette: string[]
  autoTags: string[]
  music: { track: string; artist: string; artwork: string; previewUrl: string } | null
  palette: string[]
  name: string
  tags: string[]
}

interface Props {
  roomData: RoomData
  imagePosition: { x: number; y: number }
  coverZoom: number
  onPositionChange: (pos: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  showElements: { name: boolean; palette: boolean; music: boolean; tags: boolean }
  onShowElementsChange: (els: { name: boolean; palette: boolean; music: boolean; tags: boolean }) => void
}

export default function Canvas({ roomData, imagePosition, coverZoom, onPositionChange, onZoomChange, showElements, onShowElementsChange }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const displayPalette = roomData.palette.length > 0 ? roomData.palette : roomData.imagePalette
  const displayName = roomData.name.trim() || 'Untitled Room'

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !roomData.music) return

    const onTimeUpdate = () => {
      setProgress(audio.currentTime / (audio.duration || 1))
    }
    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [roomData.music])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '2px solid var(--foreground)', paddingBottom: '12px',
      }}>
        <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
          Room Cover Preview
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {(['name', 'palette', 'music', 'tags'] as const).map(el => (
            <label key={el} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
              <input
                type="checkbox"
                checked={showElements[el]}
                onChange={() => onShowElementsChange({ ...showElements, [el]: !showElements[el] })}
                style={{ accentColor: 'var(--primary)' }}
              />
              {el}
            </label>
          ))}
        </div>
      </div>

      {/* Cover display */}
      <div style={{
        width: '100%', maxWidth: `${coverZoom * 480}px`,
        margin: '0 auto', transition: 'max-width 0.2s',
      }}>
        <div className="room-card pixel-border" style={{ background: 'var(--card)' }}>
          <div className="room-image-container" style={{
            height: `${coverZoom * 280}px`,
            position: 'relative', overflow: 'hidden',
            borderBottom: '2px solid var(--foreground)',
            transition: 'height 0.2s',
          }}>
            {roomData.image ? (
              <img
                src={roomData.image}
                alt="Room cover"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                }}
              />
            ) : displayPalette.length >= 3 ? (
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(135deg, ${displayPalette.slice(0, 3).join(', ')})`,
              }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--muted)' }} />
            )}

            {showElements.tags && roomData.tags.length > 0 && (
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {roomData.tags.slice(0, 3).map(t => (
                  <span key={t} className="room-tag" style={{ position: 'static', fontSize: '10px' }}>{t}</span>
                ))}
              </div>
            )}

            {showElements.name && (
              <div style={{
                position: 'absolute', bottom: '12px', left: '12px', right: '12px',
                background: 'rgba(0,0,0,0.6)', padding: '8px 12px',
              }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: `${coverZoom * 18}px`, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                  {displayName}
                </div>
              </div>
            )}
          </div>

          <div className="room-content" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {showElements.palette && displayPalette.length > 0 && (
              <div className="palette-row" style={{ height: '28px' }}>
                {displayPalette.map((c, i) => (
                  <div key={`${c}-${i}`} className="color-swatch" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            )}

            {showElements.music && roomData.music && (
              <div className="music-player" style={{ padding: '8px 12px', position: 'relative' }}>
                {playing && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                    background: 'var(--muted)',
                  }}>
                    <div style={{
                      height: '100%', width: `${progress * 100}%`,
                      background: 'var(--primary)', transition: 'width 0.15s linear',
                    }} />
                  </div>
                )}
                <audio ref={audioRef} src={roomData.music.previewUrl} preload="auto" style={{ display: 'none' }} />
                <div className="music-artwork">
                  {roomData.music.artwork ? (
                    <img src={roomData.music.artwork} alt="Album art" style={{ width: '36px', height: '36px' }} />
                  ) : (
                    <div style={{
                      width: '36px', height: '36px', border: '2px solid var(--foreground)',
                      background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0,
                    }}>
                      ♪
                    </div>
                  )}
                </div>
                <div className="music-info">
                  <div className="music-track" style={{ fontSize: '12px' }}>{roomData.music.track}</div>
                  <div className="music-artist" style={{ fontSize: '10px' }}>{roomData.music.artist}</div>
                </div>
                <button className="play-btn" onClick={togglePlay} style={{ width: '28px', height: '28px', cursor: 'pointer' }}>
                  {playing ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>
              </div>
            )}

            {!showElements.palette && !showElements.music && (
              <p className="mono" style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '11px', padding: '8px' }}>
                Toggle elements above to show on cover
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Image position controls */}
      {roomData.image && (
        <div className="surface" style={{ padding: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>
            Image Position
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span className="mono">Horizontal</span>
                <span className="mono" style={{ color: 'var(--muted-foreground)' }}>{imagePosition.x}%</span>
              </div>
              <input
                type="range"
                min="0" max="100"
                value={imagePosition.x}
                onChange={(e) => onPositionChange({ ...imagePosition, x: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span className="mono">Vertical</span>
                <span className="mono" style={{ color: 'var(--muted-foreground)' }}>{imagePosition.y}%</span>
              </div>
              <input
                type="range"
                min="0" max="100"
                value={imagePosition.y}
                onChange={(e) => onPositionChange({ ...imagePosition, y: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
            <button
              onClick={() => onPositionChange({ x: 50, y: 50 })}
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '4px 12px', fontSize: '10px', alignSelf: 'flex-start' }}
            >
              Reset Position
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="surface" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="mono" style={{ fontSize: '11px', fontWeight: 600 }}>Preview Size</span>
        <input
          type="range"
          min="0.5" max="1.5" step="0.1"
          value={coverZoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--primary)' }}
        />
        <span className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)', minWidth: '32px', textAlign: 'right' }}>
          {Math.round(coverZoom * 100)}%
        </span>
      </div>
    </div>
  )
}
