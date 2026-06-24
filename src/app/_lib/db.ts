import { hashPassword } from './auth'

let prisma: any = null

async function getPrisma() {
  if (prisma) return prisma
  const { PrismaClient } = await import('@prisma/client')
  const { PrismaNeon } = await import('@prisma/adapter-neon')
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is required')
  const adapter = new PrismaNeon({ connectionString })
  prisma = new PrismaClient({ adapter })
  await prisma.$connect()
  return prisma
}

export interface Room {
  id: string
  name: string
  description?: string | null
  creator?: string
  userId?: string | null
  palette?: string[]
  imageUrl?: string | null
  musicPreview?: MusicPreview | string | null
  tags?: string[]
  createdAt: string
  isPublic?: boolean
}

export interface MusicPreview {
  trackId?: number | string
  trackName?: string
  artist?: string
  previewUrl?: string | null
  artworkUrl?: string | null
  track?: string
  artwork?: string
}

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  displayName: string
  bio: string
  joinedAt: string
}

export interface Comment {
  id: string
  roomId: string
  userId: string
  username: string
  body: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  type: 'comment' | 'update'
  title: string
  body: string
  createdAt: string
  roomId?: string
  isRead?: boolean
}

interface NotificationListResult {
  notifications: NotificationItem[]
  unreadCount: number
}

export async function getRooms(options?: {
  page?: number
  limit?: number
  onlyPublic?: boolean
  creator?: string
  userId?: string
}): Promise<{ rooms: Room[]; total: number }> {
  const p = await getPrisma()
  const page = options?.page || 1
  const limit = options?.limit || 100
  const skip = (page - 1) * limit

  const where: any = {}
  if (options?.onlyPublic) where.isPublic = true
  if (options?.creator) where.creator = options.creator
  if (options?.userId) where.userId = options.userId

  const [rooms, total] = await Promise.all([
    p.room.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    p.room.count({ where }),
  ])

  return { rooms: rooms.map(toRoom), total }
}

export async function saveRoom(room: Room): Promise<Room> {
  const p = await getPrisma()
  const created = await p.room.create({
    data: {
      id: room.id,
      name: typeof room.name === 'string' && room.name.trim() ? room.name.trim() : 'Untitled Room',
      description: sanitizeDescription(room.description),
      creator: room.creator || 'anon',
      userId: room.userId || null,
      palette: sanitizeStringArray(room.palette),
      imageUrl: room.imageUrl || null,
      musicPreview: serializeMusicPreview(room.musicPreview),
      tags: sanitizeStringArray(room.tags),
      isPublic: room.isPublic !== false,
    },
  })
  return toRoom(created)
}

export async function getRoomById(id: string): Promise<Room | null> {
  const p = await getPrisma()
  const room = await p.room.findUnique({ where: { id } })
  return room ? toRoom(room) : null
}

export async function updateRoom(id: string, patch: Partial<Room>): Promise<Room | null> {
  const p = await getPrisma()
  const data: any = {}

  if (typeof patch.name === 'string') {
    const trimmed = patch.name.trim()
    if (trimmed) data.name = trimmed
  }
  if (typeof patch.description === 'string' || patch.description === null) {
    data.description = sanitizeDescription(patch.description)
  }
  if (typeof patch.creator === 'string') data.creator = patch.creator
  if (typeof patch.userId === 'string' || patch.userId === null) data.userId = patch.userId
  if (Array.isArray(patch.palette)) data.palette = sanitizeStringArray(patch.palette)
  if (typeof patch.imageUrl === 'string' || patch.imageUrl === null) data.imageUrl = patch.imageUrl
  if ('musicPreview' in patch) data.musicPreview = serializeMusicPreview(patch.musicPreview)
  if (Array.isArray(patch.tags)) data.tags = sanitizeStringArray(patch.tags)
  if (typeof patch.isPublic === 'boolean') data.isPublic = patch.isPublic

  try {
    const updated = await p.room.update({ where: { id }, data })
    return toRoom(updated)
  } catch (error: any) {
    if (error?.code === 'P2025') return null
    throw error
  }
}

export async function deleteRoom(id: string): Promise<boolean> {
  const p = await getPrisma()
  await p.room.delete({ where: { id } })
  return true
}

