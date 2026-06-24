'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Room {
  id: string
  name: string
  description?: string | null
  creator?: string
  palette?: string[]
  imageUrl?: string | null
  musicPreview?: {
    trackId?: number | string
    trackName?: string
    artist?: string
    previewUrl?: string | null
    artworkUrl?: string | null
    track?: string
  } | null
  tags?: string[]
  createdAt: string
  isPublic?: boolean
}

interface CommentData {
  id: string
  roomId: string
  userId: string
  username: string
  body: string
  createdAt: string
}

export default function RoomDetail() {
  const params = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [commentsError, setCommentsError] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const MAX_COMMENT_LENGTH = 500

  useEffect(() => {
    if (!params.id) return
    fetchRoom()
    fetchComments()
    fetch('/api/auth/login')
      .then(res => res.json())
      .then(data => { if (data.authenticated) setCurrentUser(data.user) })
      .catch(() => {})
  }, [params.id])

  const fetchRoom = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/rooms/${params.id}`)
      if (res.status === 404) {
        setError('Room not found')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch room')
      const data = await res.json()
      setRoom(data)
    } catch (e) {
      setError('Could not load this room.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/rooms/${params.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      } else {
        setCommentsError('Failed to load comments')
      }
    } catch {
      setCommentsError('Network error loading comments')
    }
  }

  const handlePostComment = async () => {
    if (posting) return
    const text = commentBody.trim()
    if (!text) return
    setPosting(true)
    setCommentError('')
    try {
      const res = await fetch(`/api/rooms/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCommentError(data.error || 'Failed to post comment')
        return
      }
      setComments(prev => [...prev, data])
      setCommentBody('')
    } catch {
      setCommentError('Network error. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const canManageComment = (comment: CommentData) => {
    if (!currentUser) return false
    return currentUser.id === comment.userId || currentUser.username === room?.creator
  }

  const beginEditComment = (comment: CommentData) => {
    setCommentError('')
    setEditingCommentId(comment.id)
    setEditingBody(comment.body)
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingBody('')
  }

  const handleSaveCommentEdit = async (commentId: string) => {
    if (savingEdit) return
    const text = editingBody.trim()
    if (!text) {
      setCommentError('Comment cannot be empty')
      return
    }

    setSavingEdit(true)
    setCommentError('')
    try {
      const res = await fetch(`/api/rooms/${params.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCommentError(data.error || 'Failed to update comment')
        return
      }

      setComments(prev => prev.map(c => (c.id === commentId ? { ...c, body: data.body } : c)))
      cancelEditComment()
    } catch {
      setCommentError('Network error. Please try again.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId) return
    setDeletingCommentId(commentId)
    setCommentError('')
    try {
      const res = await fetch(`/api/rooms/${params.id}/comments/${commentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setCommentError(data.error || 'Failed to delete comment')
        return
      }

      setComments(prev => prev.filter(c => c.id !== commentId))
      if (editingCommentId === commentId) {
        cancelEditComment()
      }
    } catch {
      setCommentError('Network error. Please try again.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const getTrackName = () => {
    if (!room?.musicPreview) return ''
    return room.musicPreview.trackName || room.musicPreview.track || ''
  }

  const getArtist = () => {
    if (!room?.musicPreview) return ''
    return room.musicPreview.artist || ''
  }

  const getArtwork = () => {
    if (!room?.musicPreview) return ''
    return room.musicPreview.artworkUrl || ''
  }

  const getPreviewUrl = () => {
    if (!room?.musicPreview) return ''
    return room.musicPreview.previewUrl || ''
  }

  const togglePlay = () => {
    const url = getPreviewUrl()
    if (!url) return

    if (playing && audioRef.current) {
      audioRef.current.pause()
      setPlaying(false)
      return
    }

    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
      return
    }

    const audio = new Audio(url)
    audio.volume = 0.5
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    audio.onended = () => {
      setPlaying(false)
      setProgress(0)
    }
    audio.play().catch(() => {})
    audioRef.current = audio
    setPlaying(true)
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 32px' }}>
        <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--foreground)', background: 'var(--muted)' }}>
          <p className="mono" style={{ color: 'var(--muted-foreground)' }}>Loading room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '40px 32px' }}>
        <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--destructive)', background: 'var(--muted)' }}>
          <p className="mono" style={{ color: 'var(--destructive)' }}>{error}</p>
          <Link href="/feed">
            <button className="btn" style={{ width: 'auto', marginTop: '16px' }}>Back to Gallery</button>
          </Link>
        </div>
      </div>
    )
  }

  if (!room) return null

  return (
    <div className="container" style={{ padding: '40px 32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/feed" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          color: 'var(--muted-foreground)', textDecoration: 'none',
          fontSize: '14px', fontWeight: 600,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Gallery
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {room.tags && room.tags.length > 0 ? room.tags.slice(0, 4).map(tag => (
              <Link key={tag} href={`/feed`} className="room-tag" style={{ position: 'static', textDecoration: 'none' }}>
                {tag}
              </Link>
            )) : (
              <span className="room-tag" style={{ position: 'static' }}>Room</span>
            )}
            {room.isPublic === false && (
              <span className="room-tag" style={{ position: 'static', background: 'var(--foreground)', color: 'var(--background)' }}>Private</span>
            )}
            <span className="mono" style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              Created {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
            {room.name}
          </h1>
          <Link
            href={`/profile/${room.creator || 'anon'}`}
            className="mono text-link"
            style={{ color: 'var(--muted-foreground)', marginTop: '8px', display: 'inline-block' }}
          >
            by @{room.creator || 'anon'}
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          {room.isPublic !== false && (
            <button className="btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={handleShare}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              {copied ? 'Copied!' : 'Share'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
        <div>
          <div className="surface" style={{ padding: '0', overflow: 'hidden' }}>
            {room.imageUrl ? (
              <img src={room.imageUrl} alt={room.name} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '400px',
                background: room.palette && room.palette.length >= 3
                  ? `linear-gradient(135deg, ${room.palette.slice(0, 3).join(', ')})`
                  : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="mono" style={{ color: room.palette?.length ? '#fff' : 'var(--muted-foreground)', mixBlendMode: room.palette?.length ? 'difference' : 'normal' }}>
                  NO IMAGE
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
              Color Palette
            </h3>
            <div className="palette-row">
              {(room.palette && room.palette.length > 0 ? room.palette : ['#ccc', '#999', '#666', '#333', '#000']).map((color, i) => (
                <div
                  key={i}
                  className="color-swatch"
                  style={{ backgroundColor: color, cursor: 'pointer', position: 'relative' }}
                  title={`Click to copy: ${color}`}
                  onClick={() => navigator.clipboard.writeText(color)}
                >
                  <span style={{
                    position: 'absolute', bottom: '-24px', left: '50%',
                    transform: 'translateX(-50%)', fontSize: '10px',
                    fontFamily: 'monospace', color: 'var(--muted-foreground)',
                    opacity: 0, transition: 'opacity 0.2s',
                  }} className="color-label">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {room.description && room.description.trim().length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Description
              </h3>
              <div className="surface" style={{ padding: '14px 16px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {room.description}
              </div>
            </div>
          )}

          <div className="comments-section">
            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              Comments ({comments.length})
            </h3>

            {commentsError && (
              <div style={{ padding: '12px', background: 'var(--destructive)', color: 'var(--destructive-foreground)', border: '2px solid var(--foreground)', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
                {commentsError}
              </div>
            )}

            {comments.length > 0 && (
              <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.map(c => (
                  <div key={c.id} style={{
                    padding: '12px', border: '2px solid var(--foreground)',
                    background: 'var(--card)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>@{c.username}</span>
                        {room.creator === c.username && (
                          <span className="mono" style={{ fontSize: '10px', color: 'var(--primary)' }}>creator</span>
                        )}
                        {currentUser?.id === c.userId && (
                          <span className="mono" style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>you</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                        {canManageComment(c) && editingCommentId !== c.id && (
                          <>
                            <button
                              className="filter-tag"
                              onClick={() => beginEditComment(c)}
                              style={{ fontSize: '10px', padding: '4px 8px' }}
                            >
                              Edit
                            </button>
                            <button
                              className="filter-tag"
                              onClick={() => handleDeleteComment(c.id)}
                              disabled={deletingCommentId === c.id}
                              style={{ fontSize: '10px', padding: '4px 8px', opacity: deletingCommentId === c.id ? 0.7 : 1 }}
                            >
                              {deletingCommentId === c.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {editingCommentId === c.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          className="input-field"
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                          maxLength={MAX_COMMENT_LENGTH}
                          style={{ minHeight: '90px', resize: 'vertical' }}
                        />
                        <div className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                          {editingBody.trim().length}/{MAX_COMMENT_LENGTH}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn"
                            style={{ width: 'auto', padding: '6px 12px', opacity: savingEdit ? 0.7 : 1 }}
                            onClick={() => handleSaveCommentEdit(c.id)}
                            disabled={savingEdit}
                          >
                            {savingEdit ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '6px 12px' }}
                            onClick={cancelEditComment}
                            disabled={savingEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{c.body}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!commentsError && comments.length === 0 && (
              <div style={{ padding: '14px', border: '2px dashed var(--foreground)', marginBottom: '20px' }}>
                <p className="mono" style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>
                  No comments yet. Start the conversation.
                </p>
              </div>
            )}

            {currentUser ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--muted)', border: '2px solid var(--foreground)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <textarea
                    className="input-field"
                    placeholder="Add a comment..."
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault()
                        void handlePostComment()
                      }
                    }}
                    maxLength={MAX_COMMENT_LENGTH}
                    style={{ minHeight: '80px', resize: 'vertical' }}
                  />
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                    {commentBody.trim().length}/{MAX_COMMENT_LENGTH} • Ctrl/Cmd+Enter to post
                  </div>
                  {commentError && (
                    <div style={{ color: 'var(--destructive)', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                      {commentError}
                    </div>
                  )}
                  <button
                    className="btn"
                    style={{ width: 'auto', marginTop: '8px', padding: '8px 16px', opacity: posting ? 0.7 : 1 }}
                    disabled={!commentBody.trim() || posting}
                    onClick={handlePostComment}
                  >
                    {posting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', border: '2px dashed var(--foreground)', textAlign: 'center' }}>
                <p className="mono" style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>
                  <Link href="/" style={{ textDecoration: 'underline', fontWeight: 600 }}>Sign in</Link> to leave a comment.
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="surface" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
              Now Playing
            </h3>
            <div style={{
              width: '100%', aspectRatio: '1', border: '2px solid var(--foreground)',
              marginBottom: '24px', overflow: 'hidden', position: 'relative',
            }}>
              {getArtwork() ? (
                <img src={getArtwork()} alt="Album art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: room.palette && room.palette.length >= 2
                    ? `linear-gradient(135deg, ${room.palette[0]}, ${room.palette[1]})`
                    : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="mono" style={{ color: '#fff', mixBlendMode: 'difference' }}>NO ART</span>
                </div>
              )}
              {playing && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        width: '4px', height: `${Math.random() * 20 + 10}px`,
                        background: 'var(--secondary)',
                        animation: `equalizer 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{getTrackName() || 'No track selected'}</div>
              <div className="mono" style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                {getArtist() || 'Unknown artist'}
              </div>
            </div>
            {getPreviewUrl() && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ height: '8px', background: 'var(--muted)', border: '2px solid var(--foreground)', position: 'relative' }}>
                    <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.1s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                      {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
                    </span>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                      {audioRef.current?.duration ? formatTime(audioRef.current.duration) : '0:30'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={togglePlay}
                    className="play-btn"
                    style={{ width: '64px', height: '64px', fontSize: '24px' }}
                  >
                    {playing ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
            {!getPreviewUrl() && (
              <p className="mono" style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '12px' }}>
                No audio preview available
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .color-swatch:hover .color-label {
          opacity: 1 !important;
        }
        @keyframes equalizer {
          0% { height: 10px; }
          100% { height: 25px; }
        }
      `}</style>
    </div>
  )
}
