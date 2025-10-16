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
}

export interface AttendeesFilter {
  eventId?: string;
  status?: 'attending' | 'pending' | 'not_attending';
  trackId?: string;
}

class AttendeesService {
  // Use the network IP address that Expo Go can reach
  private static readonly SUPABASE_URL = 'http://192.168.1.95:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  private getHeaders() {
    return {
      'apikey': AttendeesService.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${AttendeesService.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all attendees for a specific event
   */
  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    try {
      console.log('Getting event attendees:', { eventId });
      
      const response = await fetch(
        `${AttendeesService.SUPABASE_URL}/rest/v1/event_rsvps?select=id,status,track_id,created_at,users!event_rsvps_user_id_fkey(id,first_name,last_name,email,phone_number,avatar_url,title_position,organization_affiliation),event_tracks(name)&event_id=eq.${eventId}&status=in.(attending,pending)`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching event attendees:', errorText);
        throw new Error(`Failed to fetch attendees: ${errorText}`);
      }

      const data = await response.json();
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
      }));

      console.log('✅ Retrieved event attendees:', attendees.length);
      return attendees;
    } catch (error) {
      console.error('Error in getEventAttendees:', error);
      throw error;
    }
  }

  /**
   * Get attendee count for an event
   */
  async getEventAttendeeCount(eventId: string): Promise<number> {
    try {
      console.log('Getting attendee count for event:', eventId);
      
      const response = await fetch(
        `${AttendeesService.SUPABASE_URL}/rest/v1/event_rsvps?select=*&event_id=eq.${eventId}&status=eq.attending`,
        {
          headers: {
            ...this.getHeaders(),
            'Prefer': 'count=exact'
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching attendee count:', errorText);
        throw new Error(`Failed to fetch attendee count: ${errorText}`);
      }

      const count = response.headers.get('content-range')?.split('/')[1];
      const attendeeCount = count ? parseInt(count) : 0;
      
      console.log('✅ Retrieved attendee count:', attendeeCount);
      return attendeeCount;
    } catch (error) {
      console.error('Error in getEventAttendeeCount:', error);
      throw error;
    }
  }
}

export default new AttendeesService();
