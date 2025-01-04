import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';

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
  // Validate credentials before using
  validateCredentials(credentials);

  const auth = new google.auth.GoogleAuth({
    credentials,  // Directly use the credentials object
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

async function updatePhotoPath(eventId: string, fileUrl: string | null | undefined) {
  const API_URL = 'https://isshun.site/bridge/update-photo'; // Your API endpoint
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
      body: JSON.stringify({
        fileUrl: fileUrl,
        eventId: eventId,
      }),
    });

    // Log the response details for debugging
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

    // Update the photo path via the /bridge/update-photo API
    await updatePhotoPath(eventId, fileUrl);

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
