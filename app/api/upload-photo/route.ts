import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';
import os from 'os'; // Import the OS module

const DRIVE_FOLDER_ID = '11IBbJ_JMWeSX-TzwkQLCPNNSDfl2lkKk';

// Define the type for credentials
interface GoogleAuthCredentials {
  type: string;
  project_id: string | undefined;
  private_key_id: string | undefined;
  private_key: string | undefined;
  client_email: string | undefined;
  client_id: string | undefined;
  auth_uri: string | undefined;
  token_uri: string | undefined;
  auth_provider_x509_cert_url: string | undefined;
  client_x509_cert_url: string | undefined;
  universe_domain: string | undefined;
}

// Set credentials
const credentials: GoogleAuthCredentials = {
  type: "service_account",
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key ? process.env.private_key.replace(/\\n/g, '\n') : undefined, 
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
  universe_domain: process.env.universe_domain,
};

// Validate credentials
function validateCredentials(credentials: GoogleAuthCredentials) {
  if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
    throw new Error("Missing required credentials for Google Auth");
  }
}

// Get Drive client
async function getDriveClient() {
  validateCredentials(credentials);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

async function updatePhotoPath(eventId: string, fileUrl: string | null | undefined) {
  const API_URL = 'https://isshun.site/bridge/update-photo';
  const API_KEY = process.env.BRIDGE_API_KEY || 'h8UEevzsMDRKHanaPriska21hsKhMaNk';

  if (!API_KEY) {
    throw new Error('API Key is missing.');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ fileUrl, eventId }),
    });

    const responseBody = await response.json();
    console.log('Response from /bridge/update-photo:', responseBody);

    if (!response.ok) {
      throw new Error(`Failed to update photo path: ${responseBody.error || response.statusText}`);
    }

    return responseBody;
  } catch (error) {
    console.error('Error in updatePhotoPath API:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { photo, eventId } = await req.json();
    if (!photo || !eventId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    console.log('Received photo data length:', photo.length);
    console.log('Photo data preview:', photo.substring(0, 100));

    if (!photo.includes('base64')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const mimeMatch = photo.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (!mimeMatch) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }
    const mimeType = mimeMatch[1];

    const base64Data = photo.split(';base64,').pop();
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid base64 data' }, { status: 400 });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    console.log('Buffer length:', buffer.length);

    // Save a local copy of the image to a cross-platform temporary directory
    const tempDir = os.tmpdir(); // Cross-platform temporary directory
    const debugPath = path.join(tempDir, 'debug_image.jpg');

    // Save the debug image
    await fs.writeFile(debugPath, buffer);
    console.log('Debug image saved to:', debugPath);

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Empty image data' }, { status: 400 });
    }

    const stream = Readable.from(buffer);

    const drive = await getDriveClient();
    const fileName = `photo_${eventId}_${Date.now()}.jpg`;

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [DRIVE_FOLDER_ID],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id,webViewLink,webContentLink',
    });

    if (!response.data.id) {
      throw new Error('Failed to upload to Google Drive');
    }

    const fileUrl = response.data.webViewLink;
    console.log('File uploaded successfully. URL:', fileUrl);

    await updatePhotoPath(eventId, fileUrl);

    return NextResponse.json({ 
      photoPath: fileUrl,
      fileId: response.data.id,
      mimeType,
      debugInfo: {
        originalLength: photo.length,
        bufferLength: buffer.length,
        mimeType,
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
