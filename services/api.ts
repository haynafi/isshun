import { EventData } from "@/types/event";

const API_URL = 'http://localhost:3001/api';

export const eventsApi = {
  async getEvents(filter: string): Promise<EventData[]> {
    const response = await fetch(`${API_URL}/events?filter=${filter}`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },
  
  async getEventById(id: string): Promise<EventData> {
    const response = await fetch(`${API_URL}/events/${id}`);
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Event not found' : 'Failed to fetch event');
    }
    return response.json();
  }
};
