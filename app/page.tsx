import { cookies } from 'next/headers'
import TravelApp from '@/components/travel-app'
import { redirect } from 'next/navigation'

export default async function Home() {
  const cookieStore = cookies()
  const session = (await cookieStore).get('session')

  if (!session) {
    redirect('/login')
  }

  return <TravelApp />
}

