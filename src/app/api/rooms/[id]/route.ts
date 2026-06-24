import { NextRequest, NextResponse } from 'next/server'
import { getRoomById, updateRoom, deleteRoom } from '../../../_lib/db'
import { readSession } from '../../../_lib/auth'

const MAX_ROOM_NAME_LENGTH = 80
const MAX_ROOM_DESCRIPTION_LENGTH = 500
const MAX_IMAGE_DATA_URL_LENGTH = 900_000
const MAX_PALETTE_COLORS = 8
const MAX_TAGS = 12
const MAX_TRACK_NAME_LENGTH = 180
const MAX_ARTIST_LENGTH = 120
const MAX_URL_LENGTH = 2048
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

// GET /api/rooms/[id] - Get a single room by ID.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoomById(params.id)
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // If room is private, only return it to the creator
    if (room.isPublic === false) {
      const session = readSession(request)
      if (!session || session.username !== room.creator) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }
    }
    
    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 })
  }
}

// PUT /api/rooms/[id] - Update a room
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = readSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const existing = await getRoomById(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (existing.creator !== session.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const patch = normalizePatch(body as Record<string, unknown>)
    const updatedRoom = await updateRoom(params.id, patch)
    
    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

function normalizePatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {}

  if (typeof body.name === 'string') {
    const trimmed = body.name.trim()
    if (trimmed) patch.name = trimmed.slice(0, MAX_ROOM_NAME_LENGTH)
  }

  if (typeof body.description === 'string') {
    const normalized = body.description.replace(/\r\n?/g, '\n').trim()
    patch.description = normalized ? normalized.slice(0, MAX_ROOM_DESCRIPTION_LENGTH) : null
  } else if (body.description === null) {
    patch.description = null
  }

  if (typeof body.imageUrl === 'string') {
    const trimmed = body.imageUrl.trim()
    patch.imageUrl = trimmed ? trimmed.slice(0, MAX_IMAGE_DATA_URL_LENGTH) : null
  } else if (body.imageUrl === null) {
    patch.imageUrl = null
  }

  if (Array.isArray(body.palette)) {
    patch.palette = normalizePalette(body.palette)
  }

  if (Array.isArray(body.tags)) {
    patch.tags = normalizeTags(body.tags)
  }

  if (typeof body.isPublic === 'boolean') {
    patch.isPublic = body.isPublic
  }

  if ('musicPreview' in body) {
    patch.musicPreview = normalizeMusicPreview(body.musicPreview)
  }

  return patch
}

function normalizePalette(value: unknown[]): string[] {
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

function normalizeTags(value: unknown[]): string[] {
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

// DELETE /api/rooms/[id] - Delete a room
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = readSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const existing = await getRoomById(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (existing.creator !== session.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await deleteRoom(params.id)
    
    if (!success) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
