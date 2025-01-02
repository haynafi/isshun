import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Event } from '@/types/event'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter')

  try {
    let events: Event[]

    if (filter === 'upcoming') {
      events = await getUpcomingEvents()
    } else if (filter === 'previous') {
      events = await getPreviousEvents()
    } else {
      return NextResponse.json({ error: 'Invalid filter parameter' }, { status: 400 })
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const eventData = await extractEventData(formData)
    
    if (!isValidEventData(eventData)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const qrCodePath = await handleQRCodeUpload(formData.get('qrCode') as File | null)
    const newEvent = await createEvent({ ...eventData, qrCodePath })

    return NextResponse.json(
      { message: 'Event created successfully', id: newEvent.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

async function getUpcomingEvents(): Promise<Event[]> {
  return await query(
    'SELECT id, title, place, gradient, icon, date, time, status, qr_code_path FROM events WHERE date >= CURDATE() ORDER BY date ASC',
    []
  ) as Event[];
}

async function getPreviousEvents(): Promise<Event[]> {
  return await query(
    'SELECT id, title, place, gradient, icon, date, time, status, qr_code_path FROM events WHERE date < CURDATE() ORDER BY date DESC',
    []
  ) as Event[];
}

interface EventFormData {
  title: string;
  place: string;
  gradient: string;
  icon: string;
  date: string;
  time: string;
}

async function extractEventData(formData: FormData): Promise<EventFormData> {
  return {
    title: formData.get('title') as string,
    place: formData.get('place') as string,
    gradient: formData.get('gradient') as string,
    icon: formData.get('icon') as string,
    date: formData.get('date') as string,
    time: formData.get('time') as string,
  }
}

function isValidEventData(data: EventFormData): boolean {
  return Boolean(
    data.title &&
    data.place &&
    data.gradient &&
    data.icon &&
    data.date &&
    data.time
  )
}

async function handleQRCodeUpload(file: File | null): Promise<string | null> {
  if (!file) return null

  try {
    const uploadDir = join(process.cwd(), 'public', 'qr-codes')
    await mkdir(uploadDir, { recursive: true })

    const filename = `${Date.now()}-${file.name}`
    const filepath = join(uploadDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    return `/qr-codes/${filename}`
  } catch (error) {
    console.error('Error handling QR code upload:', error)
    return null
  }
}

interface EventDataWithQR extends EventFormData {
  qrCodePath: string | null;
}

interface InsertResult {
  insertId: number;
}

async function createEvent(eventData: EventDataWithQR): Promise<InsertResult> {
  const result = await query(
    `INSERT INTO events (
      title, place, gradient, icon, date, time, qr_code_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      eventData.title,
      eventData.place,
      eventData.gradient,
      eventData.icon,
      eventData.date,
      eventData.time,
      eventData.qrCodePath
    ]
  )
  return result as InsertResult
}