export async function getUserById(id: string): Promise<User | null> {
  const p = await getPrisma()
  const user = await p.user.findUnique({ where: { id } })
  return user ? toUser(user) : null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const p = await getPrisma()
  const normalizedEmail = email.trim().toLowerCase()
  const user = await p.user.findUnique({ where: { email: normalizedEmail } })
  return user ? toUser(user) : null
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const p = await getPrisma()
  const normalizedUsername = normalizeUsername(username)
  const user = await p.user.findUnique({ where: { username: normalizedUsername } })
  return user ? toUser(user) : null
}

export async function createUser(input: {
  email: string
  username: string
  password: string
}): Promise<User> {
  const p = await getPrisma()
  const user = {
    id: generateId(),
    email: input.email.trim().toLowerCase(),
    username: normalizeUsername(input.username),
    passwordHash: hashPassword(input.password),
    displayName: displayNameFromUsername(input.username),
    bio: 'New dreamstatic explorer',
    joinedAt: new Date().toISOString(),
  }
  const created = await p.user.create({ data: user })
  return toUser(created)
}

export async function getCommentsByRoom(roomId: string): Promise<Comment[]> {
  const p = await getPrisma()
  const comments = await p.comment.findMany({
    where: { roomId },
    orderBy: { createdAt: 'asc' },
    take: 300,
  })
  return comments.map(toComment)
}

export async function createComment(input: {
  roomId: string
  userId: string
  username: string
  body: string
}): Promise<Comment> {
  const p = await getPrisma()
  const body = sanitizeCommentBody(input.body)
  const comment = await p.comment.create({
    data: {
      id: generateId(),
      roomId: input.roomId,
      userId: input.userId,
      username: input.username,
      body,
    },
  })
  return toComment(comment)
}

export async function getCommentById(id: string): Promise<Comment | null> {
  const p = await getPrisma()
  const comment = await p.comment.findUnique({ where: { id } })
  return comment ? toComment(comment) : null
}

export async function updateComment(id: string, body: string): Promise<Comment | null> {
  const p = await getPrisma()
  const sanitized = sanitizeCommentBody(body)
  if (!sanitized) return null

  try {
    const updated = await p.comment.update({
      where: { id },
      data: { body: sanitized },
    })
    return toComment(updated)
  } catch (error: any) {
    if (error?.code === 'P2025') return null
    throw error
  }
}

export async function deleteComment(id: string): Promise<boolean> {
  const p = await getPrisma()
  try {
    await p.comment.delete({ where: { id } })
    return true
  } catch (error: any) {
    if (error?.code === 'P2025') return false
    throw error
  }
}

