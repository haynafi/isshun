import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Event } from '@/types/event';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Await context.params
    const params = await context.params;
    const { id } = params;

    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const events = (await query(
      'SELECT id, title, place, gradient, icon, date, time, status, qr_code_path, photo_path FROM events WHERE id = ?',
      [eventId]
    )) as Event[];

    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(events[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}
