import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername } from '../../../_lib/db'

const SAFE_FIELDS = ['id', 'username', 'displayName', 'bio', 'joinedAt'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = await getUserByUsername(params.username)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const safe: Record<string, unknown> = {}
    for (const field of SAFE_FIELDS) {
      safe[field] = (user as any)[field]
    }
    return NextResponse.json(safe)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
