import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TicketDetail } from '@/components/ticket-detail'

export default function TicketPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </div>
        <TicketDetail />
      </div>
    </div>
  )
}

