'use client'

import { useState, useEffect } from 'react'
import { Plane, Train, Bus, Home, Image, Ticket, User, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { MoreMenu } from './more-menu'
import { Gallery } from './gallery'; // Import the Gallery component
import { eventsApi } from '../services/api';
import { EventData } from '../types/event';



interface Event {
  id: number
  title: string
  place: string
  gradient: string
  icon: string
  date: string
  time: string
  status: 'pending' | 'accepted' | 'declined'
}

export default function TravelApp() {
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<'upcoming' | 'previous'>('upcoming')
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [activePage, setActivePage] = useState<'home' | 'gallery' | 'profile'>('home'); // Track the active page


  useEffect(() => {
    async function fetchEvents() {
      if (activePage !== 'home') return;
      
      setIsLoading(true);
      try {
        const data = await eventsApi.getEvents(selectedFilter);
        setEvents(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [selectedFilter, activePage]);


  const handlePeek = (id: number) => {
    router.push(`/ticket/${id}`)
  }

  const handleStatusUpdate = async (id: number, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`/api/events/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update event status')
      }

      setEvents(events.map(event =>
        event.id === id ? { ...event, status } : event
      ))
    } catch (error) {
      console.error('Error updating event status:', error)
    }
  }

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    const today = new Date()
    return eventDate.toDateString() === today.toDateString()
  })

  const renderEventCard = (event: EventData) => (
    <div
      key={event.id}
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-r p-6',
        event.gradient
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600">@{event.place}</p>
        </div>
        {renderEventIcon(event.icon)}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => handlePeek(event.id)}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Peek
        </button>
        {selectedFilter === 'upcoming' && event.status === 'pending' && (
          <div className="space-x-2">
            <button
              onClick={() => handleStatusUpdate(event.id, 'accepted')}
              className="rounded-full bg-green-500 p-2 text-white hover:bg-green-600"
              aria-label="Accept"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleStatusUpdate(event.id, 'declined')}
              className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
              aria-label="Decline"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {event.status === 'accepted' && (
          <span className="text-green-600 font-medium">Accepted</span>
        )}
        {event.status === 'declined' && (
          <span className="text-red-600 font-medium">Declined</span>
        )}
      </div>
    </div>
  )

  const renderEventIcon = (iconName: string) => {
    const IconComponent = {
      plane: Plane,
      train: Train,
      bus: Bus,
      home: Home,
      image: Image,
      ticket: Ticket,
      user: User
    }[iconName] || User

    return <IconComponent className="h-6 w-6 text-gray-600" />
  }

  const renderHomePage = () => (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-[72px]">
      <div className="flex-1 space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Hello Nafi!</h1>
          <p className="text-gray-500">Let&apos;s see your events!</p>
        </div>

        <div className="flex rounded-full bg-gray-100 p-1">
          {[
            { type: 'upcoming', label: 'Upcoming' },
            { type: 'previous', label: 'Previous' },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type as typeof selectedFilter)}
              className={cn(
                'flex-1 rounded-full px-8 py-2 text-sm font-medium transition-colors',
                selectedFilter === type
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center">Loading events...</div>
        ) : (
          <>
            {selectedFilter === 'upcoming' && (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Today&apos;s Events</h2>
                  <MoreMenu />
                </div>
                <div className="mt-4 space-y-4">
                  {todayEvents.map(renderEventCard)}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {selectedFilter === 'upcoming' ? 'Upcoming' : 'Previous'} Events
                </h2>
              </div>
              <div className="mt-4 space-y-4">
                {events
                  .filter(event => !todayEvents.includes(event))
                  .map(renderEventCard)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xl relative max-w-md mx-auto mt-8">
      {activePage === 'home' && renderHomePage()}
      {activePage === 'gallery' && <Gallery />}
      {activePage === 'profile' && <div className="text-center mt-8">Profile Page</div>}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-white shadow-xl">
        <div className="max-w-md w-full border-t py-3">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setActivePage('home')}
              className="flex flex-col items-center text-sm text-gray-600"
            >
              <Home className="h-6 w-6" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setActivePage('gallery')}
              className="flex flex-col items-center text-sm text-gray-600"
            >
              <Image className="h-6 w-6" />
              <span>Gallery</span>
            </button>
            <button
              onClick={() => setActivePage('profile')}
              className="flex flex-col items-center text-sm text-gray-600"
            >
              <User className="h-6 w-6" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

