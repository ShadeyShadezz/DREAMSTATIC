'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface NotificationItem {
  id: string
  type: 'comment' | 'update'
  title: string
  body: string
  createdAt: string
  roomId?: string
  isRead?: boolean
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const markAsRead = async (ids: string[]) => {
    if (!ids.length) return
    setSaving(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update notifications')
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0)
    } catch (e: any) {
      setError(e?.message || 'Could not update notifications right now.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch notifications')
        if (!mounted) return
        setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Could not load notifications right now.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const grouped = useMemo(() => {
    const comment = notifications.filter(n => n.type === 'comment')
    const updates = notifications.filter(n => n.type === 'update')
    return { comment, updates }
  }, [notifications])

  return (
    <div className="container" style={{ padding: '40px 32px', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="section-title" style={{ marginBottom: '8px' }}>Notifications</h1>
        <p className="mono" style={{ color: 'var(--muted-foreground)' }}>
          COMMENT_ALERTS // FUTURE_UPDATES
        </p>
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="mono" style={{ color: unreadCount > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
            UNREAD: {unreadCount}
          </span>
          <button
            type="button"
            className="button"
            onClick={() => markAsRead(notifications.filter((item) => !item.isRead).map((item) => item.id))}
            disabled={saving || unreadCount === 0}
          >
            {saving ? 'Saving...' : 'Mark All Read'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="surface" style={{ padding: '18px' }}>
          <p className="mono" style={{ color: 'var(--muted-foreground)' }}>Loading notifications...</p>
        </div>
      )}

      {error && !loading && (
        <div className="surface" style={{ padding: '18px', borderColor: 'var(--destructive)' }}>
          <p className="mono" style={{ color: 'var(--destructive)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <section className="surface" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase' }}>
              Comment Activity ({grouped.comment.length})
            </h2>
            {grouped.comment.length === 0 ? (
              <p className="mono" style={{ color: 'var(--muted-foreground)' }}>
                No new comment activity yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {grouped.comment.map(item => (
                  <div key={item.id} style={{ border: '2px solid var(--foreground)', background: 'var(--card)', padding: '12px', opacity: item.isRead ? 0.72 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px' }}>{item.title}</strong>
                      <span className="mono" style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', marginBottom: '8px' }}>{item.body}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {item.roomId && (
                        <Link href={`/house/${item.roomId}`} className="text-link">
                          Open Room
                        </Link>
                      )}
                      {!item.isRead && (
                        <button type="button" className="text-link" onClick={() => markAsRead([item.id])} disabled={saving}>
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="surface" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase' }}>
              Product Updates ({grouped.updates.length})
            </h2>
            {grouped.updates.length === 0 ? (
              <p className="mono" style={{ color: 'var(--muted-foreground)' }}>
                No product updates yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {grouped.updates.map(item => (
                  <div key={item.id} style={{ border: '2px solid var(--foreground)', background: 'var(--card)', padding: '12px', opacity: item.isRead ? 0.72 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px' }}>{item.title}</strong>
                      <span className="mono" style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px' }}>{item.body}</p>
                    {!item.isRead && (
                      <button type="button" className="text-link" onClick={() => markAsRead([item.id])} disabled={saving}>
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
