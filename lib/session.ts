import { cookies } from 'next/headers'
import { type SessionData } from '@/types/auth'

export async function getSession(): Promise<SessionData | null> {
  const sessionToken = cookies().get('session_token')?.value
  
  if (!sessionToken) {
    return null
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/session`, {
      headers: {
        Cookie: `session_token=${sessionToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching session:', error)
    return null
  }
}

export async function setSession(data: SessionData) {
  cookies().set('session_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
}

