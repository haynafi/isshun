'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Camera } from 'lucide-react';

interface Photo {
  id: number;
  photo_path: string;
  title: string;
  date: string;
}

// Function to convert Google Drive URL to direct image URL
const getGoogleDriveDirectUrl = (url: string) => {
  // Default placeholder in case of invalid URL
  const placeholderUrl = '/placeholder.svg?height=400&width=400';
  
  if (!url) return placeholderUrl;
  
  try {
    const fileId = url.match(/\/d\/(.+?)\//)?.[1];
    if (!fileId) {
      return placeholderUrl;
    }
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch {
    return placeholderUrl;
  }
};

export function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPhotos() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${window.location.origin}/api/photos`);
        if (!response.ok) {
          throw new Error('Failed to fetch photos');
        }

        const data = await response.json();
        setPhotos(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch photos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen pb-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-16 p-4">
        <Camera className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-gray-500">Error loading photos: {error}</p>
      </div>
    );
  }

  // For demonstration, using placeholder data if no photos
  const displayPhotos = photos.length > 0 ? photos : [
    { id: 1, title: 'Test', date: '2024-12-27', photo_path: 'https://drive.google.com/file/d/1JqJF90QpJ8VRQkl5K9V8oqkasr7urMqg/view' },
    { id: 2, title: 'TE...', date: '2024-12-30', photo_path: 'https://drive.google.com/file/d/1JqJF90QpJ8VRQkl5K9V8oqkasr7urMqg/view' },
    { id: 3, title: 'hello', date: '2024-12-31', photo_path: 'https://drive.google.com/file/d/1JqJF90QpJ8VRQkl5K9V8oqkasr7urMqg/view' },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6 text-center">Photo Gallery</h1>
        <div className="space-y-4">
          {displayPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={getGoogleDriveDirectUrl(photo.photo_path)}
                  alt={photo.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-medium text-gray-900">
                      {photo.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(photo.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}