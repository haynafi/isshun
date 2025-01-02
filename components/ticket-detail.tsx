'use client'

import { useEffect, useState, useRef } from 'react'
import { Camera, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Event } from '@/types/event'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function TicketDetail() {
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [photo, setPhoto] = useState<string | null>(null); // For the captured photo
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const params = useParams()
  const { id } = params

  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/events/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch event')
        }
        const data = await response.json()
        setEvent(data)
        if (data.photo_path) {
          setPhoto(data.photo_path)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch event')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id])

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      console.log('Requesting camera permissions...')
      setIsCapturing(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      
      if (!videoRef.current) {
        throw new Error('Video element not found')
      }

      console.log('Camera permission granted, setting up video stream...')
      videoRef.current.srcObject = stream
      streamRef.current = stream

      // Handle video element events
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded')
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              console.log('Video playing successfully')
              setTimeout(() => {
                setIsCameraReady(true)
              }, 100)
            })
            .catch((error) => {
              console.error('Error playing video:', error)
              setError('Failed to start video playback')
              stopCamera()
            })
        }
      }

      videoRef.current.onerror = (event) => {
        console.error('Video element error:', event)
        setError('Error initializing video element')
        stopCamera()
      }

    } catch (error) {
      console.error('Error starting camera:', error)
      setError(error instanceof Error ? error.message : 'Failed to start camera')
      setIsCapturing(false)
      stopCamera()
    }
  }

  const stopCamera = () => {
    console.log('Stopping camera...')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Camera track stopped:', track.label)
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
    setIsCameraReady(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !isCameraReady) {
      console.error('Video not ready for capture')
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const photoData = canvas.toDataURL('image/jpeg', 0.95)
      console.log('Photo captured successfully')
      
      return photoData
    } catch (error) {
      console.error('Error capturing photo:', error)
      setError('Failed to capture photo')
      return null
    }
  }

  const handleTakePhoto = async () => {
    try {
      if (!isCapturing) {
        await startCamera()
      } else if (isCameraReady) {
        const photoData = capturePhoto()
        if (!photoData) {
          throw new Error('Failed to capture photo')
        }

        setPhoto(photoData)
        console.log('Uploading photo...')

        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photo: photoData, eventId: id }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload photo')
        }

        console.log('Photo uploaded successfully')
        setEvent((prev) => (prev ? { ...prev, photo_path: data.photoPath } : null))
        stopCamera()
      }
    } catch (error) {
      console.error('Error handling photo:', error)
      setError(error instanceof Error ? error.message : 'Failed to handle photo')
    }
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!event) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xl relative max-w-md mx-auto mt-8">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-4 bg-gray-50 rounded-r-full" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-4 bg-gray-50 rounded-l-full" />

      <div className={`relative px-6 pb-6 pt-8 ${event.gradient}`}>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-500">Event</p>
            <p className="font-medium">{event.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{event.place}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-medium">{event.time}</p>
          </div>
        </div>
        <div className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
          {event.icon}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 h-px bg-gray-200" />
      </div>

      <div className="p-6">
        <div className="relative mb-6">
          <p className="text-center text-sm text-gray-400 mb-2">Event QR Code</p>
          {event.qr_code_path ? (
            <Image
              src={event.qr_code_path}
              alt="QR Code"
              width={300}
              height={300}
              className="w-full"
            />
          ) : (
            <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center text-gray-500">
              No QR Code Available
            </div>
          )}
          <p className="mt-2 text-center text-xs text-gray-400">Scan for event details</p>
        </div>

        {isCapturing && (
          <div className="relative mb-6">
            <p className="text-center text-sm text-gray-400 mb-2">
              {isCameraReady ? 'Camera Ready' : 'Starting camera...'}
            </p>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded"
            />
          </div>
        )}
        {!isCapturing && photo && (
          <div className="mb-6">
            <p className="text-center text-sm text-gray-400 mb-2">Captured Photo</p>
            <img src={photo} alt="Captured" className="w-full rounded" />
          </div>
        )}

        <button
          onClick={handleTakePhoto}
          disabled={isCapturing && !isCameraReady}
          className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium ${
            isCapturing && !isCameraReady 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gray-900 hover:bg-gray-800'
          } text-white`}
        >
          <Camera className="h-4 w-4" />
          {!isCapturing ? 'Start Camera' : isCameraReady ? 'Capture Photo' : 'Starting Camera...'}
        </button>
      </div>
    </div>
  )
}

