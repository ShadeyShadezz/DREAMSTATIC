'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ProfileUser {
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
}

export default function PublicProfile() {
  const params = useParams()
  const username = String(params.username || '')
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [userRes, roomsRes] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(username)}`),
          fetch(`/api/rooms?creator=${encodeURIComponent(username)}`),
        ])
        if (userRes.ok) {
          const userData = await userRes.json()
          setProfileUser(userData)
        }
        if (!roomsRes.ok) throw new Error('Failed to load rooms')
        const data = await roomsRes.json()
        setRooms(data.rooms || data)
      } catch {
        setError('Could not load this profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [username])

  const initials = useMemo(() => {
    if (profileUser) {
      return profileUser.displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    return username.slice(0, 2).toUpperCase()
  }, [profileUser, username])

  const displayName = useMemo(() => {
    if (profileUser) return profileUser.displayName
    return username.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  }, [profileUser, username])

  return (
    <div className="container page-shell">
      <div style={{ marginBottom: '24px' }}>
        <Link href="/feed" className="text-link">
          Back to Gallery
        </Link>
      </div>

      {loading && (
        <div className="empty-state mono">Loading profile...</div>
      )}

      {error && <div className="empty-state mono error-state">{error}</div>}

      {!loading && !error && (
        <>
          <section className="profile-hero surface">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-main">
              <div>
                <p className="mono eyebrow">Public Creator</p>
                <h1>{displayName}</h1>
                <p className="mono">@{username}</p>
              </div>
              {profileUser?.bio && <p>{profileUser.bio}</p>}
            </div>
          </section>

          <section className="stats-grid" style={{ margin: '32px 0' }}>
            <div className="stat-card">
              <div className="stat-value">{rooms.length}</div>
              <div className="stat-label">Public Rooms</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{rooms.filter((room) => room.imageUrl).length}</div>
              <div className="stat-label">Image Rooms</div>
            </div>
            {profileUser?.joinedAt && (
              <div className="stat-card">
                <div className="stat-value">
                  {new Date(profileUser.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="stat-label">Joined</div>
              </div>
            )}
          </section>

          <div className="section-row" style={{ marginTop: '32px' }}>
            <h2 className="section-title">Public Rooms</h2>
          </div>

          {rooms.length === 0 ? (
            <div className="empty-state mono">No public rooms found for @{username}.</div>
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
        </>
      )}
    </div>
  )
}
