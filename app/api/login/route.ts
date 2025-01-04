import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Hardcoded users
const users = [
  { email: 'hana@isshun.site', password: 'Hanacakep21', name: 'Hana' },
  { email: 'nafi@isshun.site', password: 'Nafijugacakep13', name: 'Nafi' }
]

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // Find user
  const user = users.find(u => u.email === email)

  if (user) {
    if (user.password === password) {
      // Create a session (in a real app, you'd generate a proper session token)
      const response = NextResponse.json({ success: true, name: user.name })
      response.cookies.set('session', JSON.stringify({ name: user.name }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      })
      return response
    } else {
      return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 401 })
    }
  }

  return NextResponse.json({ success: false, message: 'Email not found' }, { status: 401 })
}