export async function getNotificationsForUser(userId: string, limit = 50): Promise<NotificationListResult> {
  const p = await getPrisma()
  const notificationReadModel = p?.notificationRead

  const rooms = await p.room.findMany({
    where: { userId },
    select: { id: true, name: true },
    take: 200,
  })

  const roomNameById = new Map<string, string>()
  const roomIds: string[] = []
  for (const room of rooms) {
    if (typeof room.id === 'string') {
      roomIds.push(room.id)
      roomNameById.set(room.id, typeof room.name === 'string' ? room.name : 'Untitled Room')
    }
  }

  const commentRows = roomIds.length
    ? await p.comment.findMany({
        where: {
          roomId: { in: roomIds },
          userId: { not: userId },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    : []

  const commentNotifications: NotificationItem[] = commentRows.map((row: any) => ({
    id: `comment:${row.id}`,
    type: 'comment',
    title: `New comment on ${roomNameById.get(row.roomId) || 'your room'}`,
    body: `@${row.username}: ${String(row.body || '').slice(0, 140)}`,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    roomId: row.roomId,
  }))

  const systemUpdates: NotificationItem[] = [
    {
      id: 'update:dreamstatic-notifications-v1',
      type: 'update',
      title: 'Dreamstatic Update',
      body: 'Notifications are live for comment activity. More detailed alerts are coming soon.',
      createdAt: new Date().toISOString(),
    },
  ]

  const combined = [...commentNotifications, ...systemUpdates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  if (!notificationReadModel || typeof notificationReadModel.findMany !== 'function') {
    return {
      notifications: combined.map((item) => ({ ...item, isRead: false })),
      unreadCount: combined.length,
    }
  }

  const notificationIds = combined.map((item) => item.id)
  const readRows = notificationIds.length
    ? await notificationReadModel.findMany({
        where: {
          userId,
          notificationId: { in: notificationIds },
        },
        select: { notificationId: true },
      })
    : []

  const readSet = new Set<string>(readRows.map((row: any) => String(row.notificationId)))
  const notifications = combined.map((item) => ({
    ...item,
    isRead: readSet.has(item.id),
  }))

  const unreadCount = notifications.reduce((count, item) => (item.isRead ? count : count + 1), 0)

  return {
    notifications,
    unreadCount,
  }
}

export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<number> {
  const p = await getPrisma()
  const notificationReadModel = p?.notificationRead
  if (!notificationReadModel || typeof notificationReadModel.createMany !== 'function') return 0

  const normalizedIds = Array.from(
    new Set(
      notificationIds
        .filter((id) => typeof id === 'string')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ).slice(0, 100)

  if (!normalizedIds.length) return 0

  const result = await notificationReadModel.createMany({
    data: normalizedIds.map((notificationId) => ({
      userId,
      notificationId,
    })),
    skipDuplicates: true,
  })

  return typeof result?.count === 'number' ? result.count : 0
}

function toRoom(record: any): Room {
  return {
    ...record,
    description: sanitizeDescription(record.description),
    palette: Array.isArray(record.palette) ? sanitizeStringArray(record.palette) : [],
    tags: Array.isArray(record.tags) ? sanitizeStringArray(record.tags) : [],
    musicPreview: parseMusicPreview(record.musicPreview),
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  }
}

function toUser(record: any): User {
  return {
    ...record,
    joinedAt: record.joinedAt instanceof Date ? record.joinedAt.toISOString() : record.joinedAt,
  }
}

function toComment(record: any): Comment {
  return {
    ...record,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  }
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
}

function displayNameFromUsername(username: string): string {
  return normalizeUsername(username)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function sanitizeStringArray(value: unknown, maxItems = 24, maxItemLength = 80): string[] {
  if (!Array.isArray(value)) return []
  const result: string[] = []

  for (const item of value) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue
    result.push(trimmed.slice(0, maxItemLength))
    if (result.length >= maxItems) break
  }

  return result
}

function serializeMusicPreview(value: unknown): string | null {
  if (value == null) return null

  let parsed: unknown = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return trimmed
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const loose = parsed as Record<string, unknown>
  const trackName = pickString(loose.trackName ?? loose.track, 180)
  const artist = pickString(loose.artist, 120)
  const previewUrl = pickString(loose.previewUrl, 2048)
  const artworkUrl = pickString(loose.artworkUrl ?? loose.artwork, 2048)
  const trackId = pickTrackId(loose.trackId)

  const normalized: Record<string, unknown> = {}
  if (trackId !== undefined) normalized.trackId = trackId
  if (trackName) normalized.trackName = trackName
  if (artist) normalized.artist = artist
  if (previewUrl) normalized.previewUrl = previewUrl
  if (artworkUrl) normalized.artworkUrl = artworkUrl

  if (!Object.keys(normalized).length) return null
  return JSON.stringify(normalized)
}

function parseMusicPreview(value: unknown): MusicPreview | null {
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
  const trackName = pickString(loose.trackName ?? loose.track, 180)
  const artist = pickString(loose.artist, 120)
  const previewUrl = pickString(loose.previewUrl, 2048)
  const artworkUrl = pickString(loose.artworkUrl ?? loose.artwork, 2048)
  const trackId = pickTrackId(loose.trackId)

  const normalized: MusicPreview = {}
  if (trackId !== undefined) normalized.trackId = trackId
  if (trackName) {
    normalized.trackName = trackName
    normalized.track = trackName
  }
  if (artist) normalized.artist = artist
  if (previewUrl) normalized.previewUrl = previewUrl
  if (artworkUrl) {
    normalized.artworkUrl = artworkUrl
    normalized.artwork = artworkUrl
  }

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

function sanitizeDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return null
  return normalized.slice(0, 500)
}

function sanitizeCommentBody(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n?/g, '\n').trim().slice(0, 500)
}
