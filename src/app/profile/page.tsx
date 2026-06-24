'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface User {
  username: string
  displayName: string
  bio: string
  joinedAt: string
}

interface Room {
  id: string
  name: string
  creator?: string
  palette?: string[]
  imageUrl?: string | null
  tags?: string[]
  createdAt: string
  isPublic?: boolean
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const authRes = await fetch('/api/auth/login')
        const authData = await authRes.json()

        if (!authData.authenticated) {
          setUser(null)
          return
        }

        setUser(authData.user)
        const roomsRes = await fetch('/api/rooms?mine=true&limit=100')
        if (!roomsRes.ok) throw new Error('Could not load rooms')
        const data = await roomsRes.json()
        setRooms(data.rooms || data)
      } catch {
        setError('Could not load your profile right now.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const initials = useMemo(() => {
    if (!user) return 'DS'
    return user.displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  if (loading) {
    return (
      <div className="container page-shell">
        <div className="empty-state mono">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container page-shell">
        <div className="surface profile-empty">
          <h1>Sign in to view your profile</h1>
          <p>Your created rooms and account settings are tied to your session.</p>
          <Link href="/" className="btn" style={{ width: 'auto' }}>
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container page-shell">
      <section className="profile-hero surface">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-main">
          <div>
            <p className="mono eyebrow">Creator Profile</p>
            <h1>{user.displayName}</h1>
            <p className="mono">@{user.username}</p>
          </div>
          <p>{user.bio}</p>
        </div>
        <div className="profile-actions">
          <Link href="/builder" className="btn" style={{ width: 'auto' }}>
            Create Room
          </Link>
          <Link href="/settings" className="btn btn-secondary" style={{ width: 'auto' }}>
            Settings
          </Link>
        </div>
      </section>

      {error && <div className="empty-state mono error-state">{error}</div>}

      <section className="stats-grid" style={{ margin: '32px 0' }}>
        <div className="stat-card">
          <div className="stat-value">{rooms.length}</div>
          <div className="stat-label">Rooms</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{rooms.filter((room) => room.imageUrl).length}</div>
          <div className="stat-label">Image Rooms</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
          <div className="stat-label">Joined</div>
        </div>
      </section>

      <div className="section-row">
        <h2 className="section-title">My Rooms</h2>
        <Link href="/feed" className="text-link">View Gallery</Link>
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <p className="mono">You have not created any rooms yet.</p>
          <Link href="/builder" className="btn" style={{ width: 'auto', marginTop: '16px' }}>
            Build Your First Room
          </Link>
        </div>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => (
            <Link href={`/house/${room.id}`} key={room.id} style={{ textDecoration: 'none' }}>
              <article className="room-card pixel-border glitch-hover">
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
                  {room.tags?.[0] && <span className="room-tag">{room.tags[0]}</span>}
                  {room.isPublic === false && (
                    <span className="room-tag" style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'var(--foreground)', color: 'var(--background)' }}>Private</span>
                  )}
                </div>
                <div className="room-content">
                  <div>
                    <h3 className="room-name">{room.name}</h3>
                    <div className="room-creator mono">
                      {new Date(room.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="palette-row">
                    {(room.palette?.length ? room.palette : ['#ccc', '#999', '#666', '#333', '#000']).map((color, index) => (
                      <div key={`${color}-${index}`} className="color-swatch" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
