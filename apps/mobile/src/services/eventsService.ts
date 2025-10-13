// Real events service that uses centralized Supabase client
// This ensures consistent database configuration across all services
//
// CRITICAL RULE: Test environment must ALWAYS use live database data, never mock data.
// This ensures real-time sync between desktop admin and mobile app for true integration testing.

import { supabase } from '../lib/supabase';

export interface EventWithActivities {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: { name: string } | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  max_capacity: number | null;
  current_rsvps: number;
  is_free: boolean;
  price: number | null;
  show_capacity: boolean;
  show_price: boolean;
  show_attendee_count: boolean;
  has_tracks: boolean;
  cover_image_url: string | null;
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
  event_id: string;
}

export class EventsService {

  // Get all published events with their activities
  static async getEvents(): Promise<EventWithActivities[]> {
    console.log('Fetching events from live Supabase database...');
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        activities(*)
      `)
      .eq('is_public', true)
      .eq('status', 'published')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Failed to fetch events:', error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    console.log('✅ Successfully fetched', events?.length || 0, 'events from live database');
    
    // Debug: Log the first event's activities
    if (events && events.length > 0) {
      console.log('First event activities:', events[0].activities);
      if (events[0].activities && events[0].activities.length > 0) {
        console.log('First activity details:', events[0].activities[0]);
      }
    }
    
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

  // Get all activities for a specific event
  static async getEventActivities(eventId: string): Promise<Activity[]> {
    console.log('Fetching activities for event:', eventId);
    
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching event activities:', error);
      throw new Error(`Failed to fetch event activities: ${error.message}`);
    }

    console.log('✅ Successfully fetched', activities?.length || 0, 'activities for event', eventId);
    return activities || [];
  }
}
