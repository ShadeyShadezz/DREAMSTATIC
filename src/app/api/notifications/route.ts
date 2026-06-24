import { NextRequest, NextResponse } from 'next/server'
import { getNotificationsForUser, markNotificationsAsRead } from '../../_lib/db'
import { readSession } from '../../_lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = readSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Number(searchParams.get('limit') || 60)
    const boundedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 60
    const result = await getNotificationsForUser(session.userId, boundedLimit)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = readSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = await request.json().catch(() => ({}))
    const ids = Array.isArray(payload?.ids) ? payload.ids : []
    const markedCount = await markNotificationsAsRead(session.userId, ids)
    const result = await getNotificationsForUser(session.userId, 60)

    return NextResponse.json({
      success: true,
      markedCount,
      ...result,
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
