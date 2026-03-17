import { NextRequest, NextResponse } from 'next/server'
import { getRoomById, updateRoom, deleteRoom } from '@/lib/db'

// GET /api/rooms/[id] - Get a single room by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoomById(params.id)
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
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
    const body = await request.json()
    const updatedRoom = await updateRoom(params.id, body)
    
    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

// DELETE /api/rooms/[id] - Delete a room
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
