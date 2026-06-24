'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { extractColors, suggestTags } from '../_lib/color-extract'
import { MUSIC_LIBRARY } from '../_lib/music'
import Sidebar, { type ToolKey } from './_components/Sidebar'
import ImageTool from './_components/ImageTool'
import PaletteTool from './_components/PaletteTool'
import TagsTool from './_components/TagsTool'
import MusicTool from './_components/MusicTool'
import DetailsTool from './_components/DetailsTool'
import Canvas from './_components/Canvas'

interface MusicData {
  track: string
  artist: string
  artwork: string
  previewUrl: string
}

interface RoomData {
  image: string | null
  imagePalette: string[]
  autoTags: string[]
  music: MusicData | null
  palette: string[]
  name: string
  description: string
  tags: string[]
}

function normalizeMusicPreview(raw: unknown): MusicData | null {
  if (!raw) return null

  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const music = parsed as Record<string, unknown>
  const trackRaw = music.track || music.trackName
  const artistRaw = music.artist
  const artworkRaw = music.artwork || music.artworkUrl
  const previewUrlRaw = music.previewUrl

  const track = typeof trackRaw === 'string' && trackRaw.trim() ? trackRaw.trim() : 'Untitled Track'
  const artist = typeof artistRaw === 'string' && artistRaw.trim() ? artistRaw.trim() : 'Unknown Artist'
  const artwork = typeof artworkRaw === 'string' ? artworkRaw : ''
  const previewUrl = typeof previewUrlRaw === 'string' ? previewUrlRaw : ''

  return { track, artist, artwork, previewUrl }
}

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024
const MAX_IMAGE_SIDE = 1200
const IMAGE_QUALITY = 0.72
const MAX_ROOM_NAME_LENGTH = 80
const MAX_ROOM_DESCRIPTION_LENGTH = 500

