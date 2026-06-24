import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, publicUser, sessionCookie } from '../../../_lib/auth'
import { createUser, getUserByEmail, getUserByUsername } from '../../../_lib/db'

const usernamePattern = /^[a-zA-Z0-9_]{3,24}$/

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, password, and username are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (!usernamePattern.test(username)) {
      return NextResponse.json({ error: 'Username must be 3-24 letters, numbers, or underscores' }, { status: 400 })
    }

    if (await getUserByEmail(email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    if (await getUserByUsername(username)) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const user = await createUser({ email, password, username })
    const response = NextResponse.json({
      authenticated: true,
      user: publicUser(user),
    }, { status: 201 })

    response.cookies.set(AUTH_COOKIE, sessionCookie({
      userId: user.id,
      username: user.username,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
