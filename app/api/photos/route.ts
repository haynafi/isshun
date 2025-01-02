import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const results = await query(
      'SELECT id, photo_path, title, date FROM events WHERE photo_path IS NOT NULL'
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
