import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, hashPassword, publicUser, readSession, sessionCookie } from '../../../_lib/auth'
import { getUserByEmail, getUserById } from '../../../_lib/db'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user || user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const response = NextResponse.json({
      authenticated: true,
      user: publicUser(user),
    })

    response.cookies.set(AUTH_COOKIE, sessionCookie({
      userId: user.id,
      username: user.username,
    }), cookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = readSession(request)
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  const user = await getUserById(session.userId)
  if (!user) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user: publicUser(user),
  })
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
