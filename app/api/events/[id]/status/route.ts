import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const { status } = await request.json()
    if (status !== 'accepted' && status !== 'declined') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await query(
      'UPDATE events SET status = ? WHERE id = ?',
      [status, id]
    )

    return NextResponse.json({ message: 'Event status updated successfully' })
  } catch (error) {
    console.error('Error updating event status:', error)
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    )
  }
}

