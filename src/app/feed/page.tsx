'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ALL_TAGS } from '../_lib/tags'
import { AppPreferences, DEFAULT_PREFERENCES, getStoredPreferences } from '../_lib/preferences'
import { Room as SharedRoom } from '../_lib/types'

type Room = SharedRoom

type ViewMode = 'for-you' | 'templates' | 'latest'
type SortMode = 'relevance' | 'newest' | 'name'

type DisplayMusic = {
  track: string
  artist: string
  artwork: string
} | null

type DisplayRoom = Room & {
  displayMusic: DisplayMusic
  forYouScore: number
  isTemplate: boolean
}

function normalizeMusic(music: Room['musicPreview']): DisplayMusic {
  if (!music) return null
  const loose = music as any
  return {
    track: loose.track || loose.trackName || 'Untitled Track',
    artist: loose.artist || 'Unknown Artist',
    artwork: loose.artwork || loose.artworkUrl || '',
  }
}

function scoreRoom(room: Room, prefs: AppPreferences): number {
  const tags = room.tags || []
  const matches = tags.filter(tag => prefs.favoriteTags.includes(tag)).length
  const paletteBonus = (room.palette?.length || 0) >= 4 ? 1 : 0
  const musicBonus = room.musicPreview ? 1 : 0
  const freshness = Math.max(0, 3 - Math.floor((Date.now() - new Date(room.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
  return matches * 3 + paletteBonus + musicBonus + freshness
}

const PAGE_SIZE = 24

export default function Feed() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [showAllFilters, setShowAllFilters] = useState(false)
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES)
  const [viewMode, setViewMode] = useState<ViewMode>('for-you')
  const [sortMode, setSortMode] = useState<SortMode>('relevance')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const stored = getStoredPreferences()
    setPrefs(stored)
    setViewMode(stored.galleryMode)

    fetchRooms(1)

    if (stored.autoRefreshFeed) {
      const timer = window.setInterval(() => fetchRooms(1, true), 60000)
      return () => window.clearInterval(timer)
    }
  }, [])

  const fetchRooms = async (pageNum: number, silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/rooms?page=${pageNum}&limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error('Failed to fetch rooms')
      const data = await res.json()
      if (pageNum === 1) {
        setRooms(data.rooms || [])
      } else {
        setRooms(prev => [...prev, ...(data.rooms || [])])
      }
      setTotal(data.total || 0)
      setPage(pageNum)
    } catch (e) {
      setError('Could not load rooms. Try again later.')
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    setLoadingMore(true)
    fetchRooms(page + 1, true)
  }

  const roomsWithMeta: DisplayRoom[] = rooms.map(room => ({
    ...room,
    displayMusic: normalizeMusic(room.musicPreview),
    forYouScore: scoreRoom(room, prefs),
    isTemplate: (room.palette?.length || 0) >= 4 && (room.tags?.length || 0) >= 2,
  }))

  const baseByMode = roomsWithMeta.filter(room => {
    if (viewMode === 'templates') return room.isTemplate
    return true
  })

  const byFilter = activeFilter === 'All'
    ? baseByMode
    : baseByMode.filter(r => r.tags?.includes(activeFilter))

  const byQuery = query.trim()
    ? byFilter.filter(r => {
      const q = query.trim().toLowerCase()
      const tags = (r.tags || []).join(' ').toLowerCase()
      return (
        r.name.toLowerCase().includes(q) ||
        (r.creator || '').toLowerCase().includes(q) ||
        tags.includes(q)
      )
    })
    : byFilter

  const filteredRooms = [...byQuery].sort((a, b) => {
    if (viewMode === 'for-you' || sortMode === 'relevance') return b.forYouScore - a.forYouScore
    if (sortMode === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return a.name.localeCompare(b.name)
  })

  const spotlight = filteredRooms[0]

  const displayFilters = showAllFilters ? ['All', ...ALL_TAGS] : ['All', ...ALL_TAGS.slice(0, 8)]

  return (
    <div className={prefs.cardDensity === 'compact' ? 'gallery-compact' : ''}>
      <section className="hero-section">
        <div className="hero-content pixel-border">
          <h1 className="hero-title">Dream Gallery // Discovery Engine</h1>
          <p className="hero-subtitle mono">
            Find inspiration fast: explore For You recommendations, remix templates,
            and discover fresh public rooms in one living feed.
          </p>
          <div className="hero-actions">
            <Link href="/builder" className="btn glitch-hover">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Create Room
            </Link>
            <button className="btn btn-secondary glitch-hover" onClick={() => fetchRooms(1)}>
              Refresh
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
            {([
              { key: 'for-you', label: 'For You' },
              { key: 'templates', label: 'Templates' },
              { key: 'latest', label: 'Latest' },
            ] as { key: ViewMode; label: string }[]).map(mode => (
              <button
                key={mode.key}
                className={`filter-tag ${viewMode === mode.key ? 'active' : ''}`}
                onClick={() => setViewMode(mode.key)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="container" style={{ paddingTop: '32px' }}>
          {spotlight && !loading && !error && (
            <div className="surface" style={{ padding: '22px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div className="mono" style={{ color: 'var(--muted-foreground)', marginBottom: '6px' }}>SPOTLIGHT PICK</div>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase' }}>{spotlight.name}</h2>
                  <p style={{ marginTop: '6px', color: 'var(--muted-foreground)' }}>
                    by @{spotlight.creator || 'anon'}{spotlight.isTemplate ? ' • Template-ready' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link href={`/house/${spotlight.id}`} className="btn" style={{ width: 'auto', padding: '10px 18px' }}>
                    Open Room
                  </Link>
                  <Link href={`/builder?template=${spotlight.id}`} className="btn btn-secondary" style={{ width: 'auto', padding: '10px 18px' }}>
                    Use as Template
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <h2 className="section-title">
                {viewMode === 'for-you' ? 'For You' : viewMode === 'templates' ? 'Templates' : 'Latest Rooms'}
              </h2>
              <span className="mono" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
                {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, creator, or tag"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ minHeight: '44px' }}
              />
              <select
                className="input-field"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                style={{ minHeight: '44px', cursor: 'pointer' }}
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="newest">Sort: Newest</option>
                <option value="name">Sort: Name A-Z</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {displayFilters.map(filter => (
                <button
                  key={filter}
                  className={`filter-tag ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
              <button
                className="filter-tag"
                onClick={() => setShowAllFilters(f => !f)}
                title={showAllFilters ? 'Show fewer' : 'Show all tags'}
              >
                {showAllFilters ? '▲ Less' : `▼ +${ALL_TAGS.length - 8} more`}
              </button>
            </div>

            {prefs.favoriteTags.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="mono" style={{ color: 'var(--muted-foreground)' }}>YOUR SIGNAL</span>
                {prefs.favoriteTags.map(tag => (
                  <button key={tag} className="filter-tag" onClick={() => setActiveFilter(tag)}>{tag}</button>
                ))}
              </div>
            )}
          </div>

          {loading && (
            <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--foreground)', background: 'var(--muted)' }}>
              <p className="mono" style={{ color: 'var(--muted-foreground)' }}>Loading rooms...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--destructive)', background: 'var(--muted)' }}>
              <p className="mono" style={{ color: 'var(--destructive)' }}>{error}</p>
              <button className="btn" style={{ width: 'auto', marginTop: '16px' }} onClick={() => fetchRooms(1)}>Retry</button>
            </div>
          )}

          {!loading && !error && filteredRooms.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--foreground)', background: 'var(--muted)' }}>
              <p className="mono" style={{ color: 'var(--muted-foreground)' }}>
                {rooms.length === 0 ? 'No rooms yet. Be the first to create one!' : 'No rooms match this filter.'}
              </p>
              {rooms.length === 0 && (
                <Link href="/builder" style={{ marginTop: '16px', display: 'inline-block' }}>
                  <button className="btn" style={{ width: 'auto' }}>Create Room</button>
                </Link>
              )}
            </div>
          )}

          {!loading && !error && (
            <div className="room-grid">
              {filteredRooms.map(room => (
                <Link href={`/house/${room.id}`} key={room.id} style={{ textDecoration: 'none' }}>
                  <div className="room-card pixel-border glitch-hover">
                    <div className="room-image-container">
                      {room.imageUrl ? (
                        <img src={room.imageUrl} alt={room.name} loading="lazy" />
                      ) : (
                        <div className="room-image-placeholder">
                          {(room.palette && room.palette.length >= 3) ? (
                            <div style={{
                              width: '100%', height: '100%',
                              background: `linear-gradient(135deg, ${room.palette.slice(0, 3).join(', ')})`,
                            }} />
                          ) : (
                            <span className="mono" style={{ color: 'var(--muted-foreground)' }}>NO IMAGE</span>
                          )}
                        </div>
                      )}
                      {room.tags && room.tags.length > 0 && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {room.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="room-tag" style={{ position: 'static', background: 'var(--background)' }}>
                              {tag}
                            </span>
                          ))}
                          {room.tags.length > 3 && (
                            <span className="room-tag" style={{ position: 'static', background: 'var(--foreground)', color: 'var(--background)' }}>
                              +{room.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="room-content">
                      <div className="room-header">
                        <div>
                          <h3 className="room-name">{room.name || 'Untitled Room'}</h3>
                          <div className="room-creator mono">@{room.creator || 'anon'}</div>
                        </div>
                        {room.isTemplate && (
                          <span className="room-tag" style={{ position: 'static' }}>Template</span>
                        )}
                      </div>
                      <div className="palette-row">
                        {(room.palette && room.palette.length > 0 ? room.palette : ['#ccc', '#999', '#666', '#333', '#000']).map((color, i) => (
                          <div key={i} className="color-swatch" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      {room.displayMusic && (
                        <div className="music-player">
                          <div className="music-artwork">
                            {room.displayMusic.artwork ? (
                              <img src={room.displayMusic.artwork} alt="Album art" />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'var(--muted)' }} />
                            )}
                          </div>
                          <div className="music-info">
                            <div className="music-track mono">{room.displayMusic.track}</div>
                            <div className="music-artist mono">{room.displayMusic.artist}</div>
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <span className="mono" style={{ color: 'var(--muted-foreground)' }}>score {room.forYouScore}</span>
                        <button
                          type="button"
                          className="text-link"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            router.push(`/builder?template=${room.id}`)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Remix
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && rooms.length < total && filteredRooms.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                className="btn"
                style={{ width: 'auto', padding: '14px 32px' }}
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : `Load More (${rooms.length} of ${total})`}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
