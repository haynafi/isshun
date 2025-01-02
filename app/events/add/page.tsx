import { AddEventForm } from '@/components/add-event-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddEventPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-2xl font-semibold">Add New Event</h1>
          <AddEventForm />
        </div>
      </div>
    </div>
  )
}