export default function Builder() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [authChecked, setAuthChecked] = useState(false)
  const [roomData, setRoomData] = useState<RoomData>({
    image: null,
    imagePalette: [],
    autoTags: [],
    music: null,
    palette: [],
    name: '',
    description: '',
    tags: [],
  })
  const [activeTool, setActiveTool] = useState<ToolKey>('image')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })
  const [coverZoom, setCoverZoom] = useState(1)
  const [musicSearch, setMusicSearch] = useState('')
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [showElements, setShowElements] = useState({ name: true, palette: true, music: true, tags: true })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/login')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.replace('/')
          return
        }
        setAuthChecked(true)
      })
      .catch(() => {
        router.replace('/')
      })
  }, [router])

  useEffect(() => {
    const templateId = searchParams.get('template')
    const trackId = searchParams.get('track')

    if (trackId) {
      const track = MUSIC_LIBRARY.find(t => t.id === trackId)
      if (track) {
        setRoomData(prev => ({
          ...prev,
          music: { track: track.track, artist: track.artist, artwork: track.artwork, previewUrl: track.previewUrl },
        }))
      }
    }

    if (!templateId) return

    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/rooms/${templateId}`)
        if (!res.ok) return
        const template = await res.json()
        if (!mounted) return

        const normalizedMusic = normalizeMusicPreview(template?.musicPreview)

        setRoomData(prev => ({
          ...prev,
          name: template?.name ? `${template.name} Remix` : prev.name,
          description: typeof template?.description === 'string' ? template.description : prev.description,
          image: template?.imageUrl || prev.image,
          palette: Array.isArray(template?.palette) ? template.palette : prev.palette,
          imagePalette: Array.isArray(template?.palette) ? template.palette : prev.imagePalette,
          tags: Array.isArray(template?.tags) ? template.tags : prev.tags,
          autoTags: Array.isArray(template?.tags) ? template.tags : prev.autoTags,
          music: normalizedMusic || prev.music,
        }))
        setTemplateLoaded(true)
      } catch {
        // Ignore template prefill errors
      }
    })()

    return () => { mounted = false }
  }, [searchParams])

  if (!authChecked) {
    return (
      <div className="container" style={{ padding: '40px 32px' }}>
        <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--foreground)', background: 'var(--muted)' }}>
          <p className="mono" style={{ color: 'var(--muted-foreground)' }}>Checking authentication...</p>
        </div>
      </div>
    )
  }

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setSubmitError('')

    if (file.size > MAX_UPLOAD_BYTES) {
      setSubmitError('Image is too large. Choose an image under 6 MB.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setExtracting(true)

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = objectUrl
      })

      const dataUrl = resizeImageToDataUrl(img)
      const colors = extractColors(img, 6)
      const tags = suggestTags(colors)

      setRoomData(prev => ({
        ...prev,
        image: dataUrl,
        imagePalette: colors,
        autoTags: tags,
        tags: tags,
        palette: colors,
      }))
      setActiveTool('palette')
    } catch (e) {
      console.error('Color extraction failed', e)
      setRoomData(prev => ({
        ...prev,
        image: null,
        imagePalette: ['#6c4bff', '#ff66c4', '#00fff6', '#00d47a', '#ffb020'],
        autoTags: ['Cyber', 'Neon'],
        tags: ['Cyber', 'Neon'],
        palette: ['#6c4bff', '#ff66c4', '#00fff6', '#00d47a', '#ffb020'],
      }))
    } finally {
      URL.revokeObjectURL(objectUrl)
      setExtracting(false)
    }
  }

  const handleSubmit = async (isPublic: boolean) => {
    setSubmitError('')

    const trimmedName = roomData.name.trim()
    const trimmedDescription = roomData.description.trim()

    if (trimmedName.length > MAX_ROOM_NAME_LENGTH) {
      setSubmitError(`Room name must be ${MAX_ROOM_NAME_LENGTH} characters or fewer`)
      return
    }
    if (trimmedDescription.length > MAX_ROOM_DESCRIPTION_LENGTH) {
      setSubmitError(`Description must be ${MAX_ROOM_DESCRIPTION_LENGTH} characters or fewer`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName || 'Untitled Room',
          description: trimmedDescription || null,
          palette: roomData.palette.length > 0 ? roomData.palette : roomData.imagePalette,
          imageUrl: roomData.image,
          tags: roomData.tags.length > 0 ? roomData.tags : roomData.autoTags,
          isPublic,
          musicPreview: roomData.music ? {
            trackId: Date.now(),
            trackName: roomData.music.track,
            artist: roomData.music.artist,
            previewUrl: roomData.music.previewUrl || null,
            artworkUrl: roomData.music.artwork || null,
          } : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to create room')
        return
      }

      router.push(`/house/${data.id}`)
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: '64px', borderBottom: '2px solid var(--foreground)',
      }}>
        <Link href="/feed" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          textDecoration: 'none', color: 'var(--foreground)',
          fontWeight: 600, fontSize: '14px', textTransform: 'uppercase',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Gallery
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon" style={{ width: '28px', height: '28px', fontSize: '14px' }}>D</div>
          <span style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
            Build Your Room
          </span>
          {templateLoaded && (
            <span className="mono" style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 600 }}>
              ✓ Template
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              background: 'var(--card)', color: 'var(--foreground)',
              border: '2px solid var(--foreground)', padding: '10px 20px',
              fontWeight: 700, fontSize: '12px', textTransform: 'uppercase',
              boxShadow: '4px 4px 0 var(--foreground)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {submitting ? 'Saving...' : 'Save to Profile'}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            style={{
              background: 'var(--success)', color: 'var(--success-foreground)',
              border: '2px solid var(--foreground)', padding: '10px 20px',
              fontWeight: 700, fontSize: '12px', textTransform: 'uppercase',
              boxShadow: '4px 4px 0 var(--foreground)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {submitting ? 'Publishing...' : 'Publish to Gallery'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: '32px', paddingTop: '24px' }}>
        <Sidebar activeTool={activeTool} onToolChange={setActiveTool}>
          {activeTool === 'image' && (
            <ImageTool
              image={roomData.image}
              imagePalette={roomData.imagePalette}
              autoTags={roomData.autoTags}
              extracting={extracting}
              error={activeTool === 'image' ? submitError : ''}
              onImageSelect={processImage}
              onRemoveImage={() => {
                setRoomData(prev => ({ ...prev, image: null, imagePalette: [], autoTags: [], palette: [], tags: [] }))
                setImagePosition({ x: 50, y: 50 })
              }}
              fileInputRef={fileInputRef}
            />
          )}
          {activeTool === 'palette' && (
            <PaletteTool
              palette={roomData.palette}
              imagePalette={roomData.imagePalette}
              onPaletteChange={(palette) => setRoomData(prev => ({ ...prev, palette }))}
            />
          )}
          {activeTool === 'tags' && (
            <TagsTool
              tags={roomData.tags}
              autoTags={roomData.autoTags}
              onTagsChange={(tags) => setRoomData(prev => ({ ...prev, tags }))}
            />
          )}
          {activeTool === 'music' && (
            <MusicTool
              music={roomData.music}
              search={musicSearch}
              onMusicChange={(music) => setRoomData(prev => ({ ...prev, music }))}
              onSearchChange={setMusicSearch}
            />
          )}
          {activeTool === 'details' && (
            <DetailsTool
              name={roomData.name}
              description={roomData.description}
              templateLoaded={templateLoaded}
              submitError={submitError}
              onNameChange={(name) => setRoomData(prev => ({ ...prev, name }))}
              onDescriptionChange={(description) => setRoomData(prev => ({ ...prev, description }))}
            />
          )}
        </Sidebar>

        <Canvas
          roomData={roomData}
          imagePosition={imagePosition}
          coverZoom={coverZoom}
          onPositionChange={setImagePosition}
          onZoomChange={setCoverZoom}
          showElements={showElements}
          onShowElementsChange={setShowElements}
        />
      </div>
    </div>
  )
}

function resizeImageToDataUrl(img: HTMLImageElement): string {
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not available')
  }

  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
}
