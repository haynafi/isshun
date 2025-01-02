import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/lib/db'; // Correct import for your query function

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

export async function POST(req: NextRequest) {
  try {
    const { photo, eventId } = await req.json();
    if (!photo || !eventId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const fileName = `photo_${eventId}_${Date.now()}.jpg`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Ensure the upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Save the photo to disk
    await fs.writeFile(filePath, base64Data, 'base64');

    // Save the photo path to the database
    await query('UPDATE events SET photo_path = ? WHERE id = ?', [fileName, eventId]);

    return NextResponse.json({ photoPath: fileName });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
