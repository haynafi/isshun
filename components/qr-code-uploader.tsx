'use client'

import { useState } from 'react'

interface QRCodeUploaderProps {
  eventId: number
}

export function QRCodeUploader({ eventId }: QRCodeUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('eventId', eventId.toString())

    try {
      const response = await fetch('/api/upload-qr', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      setMessage('QR Code uploaded successfully')
    } catch {
      setMessage('Failed to upload QR Code')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-2"
      />
      <button
        type="submit"
        disabled={!file || uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {uploading ? 'Uploading...' : 'Upload QR Code'}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </form>
  )
}
