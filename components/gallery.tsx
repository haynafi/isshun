'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Camera, ChevronLeft, X, ChevronRight } from 'lucide-react';
import { eventsApi } from '../services/api';

interface Photo {
  id: number;
  title: string;
  place: string;
  photo_path: string;
}

interface EventPhotos {
  id: number;
  title: string;
  place: string;
  photos: Photo[];
}

export function Gallery() {
  const [events, setEvents] = useState<EventPhotos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventPhotos | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  useEffect(() => {
    async function fetchPhotos() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await eventsApi.getPhotos();
        const groupedEvents = groupPhotosByEvent(data);
        setEvents(groupedEvents);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch photos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  const groupPhotosByEvent = (photos: Photo[]): EventPhotos[] => {
    const eventMap = new Map<number, EventPhotos>();
    photos.forEach(photo => {
      if (!eventMap.has(photo.id)) {
        eventMap.set(photo.id, {
          id: photo.id,
          title: photo.title,
          place: photo.place,
          photos: []
        });
      }
      eventMap.get(photo.id)!.photos.push(photo);
    });
    return Array.from(eventMap.values());
  };

  const openFullscreen = (event: EventPhotos, photoIndex: number) => {
    setSelectedEvent(event);
    setSelectedPhotoIndex(photoIndex);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setSelectedEvent(null);
    document.body.style.overflow = 'unset';
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedEvent) return;
    const newIndex = direction === 'prev'
      ? (selectedPhotoIndex - 1 + selectedEvent.photos.length) % selectedEvent.photos.length
      : (selectedPhotoIndex + 1) % selectedEvent.photos.length;
    setSelectedPhotoIndex(newIndex);
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
        <h1 className="text-2xl font-semibold mb-6 text-center">Gallery</h1>
        <div className="space-y-8">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-sm p-4">
              <h3 className="text-m mb-2">{event.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {event.photos.map((photo, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className="relative aspect-square cursor-pointer"
                    onClick={() => openFullscreen(event, index)}
                  >
                    <Image
                      src={photo.photo_path}
                      alt={`${event.title} - Photo ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <button onClick={closeFullscreen} className="p-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center flex-grow">
              <h2 className="text-lg font-semibold">{selectedEvent.title}</h2>
              <p className="text-sm text-gray-300">{selectedEvent.place}</p>
            </div>
            <button onClick={closeFullscreen} className="p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-grow relative">
            <Image
              src={selectedEvent.photos[selectedPhotoIndex].photo_path}
              alt={`${selectedEvent.title} - Photo ${selectedPhotoIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            <button
              onClick={() => navigatePhoto('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => navigatePhoto('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="p-4 bg-black bg-opacity-50">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {selectedEvent.photos.map((photo, index) => (
                <div
                  key={`${selectedEvent.id}-${index}`}
                  className={`relative w-16 h-16 flex-shrink-0 cursor-pointer ${
                    index === selectedPhotoIndex ? 'ring-2 ring-white' : ''
                  }`}
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  <Image
                    src={photo.photo_path}
                    alt={`${selectedEvent.title} - Photo ${index + 1}`}
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

