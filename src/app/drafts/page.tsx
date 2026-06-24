'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Room = {
  id: string
  name: string
  description?: string | null
  creator?: string | null
  palette?: string[]
  imageUrl?: string | null
  tags?: string[]
  createdAt: string
  isPublic?: boolean
}

export default function DraftsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/rooms?mine=true&limit=200')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch drafts')
        const list = Array.isArray(data.rooms) ? data.rooms : []
        if (!mounted) return
        setRooms(list)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Could not load drafts.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const drafts = useMemo(() => rooms.filter(room => room.isPublic === false), [rooms])

  return (
    <div className="container" style={{ padding: '40px 32px', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="section-title" style={{ marginBottom: '8px' }}>Drafts</h1>
        <p className="mono" style={{ color: 'var(--muted-foreground)' }}>PRIVATE_ROOMS // WORK_IN_PROGRESS</p>
      </div>

      {loading && (
        <div className="surface" style={{ padding: '18px' }}>
          <p className="mono" style={{ color: 'var(--muted-foreground)' }}>Loading drafts...</p>
        </div>
      )}

      {error && !loading && (
        <div className="surface" style={{ padding: '18px', borderColor: 'var(--destructive)' }}>
          <p className="mono" style={{ color: 'var(--destructive)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && drafts.length === 0 && (
        <div className="surface" style={{ padding: '22px' }}>
          <p className="mono" style={{ color: 'var(--muted-foreground)', marginBottom: '12px' }}>
            You have no private drafts yet.
          </p>
          <Link href="/builder" className="btn" style={{ width: 'auto' }}>
            Create New Draft
          </Link>
        </div>
      )}

      {!loading && !error && drafts.length > 0 && (
        <div className="room-grid">
          {drafts.map((room) => (
            <article key={room.id} className="room-card pixel-border">
              <div className="room-image-container">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} />
                ) : (
                  <div
                    className="room-image-placeholder"
                    style={{
                      background: room.palette?.length
                        ? `linear-gradient(135deg, ${room.palette.slice(0, 3).join(', ')})`
                        : 'var(--muted)',
                    }}
                  />
                )}
                <span className="room-tag" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                  Draft
                </span>
              </div>
              <div className="room-content">
                <div>
                  <h3 className="room-name">{room.name}</h3>
                  <div className="room-creator mono">
                    Last updated view: {new Date(room.createdAt).toLocaleDateString()}
                  </div>
                  {room.description && (
                    <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      {room.description.slice(0, 120)}
                    </p>
                  )}
                </div>

                <div className="palette-row">
                  {(room.palette?.length ? room.palette : ['#ccc', '#999', '#666', '#333', '#000']).map((color, index) => (
                    <div key={`${color}-${index}`} className="color-swatch" style={{ backgroundColor: color }} />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link href={`/house/${room.id}`} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px' }}>
                    Preview
                  </Link>
                  <Link href={`/builder?template=${room.id}`} className="btn" style={{ width: 'auto', padding: '8px 14px' }}>
                    Continue Editing
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
