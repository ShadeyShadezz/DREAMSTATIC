'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ALL_TAGS } from '../_lib/tags'
import { AppPreferences, applyMotionPreference, applyTheme, DEFAULT_PREFERENCES, getStoredPreferences, savePreferences } from '../_lib/preferences'

export default function Settings() {
  const router = useRouter()
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES)
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = getStoredPreferences()
    setPrefs(stored)
    applyTheme(stored.theme)
    applyMotionPreference(stored.reduceMotion)
  }, [])

  useEffect(() => {
    applyMotionPreference(prefs.reduceMotion)
  }, [prefs.reduceMotion])

  const updatePrefs = (patch: Partial<AppPreferences>) => {
    setPrefs(prev => ({ ...prev, ...patch }))
  }

  const handleThemeChange = (nextTheme: AppPreferences['theme']) => {
    updatePrefs({ theme: nextTheme })
    applyTheme(nextTheme)
  }

  const toggleFavoriteTag = (tag: string) => {
    setPrefs(prev => {
      const exists = prev.favoriteTags.includes(tag)
      if (exists) {
        return { ...prev, favoriteTags: prev.favoriteTags.filter(t => t !== tag) }
      }
      if (prev.favoriteTags.length >= 8) return prev
      return { ...prev, favoriteTags: [...prev.favoriteTags, tag] }
    })
  }

  const handleSave = () => {
    savePreferences(prefs)
    applyTheme(prefs.theme)
    applyMotionPreference(prefs.reduceMotion)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetDefaults = () => {
    setPrefs(DEFAULT_PREFERENCES)
    applyTheme(DEFAULT_PREFERENCES.theme)
    applyMotionPreference(DEFAULT_PREFERENCES.reduceMotion)
  }

  return (
    <div style={{ padding: '40px 0', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        <div style={{ marginBottom: '40px' }}>
          <h1 className="section-title" style={{ marginBottom: '8px' }}>Settings</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Manage your account preferences and appearance</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          <div>
            <div className="surface" style={{ padding: '16px' }}>
              <Link href="/profile" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                color: 'var(--foreground)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-sm)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile
              </Link>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </div>
              <Link href="/notifications" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                color: 'var(--foreground)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-sm)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Notifications
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="surface" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                </svg>
                Appearance
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Theme</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Choose your preferred color scheme</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleThemeChange('light')}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid var(--foreground)',
                      background: prefs.theme === 'light' ? 'var(--primary)' : 'transparent',
                      color: prefs.theme === 'light' ? 'var(--primary-foreground)' : 'var(--foreground)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid var(--foreground)',
                      background: prefs.theme === 'dark' ? 'var(--primary)' : 'transparent',
                      color: prefs.theme === 'dark' ? 'var(--primary-foreground)' : 'var(--foreground)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    style={{
                      padding: '8px 16px',
                      border: '2px solid var(--foreground)',
                      background: prefs.theme === 'system' ? 'var(--primary)' : 'transparent',
                      color: prefs.theme === 'system' ? 'var(--primary-foreground)' : 'var(--foreground)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    System
                  </button>
                </div>
              </div>
            </div>

            <div className="surface" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Gallery Defaults</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Default View</div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Start in For You, Templates, or Latest mode</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['for-you', 'templates', 'latest'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => updatePrefs({ galleryMode: mode })}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid var(--foreground)',
                          borderRadius: 'var(--radius-sm)',
                          background: prefs.galleryMode === mode ? 'var(--primary)' : 'transparent',
                          color: prefs.galleryMode === mode ? 'var(--primary-foreground)' : 'var(--foreground)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {mode.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Card Density</div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Compact shows more rooms per screen</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['cozy', 'compact'] as const).map(density => (
                      <button
                        key={density}
                        onClick={() => updatePrefs({ cardDensity: density })}
                        style={{
                          padding: '8px 14px',
                          border: '2px solid var(--foreground)',
                          borderRadius: 'var(--radius-sm)',
                          background: prefs.cardDensity === density ? 'var(--primary)' : 'transparent',
                          color: prefs.cardDensity === density ? 'var(--primary-foreground)' : 'var(--foreground)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Auto-refresh Feed</div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Refresh gallery every 60 seconds</div>
                  </div>
                  <button
                    onClick={() => updatePrefs({ autoRefreshFeed: !prefs.autoRefreshFeed })}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: '2px solid var(--foreground)',
                      background: prefs.autoRefreshFeed ? 'var(--primary)' : 'var(--muted)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--card)',
                      position: 'absolute',
                      top: '2px',
                      left: prefs.autoRefreshFeed ? '24px' : '2px',
                      transition: 'left 0.2s',
                      border: '2px solid var(--foreground)',
                    }} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Reduce Motion</div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Tones down animation and glitch effects</div>
                  </div>
                  <button
                    onClick={() => updatePrefs({ reduceMotion: !prefs.reduceMotion })}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: '2px solid var(--foreground)',
                      background: prefs.reduceMotion ? 'var(--primary)' : 'var(--muted)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--card)',
                      position: 'absolute',
                      top: '2px',
                      left: prefs.reduceMotion ? '24px' : '2px',
                      transition: 'left 0.2s',
                      border: '2px solid var(--foreground)',
                    }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="surface" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>For You Signal</h2>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '14px' }}>
                Pick up to 8 favorite aesthetics. Your gallery For You mode uses these first.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ALL_TAGS.slice(0, 20).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleFavoriteTag(tag)}
                    className={`filter-tag ${prefs.favoriteTags.includes(tag) ? 'active' : ''}`}
                    style={{ opacity: !prefs.favoriteTags.includes(tag) && prefs.favoriteTags.length >= 8 ? 0.45 : 1 }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="surface" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Notifications</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Push Notifications</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Receive notifications about activity</div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  style={{
                    width: '50px',
                    height: '28px',
                    borderRadius: '14px',
                    border: '2px solid var(--foreground)',
                    background: notifications ? 'var(--primary)' : 'var(--muted)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--card)',
                    position: 'absolute',
                    top: '2px',
                    left: notifications ? '24px' : '2px',
                    transition: 'left 0.2s',
                    border: '2px solid var(--foreground)',
                  }} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Email Updates</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Receive weekly digest emails</div>
                </div>
                <button
                  onClick={() => setEmailUpdates(!emailUpdates)}
                  style={{
                    width: '50px',
                    height: '28px',
                    borderRadius: '14px',
                    border: '2px solid var(--foreground)',
                    background: emailUpdates ? 'var(--primary)' : 'var(--muted)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--card)',
                    position: 'absolute',
                    top: '2px',
                    left: emailUpdates ? '24px' : '2px',
                    transition: 'left 0.2s',
                    border: '2px solid var(--foreground)',
                  }} />
                </button>
              </div>
            </div>

            <div className="surface" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Playback</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Autoplay Music</div>
                  <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Automatically play preview when viewing rooms</div>
                </div>
                <button
                  onClick={() => updatePrefs({ autoplayPreview: !prefs.autoplayPreview })}
                  style={{
                    width: '50px',
                    height: '28px',
                    borderRadius: '14px',
                    border: '2px solid var(--foreground)',
                    background: prefs.autoplayPreview ? 'var(--primary)' : 'var(--muted)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--card)',
                    position: 'absolute',
                    top: '2px',
                    left: prefs.autoplayPreview ? '24px' : '2px',
                    transition: 'left 0.2s',
                    border: '2px solid var(--foreground)',
                  }} />
                </button>
              </div>
            </div>

            <div className="surface" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Account
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '14px' }}>
                Sign out of your account and return to the login screen.
              </p>
              <button
                onClick={async () => {
                  await fetch('/api/auth/login', { method: 'DELETE' })
                  router.push('/')
                }}
                className="btn"
                style={{ width: 'auto', background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
              >
                Sign Out
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={resetDefaults} className="btn btn-secondary" style={{ width: 'auto', padding: '12px 22px' }}>
                Reset Defaults
              </button>
              {saved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 600 }}>
                  Saved!
                </div>
              )}
              <button onClick={handleSave} className="btn" style={{ width: 'auto', padding: '12px 32px' }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
