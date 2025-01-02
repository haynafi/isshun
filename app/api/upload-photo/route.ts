import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import path from 'path';
import { query } from '@/lib/db';
import fs from 'fs/promises';

const DRIVE_FOLDER_ID = '11IBbJ_JMWeSX-TzwkQLCPNNSDfl2lkKk';

async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

export async function POST(req: NextRequest) {
  try {
    const { photo, eventId } = await req.json();
    if (!photo || !eventId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Debug logging
    console.log('Received photo data length:', photo.length);
    console.log('Photo data preview:', photo.substring(0, 100));

    // Validate the base64 image data
    if (!photo.includes('base64')) {
      console.error('Base64 header missing');
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Extract the MIME type
    const mimeMatch = photo.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (!mimeMatch) {
      console.error('Invalid MIME type format');
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }
    const mimeType = mimeMatch[1];
    console.log('Detected MIME type:', mimeType);

    // Extract and decode the base64 data
    const base64Data = photo.split(';base64,').pop();
    if (!base64Data) {
      console.error('No base64 data found after split');
      return NextResponse.json({ error: 'Invalid base64 data' }, { status: 400 });
    }

    // Convert to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    console.log('Buffer length:', buffer.length);

    // Debug: Save a local copy of the image for inspection
    const debugPath = path.join(process.cwd(), 'debug_image.jpg');
    await fs.writeFile(debugPath, buffer);
    console.log('Debug image saved to:', debugPath);

    // Validate buffer size
    if (buffer.length === 0) {
      console.error('Empty buffer created');
      return NextResponse.json({ error: 'Empty image data' }, { status: 400 });
    }

    // Create readable stream
    const stream = Readable.from(buffer);

    const drive = await getDriveClient();
    const fileName = `photo_${eventId}_${Date.now()}.jpg`;

    // Upload with proper MIME type
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: 'id,webViewLink,webContentLink',
    });

    if (!response.data.id) {
      throw new Error('Failed to upload to Google Drive');
    }

    const fileUrl = response.data.webViewLink;
    console.log('File uploaded successfully. URL:', fileUrl);

    await query('UPDATE events SET photo_path = ? WHERE id = ?', [fileUrl, eventId]);

    return NextResponse.json({ 
      photoPath: fileUrl,
      fileId: response.data.id,
      mimeType: mimeType,
      debugInfo: {
        originalLength: photo.length,
        bufferLength: buffer.length,
        mimeType: mimeType
      }
    });
  } catch (error) {
    console.error('Error uploading photo to Google Drive:', error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message,
        stack: error.stack 
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}