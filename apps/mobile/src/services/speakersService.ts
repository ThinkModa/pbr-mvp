export interface Speaker {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  company?: string;
  bio?: string;
  expertise: string[];
  profileImageUrl?: string;
  headshotUrl?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };
  isPublic: boolean;
  allowContact: boolean;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EventSpeaker {
  id: string;
  eventId: string;
  speakerId: string;
  role: string;
  sessionTitle?: string;
  sessionDescription?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  displayOrder: number;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  speaker?: Speaker;
}

export interface ActivitySpeaker {
  id: string;
  activityId: string;
  speakerId: string;
  role: string;
  displayOrder: number;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  speaker?: Speaker;
}

export class SpeakersService {
  private static readonly SUPABASE_URL = 'http://192.168.1.129:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // Transform snake_case data from database to camelCase for frontend
  private static transformSpeakerData(data: any): Speaker {
    return {
      id: data.id,
      organizationId: data.organization_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      title: data.title,
      company: data.company,
      bio: data.bio,
      expertise: data.expertise || [],
      profileImageUrl: data.profile_image_url,
      headshotUrl: data.headshot_url,
      socialLinks: data.social_links || {},
      isPublic: data.is_public,
      allowContact: data.allow_contact,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Get all speakers for an event
  static async getEventSpeakers(eventId: string): Promise<EventSpeaker[]> {
    console.log('Getting event speakers:', { eventId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_speakers?event_id=eq.${eventId}&is_public=eq.true&order=display_order.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting event speakers:', errorText);
      throw new Error(`Failed to get event speakers: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get event speakers response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No event speakers found (empty response)');
      return [];
    }
    
    const eventSpeakers = JSON.parse(responseText);
    console.log('✅ Retrieved event speakers:', eventSpeakers.length);

    // Fetch speaker details for each event speaker
    const speakersWithDetails = await Promise.all(
      eventSpeakers.map(async (eventSpeaker: any) => {
        try {
          const speaker = await this.getSpeakerById(eventSpeaker.speaker_id);
          return { ...eventSpeaker, speaker };
        } catch (error) {
          console.error('Error fetching speaker details:', error);
          return eventSpeaker;
        }
      })
    );

    return speakersWithDetails;
  }

  // Get speakers for a specific activity
  static async getActivitySpeakers(activityId: string): Promise<ActivitySpeaker[]> {
    console.log('Getting activity speakers:', { activityId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_speakers?activity_id=eq.${activityId}&is_public=eq.true&order=display_order.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting activity speakers:', errorText);
      throw new Error(`Failed to get activity speakers: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get activity speakers response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No activity speakers found (empty response)');
      return [];
    }
    
    const activitySpeakers = JSON.parse(responseText);
    console.log('✅ Retrieved activity speakers:', activitySpeakers.length);

    // Fetch speaker details for each activity speaker
    const speakersWithDetails = await Promise.all(
      activitySpeakers.map(async (activitySpeaker: any) => {
        try {
          const speaker = await this.getSpeakerById(activitySpeaker.speaker_id);
          return { ...activitySpeaker, speaker };
        } catch (error) {
          console.error('Error fetching speaker details:', error);
          return activitySpeaker;
        }
      })
    );

    return speakersWithDetails;
  }

  // Get speaker by ID
  static async getSpeakerById(speakerId: string): Promise<Speaker> {
    console.log('Getting speaker by ID:', { speakerId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/speakers?id=eq.${speakerId}&is_public=eq.true`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting speaker:', errorText);
      throw new Error(`Failed to get speaker: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get speaker response text:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Speaker not found');
    }
    
    const speakers = JSON.parse(responseText);
    if (speakers.length === 0) {
      throw new Error('Speaker not found');
    }
    
    // Transform snake_case to camelCase
    const speaker = this.transformSpeakerData(speakers[0]);
    console.log('✅ Retrieved speaker:', speaker);
    return speaker;
  }

  // Get all public speakers (for admin selection)
  static async getAllSpeakers(): Promise<Speaker[]> {
    console.log('Getting all speakers');
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/speakers?is_public=eq.true&order=first_name.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting all speakers:', errorText);
      throw new Error(`Failed to get all speakers: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get all speakers response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No speakers found (empty response)');
      return [];
    }
    
    const speakers = JSON.parse(responseText);
    console.log('✅ Retrieved all speakers:', speakers.length);
    
    // Transform snake_case to camelCase
    return speakers.map(speaker => this.transformSpeakerData(speaker));
  }
}
