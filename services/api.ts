import { EventData } from "@/types/event";

const API_URL = 'https://isshun.site/bridge';
const API_KEY = process.env.BRIDGE_API_KEY || 'h8UEevzsMDRKHanaPriska21hsKhMaNk'; // Default to an empty string if not defined

export const eventsApi = {
  async getEvents(filter: string): Promise<EventData[]> {
    if (!API_KEY) {
      throw new Error('API Key is missing.');
    }

    const response = await fetch(`${API_URL}/events?filter=${filter}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY, // Ensure the API key is a string
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
        'x-api-key': API_KEY, // Ensure the API key is a string
      },
    });

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Event not found' : 'Failed to fetch event');
    }

    return response.json();
  },
};
