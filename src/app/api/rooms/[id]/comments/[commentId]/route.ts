import { NextRequest, NextResponse } from 'next/server'
import { deleteComment, getCommentById, getRoomById, updateComment } from '../../../../../_lib/db'
import { readSession } from '../../../../../_lib/auth'

const MAX_COMMENT_LENGTH = 500

function canModerate(session: { userId: string; username: string }, roomCreator?: string, commentUserId?: string) {
  return session.username === roomCreator || session.userId === commentUserId
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = readSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Must be signed in to edit comments' }, { status: 401 })
    }

    const room = await getRoomById(params.id)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const comment = await getCommentById(params.commentId)
    if (!comment || comment.roomId !== params.id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (!canModerate(session, room.creator, comment.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (!text) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` }, { status: 400 })
    }

    const updated = await updateComment(params.commentId, text)
    if (!updated) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = readSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Must be signed in to delete comments' }, { status: 401 })
    }

    const room = await getRoomById(params.id)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const comment = await getCommentById(params.commentId)
    if (!comment || comment.roomId !== params.id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (!canModerate(session, room.creator, comment.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deleted = await deleteComment(params.commentId)
    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
