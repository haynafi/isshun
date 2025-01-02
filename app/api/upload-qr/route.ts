import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const path = join('public', 'qr-codes', file.name)
    await writeFile(path, buffer)

    const dbPath = `/qr-codes/${file.name}`
    await query('UPDATE events SET qr_code_path = ? WHERE id = ?', [dbPath, eventId])

    return NextResponse.json({ message: 'File uploaded successfully', path: dbPath })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

