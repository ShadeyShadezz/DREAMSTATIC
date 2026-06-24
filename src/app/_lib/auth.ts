import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { AUTH_COOKIE } from './constants'

export { AUTH_COOKIE }

export interface AuthSession {
  userId: string
  username: string
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function publicUser(user: any) {
  if (!user) return null
  const { password, passwordHash, ...safeUser } = user
  return safeUser
}

export function readSession(request: NextRequest): AuthSession | null {
  const cookie = request.cookies.get(AUTH_COOKIE)
  if (!cookie?.value) return null

  try {
    const parsed = JSON.parse(cookie.value)
    if (typeof parsed.userId !== 'string' || typeof parsed.username !== 'string') {
      return null
    }
    return { userId: parsed.userId, username: parsed.username }
  } catch {
    return null
  }
}

export function sessionCookie(session: AuthSession) {
  return JSON.stringify(session)
}
