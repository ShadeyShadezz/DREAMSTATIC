'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const links = [
  {
    href: '/feed',
    label: 'Gallery',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    href: '/builder',
    label: 'Create',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    ),
  },
  {
    href: '/music',
    label: 'Music',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="18" cy="16" r="3"></circle>
      </svg>
    ),
  },
  {
    href: '/drafts',
    label: 'Drafts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="8" y1="13" x2="16" y2="13"></line>
        <line x1="8" y1="17" x2="13" y2="17"></line>
      </svg>
    ),
  },
]

export default function AppHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<{ username: string; displayName?: string } | null>(null)
  const accountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/login')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        const nextUser = data.authenticated ? data.user : null
        setUser(nextUser)
        if (nextUser) {
          fetch('/api/notifications?limit=20')
            .then((res) => res.json())
            .then((payload) => {
              if (!mounted) return
              setUnreadCount(typeof payload?.unreadCount === 'number' ? payload.unreadCount : 0)
            })
            .catch(() => {
              if (mounted) setUnreadCount(0)
            })
        } else {
          setUnreadCount(0)
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null)
          setUnreadCount(0)
        }
      })

    setAccountOpen(false)
    return () => {
      mounted = false
    }
  }, [pathname])

  useEffect(() => {
    if (!accountOpen) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [accountOpen])

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    setUser(null)
    setMenuOpen(false)
    setAccountOpen(false)
    window.location.href = '/'
  }

  return (
    <header>
      <div className="container header-content">
        <Link href="/feed" className="logo" onClick={() => setMenuOpen(false)}>
          <div className="logo-icon">D</div>
          Dreamstatic404
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((s) => !s)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
          {user ? (
            <div className="nav-account" ref={accountRef}>
              <button
                type="button"
                className="nav-link nav-user"
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span>@{user.username}</span>
                <span className="nav-user-action">Account</span>
              </button>
              <div
                className={`nav-account-menu ${accountOpen ? 'open' : ''}`}
                aria-hidden={!accountOpen}
                role="menu"
              >
                <Link href="/profile" className="nav-account-item" role="menuitem" onClick={() => { setMenuOpen(false); setAccountOpen(false) }}>
                  My Rooms
                </Link>
                <Link href="/notifications" className="nav-account-item" role="menuitem" onClick={() => { setMenuOpen(false); setAccountOpen(false) }}>
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </Link>
                <Link href="/settings" className="nav-account-item" role="menuitem" onClick={() => { setMenuOpen(false); setAccountOpen(false) }}>
                  Settings
                </Link>
                <button type="button" className="nav-account-item" role="menuitem" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/"
              className={`nav-link nav-auth-link ${pathname === '/' ? 'active' : ''}`}
              aria-current={pathname === '/' ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
