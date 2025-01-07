import { EventData } from "@/types/event";

const API_URL = 'https://isshun.site/bridge';
const API_KEY = process.env.BRIDGE_API_KEY || 'h8UEevzsMDRKHanaPriska21hsKhMaNk'; // Default to an empty string if not defined

export const eventsApi = {
  async getPhotos(): Promise<EventData[]> {
    if (!API_KEY) {
      throw new Error('API Key is missing.');
    }
    const response = await fetch(`${API_URL}/photo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  async getEvents(filter: string): Promise<EventData[]> {
    if (!API_KEY) {
      throw new Error('API Key is missing.');
    }
    const response = await fetch(`${API_URL}/events?filter=${filter}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },
  
  async getEventById(id: string): Promise<EventData> {
    if (!API_KEY) {
      throw new Error('API Key is missing.');
    }
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Event not found' : 'Failed to fetch event');
    }
    return response.json();
  },

  async createEvent(formData: FormData): Promise<EventData> {
    if (!API_KEY) {
      throw new Error('API Key is missing.');
    }
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY, // Let the browser handle Content-Type for FormData
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create event');
    }
    return response.json();
  },
  // New method to update the event status
  async updateEventStatus(id: string, status: 'accepted' | 'declined'): Promise<{ message: string }> {
    if (!API_KEY) {
      throw new Error('API Key is missing.');
    }
    const response = await fetch(`${API_URL}/events/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ status }), // Pass the status in the request body
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update event status');
    }
    return response.json();
  },
  // New method to upload a photo
  async uploadPhoto(formData: FormData): Promise<{ photoPath: string }> {
    if (!API_KEY) {
      throw new Error('API Key is missing.');
    }
    const response = await fetch(`${API_URL}/update-photo`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY, // Let the browser handle Content-Type for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload photo');
    }
    return response.json();
  },
};