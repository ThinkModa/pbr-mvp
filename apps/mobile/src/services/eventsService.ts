// Real events service that fetches from Supabase via REST API
// This avoids Supabase client compatibility issues with Expo Go
//
// CRITICAL RULE: Test environment must ALWAYS use live database data, never mock data.
// This ensures real-time sync between desktop admin and mobile app for true integration testing.

export interface EventWithActivities {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: { name: string } | null;
  max_capacity: number | null;
  current_rsvps: number;
  is_free: boolean;
  price: number | null;
  show_capacity: boolean;
  show_price: boolean;
  show_attendee_count: boolean;
  activities: Activity[];
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: { name: string } | null;
  max_capacity: number | null;
  current_rsvps: number;
  is_required: boolean;
}

export class EventsService {
  // Use the network IP address that Expo Go can reach
  private static readonly SUPABASE_URL = 'http://192.168.1.129:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  // Get all published events with their activities
  static async getEvents(): Promise<EventWithActivities[]> {
    console.log('Fetching events from live Supabase database...');
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/events?select=*,activities(*)&is_public=eq.true&status=eq.published&order=start_time.asc`,
      {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch events from live database. HTTP ${response.status}: ${errorText}`);
    }

    const events = await response.json();
    console.log('✅ Successfully fetched', events.length, 'events from live database');
    return events || [];
  }

  // NOTE: No mock data - test environment must always use live database

  // Get a single event by ID
  static async getEventById(eventId: string): Promise<EventWithActivities | null> {
    const events = await this.getEvents();
    return events.find(event => event.id === eventId) || null;
  }

  // Get upcoming events (events that haven't started yet)
  static async getUpcomingEvents(): Promise<EventWithActivities[]> {
    const events = await this.getEvents();
    const now = new Date().toISOString();
    return events.filter(event => event.start_time > now);
  }

  // Get events by date range
  static async getEventsByDateRange(startDate: string, endDate: string): Promise<EventWithActivities[]> {
    const events = await this.getEvents();
    return events.filter(event => 
      event.start_time >= startDate && event.end_time <= endDate
    );
  }
}
