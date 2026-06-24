export type ThemeMode = 'light' | 'dark' | 'system'
export type GalleryMode = 'for-you' | 'templates' | 'latest'
export type CardDensity = 'cozy' | 'compact'

export interface AppPreferences {
  theme: ThemeMode
  galleryMode: GalleryMode
  cardDensity: CardDensity
  autoplayPreview: boolean
  reduceMotion: boolean
  autoRefreshFeed: boolean
  favoriteTags: string[]
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  galleryMode: 'for-you',
  cardDensity: 'cozy',
  autoplayPreview: true,
  reduceMotion: false,
  autoRefreshFeed: false,
  favoriteTags: ['Y2K', 'Cyber', 'Liminal'],
}

const PREFS_KEY = 'app.preferences'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function normalizePreferences(raw: Partial<AppPreferences> | null | undefined): AppPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...(raw || {}),
    favoriteTags: Array.isArray(raw?.favoriteTags)
      ? raw!.favoriteTags.filter((t): t is string => typeof t === 'string').slice(0, 8)
      : DEFAULT_PREFERENCES.favoriteTags,
  }
}

export function getStoredPreferences(): AppPreferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES

  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    return normalizePreferences(JSON.parse(raw) as Partial<AppPreferences>)
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: AppPreferences): AppPreferences {
  const normalized = normalizePreferences(prefs)
  if (isBrowser()) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(normalized))
    localStorage.setItem('theme', normalized.theme)
    window.dispatchEvent(new CustomEvent('preferences-updated'))
  }
  return normalized
}

export function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (!isBrowser()) return 'light'
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: ThemeMode) {
  if (!isBrowser()) return

  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

export function applyMotionPreference(reduceMotion: boolean) {
  if (!isBrowser()) return
  const root = document.documentElement
  root.setAttribute('data-motion', reduceMotion ? 'reduce' : 'full')
}
