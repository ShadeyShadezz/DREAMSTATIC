import { NextRequest, NextResponse } from 'next/server'
import { getRooms, saveRoom } from '../../_lib/db'
import { readSession } from '../../_lib/auth'

const MAX_IMAGE_DATA_URL_LENGTH = 900_000
const MAX_PALETTE_COLORS = 8
const MAX_TAGS = 12
const MAX_ROOM_NAME_LENGTH = 80
const MAX_ROOM_DESCRIPTION_LENGTH = 500
const MAX_TRACK_NAME_LENGTH = 180
const MAX_ARTIST_LENGTH = 120
const MAX_URL_LENGTH = 2048
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

// GET /api/rooms - Get rooms with optional filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mine = searchParams.get('mine')
    const creator = searchParams.get('creator')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)))
    const session = readSession(request)

    // ?mine=true - return all rooms for the authenticated user (including private)
    if (mine === 'true') {
      if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      const result = await getRooms({ userId: session.userId, page, limit })
      return NextResponse.json({ rooms: result.rooms, total: result.total, page, limit })
    }

    // ?creator=username - return public rooms by a specific creator
    if (creator) {
      const result = await getRooms({ creator, onlyPublic: true, page, limit })
      return NextResponse.json({ rooms: result.rooms, total: result.total, page, limit })
    }

    // Default: return all public rooms (gallery view) with pagination
    const result = await getRooms({ onlyPublic: true, page, limit })
    return NextResponse.json({ rooms: result.rooms, total: result.total, page, limit })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const session = readSession(request)

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const requestedName = typeof body.name === 'string' ? body.name.trim() : ''
    const roomName = requestedName || 'Untitled Room'

    if (requestedName.length > MAX_ROOM_NAME_LENGTH) {
      return NextResponse.json({ error: `Room name must be ${MAX_ROOM_NAME_LENGTH} characters or fewer` }, { status: 400 })
    }

    const imageUrl = normalizeImageUrl(body.imageUrl)
    if (typeof imageUrl === 'string' && imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return NextResponse.json({ error: 'Image is too large. Use a smaller image.' }, { status: 413 })
    }

    const palette = normalizePalette(body.palette)
    const tags = normalizeTags(body.tags)
    const description = normalizeDescription(body.description)
    const musicPreview = normalizeMusicPreview(body.musicPreview)

    // Create room object with required fields
    const newRoom = {
      id: generateId(),
      name: roomName,
      description,
      creator: session.username,
      userId: session.userId,
      palette,
      imageUrl,
      musicPreview,
      tags,
      createdAt: new Date().toISOString(),
      isPublic: body.isPublic === true,
    }

    const createdRoom = await saveRoom(newRoom)
    
    return NextResponse.json(createdRoom, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

// Helper function to generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + '.' + Math.random().toString(36).substring(2, 15)
}

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, MAX_IMAGE_DATA_URL_LENGTH)
}

function normalizePalette(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const color = entry.trim()
    if (!HEX_COLOR_RE.test(color)) continue
    unique.add(color.toLowerCase())
    if (unique.size >= MAX_PALETTE_COLORS) break
  }
  return [...unique]
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const trimmed = entry.trim()
    if (!trimmed) continue
    unique.add(trimmed.slice(0, 40))
    if (unique.size >= MAX_TAGS) break
  }
  return [...unique]
}

function normalizeDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return null
  return normalized.slice(0, MAX_ROOM_DESCRIPTION_LENGTH)
}

function normalizeMusicPreview(value: unknown): Record<string, unknown> | null {
  if (value == null) return null

  let parsed: unknown = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const loose = parsed as Record<string, unknown>
  const trackName = pickString(loose.trackName ?? loose.track, MAX_TRACK_NAME_LENGTH)
  const artist = pickString(loose.artist, MAX_ARTIST_LENGTH)
  const previewUrl = pickString(loose.previewUrl, MAX_URL_LENGTH)
  const artworkUrl = pickString(loose.artworkUrl ?? loose.artwork, MAX_URL_LENGTH)
  const trackId = pickTrackId(loose.trackId)

  const normalized: Record<string, unknown> = {}
  if (trackId !== undefined) normalized.trackId = trackId
  if (trackName) normalized.trackName = trackName
  if (artist) normalized.artist = artist
  if (previewUrl) normalized.previewUrl = previewUrl
  if (artworkUrl) normalized.artworkUrl = artworkUrl

  return Object.keys(normalized).length ? normalized : null
}

function pickString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

function pickTrackId(value: unknown): number | string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 120)
  return undefined
}
