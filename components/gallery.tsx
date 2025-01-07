'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Camera, ChevronLeft, X } from 'lucide-react';
import { eventsApi } from '../services/api';

interface Photo {
  id: number;
  title: string;
  place: string;
  photo_path: string;
}

export function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    async function fetchPhotos() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await eventsApi.getPhotos();
        setPhotos(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch photos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  const openFullscreen = (photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = 'unset';
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + photos.length) % photos.length 
      : (selectedIndex + 1) % photos.length;
    setSelectedPhoto(photos[newIndex]);
    setSelectedIndex(newIndex);
  };

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

  return (
    <div className="min-h-screen pb-16">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6 text-center">Photo Gallery</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
              onClick={() => openFullscreen(photo, index)}
            >
              <div className="relative aspect-square">
                <Image
                  src={photo.photo_path}
                  alt={photo.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <button onClick={closeFullscreen} className="p-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center flex-grow">
              <h2 className="text-lg font-semibold">{selectedPhoto.title}</h2>
              <p className="text-sm text-gray-300">{selectedPhoto.place}</p>
            </div>
            <button onClick={closeFullscreen} className="p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-grow relative">
            <Image
              src={selectedPhoto.photo_path}
              alt={selectedPhoto.title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          <div className="p-4 bg-black bg-opacity-50">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`relative w-16 h-16 flex-shrink-0 cursor-pointer ${
                    index === selectedIndex ? 'ring-2 ring-white' : ''
                  }`}
                  onClick={() => openFullscreen(photo, index)}
                >
                  <Image
                    src={photo.photo_path}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

