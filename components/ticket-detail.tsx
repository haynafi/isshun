'use client'

import { useEffect, useState, useRef } from 'react'
import { Camera, AlertCircle, RefreshCw, Loader } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { eventsApi } from '../services/api'
import { EventData } from '@/types/event'
import { useToast } from "@/hooks/use-toast"
import {
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast"

export function TicketDetail() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { id } = useParams();
  const { toast } = useToast()

  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true);
      setError(null);
  
      try {
        if (!id || Array.isArray(id)) throw new Error('Invalid Event ID');
        const eventData = await eventsApi.getEventById(id);
        setEvent(eventData);
  
        if (eventData.photo_path) {
          setPhoto(eventData.photo_path);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch event');
      } finally {
        setIsLoading(false);
      }
    }
  
    fetchEvent();
  }, [id]);

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
          facingMode: isFrontCamera ? 'user' : 'environment'
        }
      })
      
      if (!videoRef.current) {
        throw new Error('Video element not found')
      }

      console.log('Camera permission granted, setting up video stream...')
      videoRef.current.srcObject = stream
      streamRef.current = stream

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

      if (isFrontCamera) {
        context.translate(canvas.width, 0)
        context.scale(-1, 1)
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
        await startCamera();
      } else if (isCameraReady) {
        const photoData = capturePhoto();
        if (!photoData) {
          throw new Error('Failed to capture photo');
        }

        setPhoto(photoData);
        toast({
          title: "Success",
          description: "Photo captured successfully!",
        })
        console.log('Uploading photo...');
        setIsUploading(true);

        const response = await fetch(photoData);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('photo', blob, `photo_${id}.jpg`);

        if (typeof id === 'string') {
          formData.append('eventId', id);
        } else {
          throw new Error('Event ID is undefined or not a string');
        }

        const uploadResponse = await eventsApi.uploadPhoto(formData);
        console.log('Photo uploaded successfully:', uploadResponse.photoPath);
        setPhoto(uploadResponse.photoPath);
        toast({
          title: "Success",
          description: "Photo uploaded successfully!",
        })
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setError(error instanceof Error ? error.message : 'Failed to take or upload photo');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to capture or upload photo. Please try again.",
      })
    } finally {
      setIsUploading(false);
    }
  }

  const switchCamera = async () => {
    setIsFrontCamera(!isFrontCamera);
    if (isCapturing) {
      stopCamera();
      await startCamera();
    }
  }

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
    <ToastProvider>
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
                className={`w-full rounded ${isFrontCamera ? 'transform scale-x-[-1]' : ''}`}
              />
              <button
                onClick={switchCamera}
                className="absolute top-2 right-2 bg-white/70 rounded-full p-2"
                aria-label="Switch camera"
              >
                <RefreshCw className="h-5 w-5 text-gray-800" />
              </button>
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
            disabled={isCapturing && !isCameraReady || isUploading}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium ${
              isCapturing && !isCameraReady || isUploading
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-900 hover:bg-gray-800'
            } text-white`}
          >
            {isUploading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                {!isCapturing ? 'Start Camera' : isCameraReady ? 'Capture Photo' : 'Starting Camera...'}
              </>
            )}
          </button>
        </div>
      </div>
      <ToastViewport />
    </ToastProvider>
  )
}

