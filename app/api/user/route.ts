import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)
      return NextResponse.json({ name: session.name })
    } catch (error) {
      console.error('Error parsing session cookie:', error)
    }
  }
  
  return NextResponse.json({ name: 'User' }, { status: 401 })
}

