import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE } from './app/_lib/constants'

const protectedPages = ['/builder', '/profile', '/settings', '/drafts', '/notifications']

function hasSession(request: NextRequest): boolean {
  const raw = request.cookies.get(AUTH_COOKIE)?.value
  if (!raw) return false

  try {
    const parsed = JSON.parse(raw)
    return typeof parsed?.userId === 'string' && typeof parsed?.username === 'string'
  } catch {
    return false
  }
}

function isProtectedPage(pathname: string): boolean {
  return protectedPages.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const authenticated = hasSession(request)

  if (pathname === '/' && authenticated) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (isProtectedPage(pathname) && !authenticated) {
    const target = `${pathname}${search}`
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('next', target)
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === '/api/rooms') {
    const isMutation = request.method === 'POST'
    const requestingMine = request.nextUrl.searchParams.get('mine') === 'true'

    if ((isMutation || requestingMine) && !authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
  }

  if (pathname.startsWith('/api/rooms/') && pathname.split('/').length >= 4) {
    const isMutation = request.method === 'PUT' || request.method === 'DELETE'
    if (isMutation && !authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
  }

  if (pathname === '/api/notifications' && !authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/builder',
    '/builder/:path*',
    '/profile',
    '/profile/:path*',
    '/settings',
    '/settings/:path*',
    '/drafts',
    '/drafts/:path*',
    '/notifications',
    '/notifications/:path*',
    '/api/rooms',
    '/api/rooms/:path*',
    '/api/notifications',
  ],
}
