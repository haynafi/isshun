import { EventData } from "@/types/event";

const API_URL = 'https://isshun.site/bridge/';
const API_KEY = process.env.BRIDGE_API_KEY; // Replace with your actual API key

export const eventsApi = {
  async getEvents(filter: string): Promise<EventData[]> {
    const response = await fetch(`${API_URL}/events?filter=${filter}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY, // Include the API key in headers
      },
    });
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },
  
  async getEventById(id: string): Promise<EventData> {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY, // Include the API key in headers
      },
    });
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Event not found' : 'Failed to fetch event');
    }
    return response.json();
  },
};
