'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  username?: string
}

interface SessionUser {
  id?: string
  username: string
  displayName?: string
  email?: string
}

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    fetch('/api/auth/login')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSessionUser(data.user)
        } else {
          setSessionUser(null)
        }
      })
      .catch(() => {
        setSessionUser(null)
      })
      .finally(() => {
        setCheckingSession(false)
      })
  }, [router])

  const handleSignOut = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    setSessionUser(null)
    setActiveTab('login')
    setApiError('')
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (activeTab === 'signup') {
      if (!username.trim()) newErrors.username = 'Username is required'
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      if (activeTab === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setApiError(data.error || 'Login failed')
          return
        }
      } else {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username }),
        })
        const data = await res.json()
        if (!res.ok) {
          setApiError(data.error || 'Signup failed')
          return
        }
      }
      router.push('/feed')
    } catch {
      setApiError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="visual-pane" style={{
        flex: 1.2,
        position: 'relative',
        borderRight: '3px solid var(--foreground)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 40px 40px',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: 'url(https://storage.googleapis.com/banani-generated-images/generated-images/38fd6c1c-368c-4fd4-97dd-0b91c357d65f.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.85, mixBlendMode: 'luminosity', filter: 'contrast(1.2)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%)',
          pointerEvents: 'none',
        }} />
        <div className="visual-content" style={{
          position: 'relative', zIndex: 10, color: '#ffffff',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            fontSize: '28px', fontWeight: 700, letterSpacing: '-0.04em',
            textShadow: '2px 2px 0 #000000',
          }}>
            <div style={{
              width: '32px', height: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: '#ffffff', borderRadius: '999px',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            DREAMSTATIC
          </div>
        </div>
        <div className="visual-content" style={{
          position: 'relative', zIndex: 10, marginTop: 'auto',
          color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div className="mono" style={{ color: '#a5b4fc', marginBottom: '8px' }}>
            AUTH_GATEWAY // SECURE CONNECTION
          </div>
          <h1 style={{
            fontSize: '64px', fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', textShadow: '4px 4px 0 #000000', maxWidth: '600px',
          }}>
            Enter the<br />Dreamscape
          </h1>
          <p style={{
            fontSize: '18px', lineHeight: 1.5, maxWidth: '480px',
            textShadow: '1px 1px 0 #000000', color: 'rgba(255, 255, 255, 0.9)',
          }}>
            Sign in to sync your mood boards, access your saved rooms, and
            collaborate with other creators in real-time.
          </p>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '40px',
        background: 'radial-gradient(circle at center, var(--muted) 0%, var(--background) 100%)',
        position: 'relative',
      }}>
        <Link href="/feed" style={{
          position: 'absolute', top: '40px', right: '40px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', fontWeight: 600, color: 'var(--foreground)',
          background: 'var(--card)', padding: '8px 16px',
          border: '2px solid var(--foreground)',
          boxShadow: '3px 3px 0 var(--foreground)',
          borderRadius: 'var(--radius-sm)', textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Gallery
        </Link>

        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {checkingSession && (
            <div className="surface" style={{ padding: '18px 22px' }}>
              <p className="mono" style={{ color: 'var(--muted-foreground)' }}>Checking active session...</p>
            </div>
          )}

          {!checkingSession && sessionUser && (
            <div className="surface" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div className="mono" style={{ color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                  SESSION ACTIVE
                </div>
                <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
                  Signed in as {sessionUser.displayName || sessionUser.username}
                </h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
                  @{sessionUser.username}{sessionUser.email ? ` • ${sessionUser.email}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn" style={{ width: 'auto' }} onClick={() => router.push('/feed')}>
                  Continue to Feed
                </button>
                <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => router.push('/profile')}>
                  Open Profile
                </button>
                <button
                  className="btn"
                  style={{ width: 'auto', background: 'var(--card)', color: 'var(--foreground)' }}
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {!checkingSession && !sessionUser && (
            <div className="auth-card surface">
              <div className="auth-header">
                <h2>{activeTab === 'login' ? 'Welcome Back' : 'Join the Dreamscape'}</h2>
                <p>{activeTab === 'login' ? 'Enter your credentials to access your studio.' : 'Create an account to start building.'}</p>
              </div>

              <div className="tab-row">
                <button
                  className={`tab-btn ${activeTab === 'login' ? 'active' : 'inactive'}`}
                  onClick={() => { setActiveTab('login'); setErrors({}); setApiError('') }}
                >
                  Log In
                </button>
                <button
                  className={`tab-btn ${activeTab === 'signup' ? 'active' : 'inactive'}`}
                  onClick={() => { setActiveTab('signup'); setErrors({}); setApiError('') }}
                >
                  Sign Up
                </button>
              </div>

              {apiError && (
                <div style={{
                  padding: '12px', background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  border: '2px solid var(--foreground)',
                  fontSize: '14px', fontWeight: 600,
                }}>
                  {apiError}
                </div>
              )}

              <div className="field-group">
                {activeTab === 'signup' && (
                  <div className="field">
                    <div className="field-label">Username</div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="your_handle"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    {errors.username && (
                      <span style={{ color: 'var(--destructive)', fontSize: '12px', fontWeight: 600 }}>{errors.username}</span>
                    )}
                  </div>
                )}
                <div className="field">
                  <div className="field-label">Email Address</div>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="user@dreamstatic.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && (
                    <span style={{ color: 'var(--destructive)', fontSize: '12px', fontWeight: 600 }}>{errors.email}</span>
                  )}
                </div>
                <div className="field">
                  <div className="field-label">Password</div>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && (
                    <span style={{ color: 'var(--destructive)', fontSize: '12px', fontWeight: 600 }}>{errors.password}</span>
                  )}
                </div>
                {activeTab === 'signup' && (
                  <div className="field">
                    <div className="field-label">Confirm Password</div>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errors.confirmPassword && (
                      <span style={{ color: 'var(--destructive)', fontSize: '12px', fontWeight: 600 }}>{errors.confirmPassword}</span>
                    )}
                  </div>
                )}
              </div>

              <button className="btn" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Processing...' : activeTab === 'login' ? 'Initialize Session' : 'Create Account'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            By connecting, you agree to the{' '}
            <span style={{ color: 'var(--foreground)', fontWeight: 600, textDecoration: 'underline' }}>
              Terms of Service
            </span>{' '}
            and{' '}
            <span style={{ color: 'var(--foreground)', fontWeight: 600, textDecoration: 'underline' }}>
              Privacy Policy
            </span>.
          </div>
        </div>
      </div>
    </div>
  )
}
