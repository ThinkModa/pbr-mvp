import { supabase } from '../lib/supabase';

export interface EventAttendee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  title_position: string | null;
  organization_affiliation: string | null;
  rsvp_status: 'attending' | 'pending' | 'not_attending';
  track_id: string | null;
  track_name: string | null;
  rsvp_created_at: string;
  event_id: string;
  event_title: string;
}

export interface AttendeesFilter {
  eventId?: string;
  status?: 'attending' | 'pending' | 'not_attending';
  trackId?: string;
  searchTerm?: string;
}

class AttendeesService {
  /**
   * Get all users who have attended any events (for admin dashboard)
   */
  async getAllEventUsers(): Promise<EventAttendee[]> {
    try {
      console.log('Getting all event users for admin dashboard');
      
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          id,
          status,
          track_id,
          created_at,
          event_id,
          users!inner(
            id,
            first_name,
            last_name,
            email,
            phone_number,
            avatar_url,
            title_position,
            organization_affiliation
          ),
          event_tracks(
            name
          ),
          events(
            id,
            title
          )
        `)
        .in('status', ['attending', 'pending']);

      if (error) {
        console.error('Error fetching all event users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      const attendees: EventAttendee[] = data.map((rsvp: any) => ({
        id: rsvp.users.id,
        first_name: rsvp.users.first_name,
        last_name: rsvp.users.last_name,
        email: rsvp.users.email,
        phone_number: rsvp.users.phone_number,
        avatar_url: rsvp.users.avatar_url,
        title_position: rsvp.users.title_position,
        organization_affiliation: rsvp.users.organization_affiliation,
        rsvp_status: rsvp.status,
        track_id: rsvp.track_id,
        track_name: rsvp.event_tracks?.name || null,
        rsvp_created_at: rsvp.created_at,
        event_id: rsvp.event_id,
        event_title: rsvp.events?.title || 'Unknown Event',
      }));

      console.log('✅ Retrieved all event users:', attendees.length);
      return attendees;
    } catch (error) {
      console.error('Error in getAllEventUsers:', error);
      throw error;
    }
  }

  /**
   * Get attendees with filtering options
   */
  async getFilteredAttendees(filters: AttendeesFilter): Promise<EventAttendee[]> {
    try {
      console.log('Getting filtered attendees:', filters);
      
      let query = supabase
        .from('event_rsvps')
        .select(`
          id,
          status,
          track_id,
          created_at,
          event_id,
          users!inner(
            id,
            first_name,
            last_name,
            email,
            phone_number,
            avatar_url,
            title_position,
            organization_affiliation
          ),
          event_tracks(
            name
          ),
          events(
            id,
            title
          )
        `)
        .in('status', ['attending', 'pending']);

      if (filters.eventId) {
        query = query.eq('event_id', filters.eventId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.trackId) {
        query = query.eq('track_id', filters.trackId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered attendees:', error);
        throw new Error(`Failed to fetch attendees: ${error.message}`);
      }

      let attendees: EventAttendee[] = data.map((rsvp: any) => ({
        id: rsvp.users.id,
        first_name: rsvp.users.first_name,
        last_name: rsvp.users.last_name,
        email: rsvp.users.email,
        phone_number: rsvp.users.phone_number,
        avatar_url: rsvp.users.avatar_url,
        title_position: rsvp.users.title_position,
        organization_affiliation: rsvp.users.organization_affiliation,
        rsvp_status: rsvp.status,
        track_id: rsvp.track_id,
        track_name: rsvp.event_tracks?.name || null,
        rsvp_created_at: rsvp.created_at,
        event_id: rsvp.event_id,
        event_title: rsvp.events?.title || 'Unknown Event',
      }));

      // Apply search filter if provided
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        attendees = attendees.filter(attendee => 
          attendee.first_name.toLowerCase().includes(searchLower) ||
          attendee.last_name.toLowerCase().includes(searchLower) ||
          attendee.email.toLowerCase().includes(searchLower) ||
          (attendee.title_position && attendee.title_position.toLowerCase().includes(searchLower)) ||
          (attendee.organization_affiliation && attendee.organization_affiliation.toLowerCase().includes(searchLower))
        );
      }

      console.log('✅ Retrieved filtered attendees:', attendees.length);
      return attendees;
    } catch (error) {
      console.error('Error in getFilteredAttendees:', error);
      throw error;
    }
  }

  /**
   * Get all events for filtering dropdown
   */
  async getEventsForFilter(): Promise<{id: string, title: string}[]> {
    try {
      console.log('Getting events for filter dropdown');
      
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching events for filter:', error);
        throw new Error(`Failed to fetch events: ${error.message}`);
      }

      console.log('✅ Retrieved events for filter:', data.length);
      return data;
    } catch (error) {
      console.error('Error in getEventsForFilter:', error);
      throw error;
    }
  }

  /**
   * Get unique users (deduplicated by user ID)
   */
  async getUniqueUsers(): Promise<EventAttendee[]> {
    try {
      const allAttendees = await this.getAllEventUsers();
      
      // Group by user ID and keep the most recent RSVP
      const userMap = new Map<string, EventAttendee>();
      
      allAttendees.forEach(attendee => {
        const existing = userMap.get(attendee.id);
        if (!existing || new Date(attendee.rsvp_created_at) > new Date(existing.rsvp_created_at)) {
          userMap.set(attendee.id, attendee);
        }
      });

      const uniqueUsers = Array.from(userMap.values());
      console.log('✅ Retrieved unique users:', uniqueUsers.length);
      return uniqueUsers;
    } catch (error) {
      console.error('Error in getUniqueUsers:', error);
      throw error;
    }
  }
}

export default new AttendeesService();
