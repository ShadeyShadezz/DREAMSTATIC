import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByRoom, createComment, getRoomById } from '../../../../_lib/db'
import { readSession } from '../../../../_lib/auth'

const MAX_COMMENT_LENGTH = 500

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoomById(params.id)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.isPublic === false) {
      const session = readSession(request)
      if (!session || session.username !== room.creator) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }
    }

    const comments = await getCommentsByRoom(params.id)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = readSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Must be signed in to comment' }, { status: 401 })
    }

    const room = await getRoomById(params.id)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.isPublic === false && room.creator !== session.username) {
      return NextResponse.json({ error: 'Cannot comment on this room' }, { status: 403 })
    }

    const body = await request.json()
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (!text) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` }, { status: 400 })
    }

    const comment = await createComment({
      roomId: params.id,
      userId: session.userId,
      username: session.username,
      body: text,
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
