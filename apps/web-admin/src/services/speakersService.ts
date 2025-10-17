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

export interface CreateSpeakerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  company?: string;
  bio?: string;
  expertise: string[];
  profileImageUrl?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };
  isPublic: boolean;
  allowContact: boolean;
  tags: string[];
}

export interface UpdateSpeakerData extends Partial<CreateSpeakerData> {
  id: string;
}

export class SpeakersService {
  private static readonly SUPABASE_URL = 'http://127.0.0.1:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  private static getHeaders(includeRepresentation = false) {
    const headers = {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    
    if (includeRepresentation) {
      headers['Prefer'] = 'return=representation';
    }
    
    return headers;
  }

  // Get all speakers
  static async getAllSpeakers(): Promise<Speaker[]> {
    console.log('Getting all speakers');
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/speakers?order=first_name.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting all speakers:', errorText);
      throw new Error(`Failed to get speakers: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get all speakers response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No speakers found (empty response)');
      return [];
    }
    
    const speakersData = JSON.parse(responseText);
    console.log('✅ Retrieved all speakers:', speakersData.length);
    
    // Transform snake_case to camelCase
    const speakers = speakersData.map((speaker: any) => ({
      id: speaker.id,
      organizationId: speaker.organization_id,
      firstName: speaker.first_name,
      lastName: speaker.last_name,
      email: speaker.email,
      phone: speaker.phone,
      title: speaker.title,
      company: speaker.company,
      bio: speaker.bio,
      expertise: speaker.expertise || [],
      profileImageUrl: speaker.profile_image_url,
      headshotUrl: speaker.headshot_url,
      socialLinks: speaker.social_links || {},
      isPublic: speaker.is_public,
      allowContact: speaker.allow_contact,
      tags: speaker.tags || [],
      metadata: speaker.metadata || {},
      createdAt: speaker.created_at,
      updatedAt: speaker.updated_at,
    }));
    
    return speakers;
  }

  // Get speaker by ID
  static async getSpeakerById(speakerId: string): Promise<Speaker> {
    console.log('Getting speaker by ID:', { speakerId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/speakers?id=eq.${speakerId}`,
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
    
    const speakersData = JSON.parse(responseText);
    if (speakersData.length === 0) {
      throw new Error('Speaker not found');
    }
    
    const speakerData = speakersData[0];
    
    // Transform snake_case to camelCase
    const speaker = {
      id: speakerData.id,
      organizationId: speakerData.organization_id,
      firstName: speakerData.first_name,
      lastName: speakerData.last_name,
      email: speakerData.email,
      phone: speakerData.phone,
      title: speakerData.title,
      company: speakerData.company,
      bio: speakerData.bio,
      expertise: speakerData.expertise || [],
      profileImageUrl: speakerData.profile_image_url,
      headshotUrl: speakerData.headshot_url,
      socialLinks: speakerData.social_links || {},
      isPublic: speakerData.is_public,
      allowContact: speakerData.allow_contact,
      tags: speakerData.tags || [],
      metadata: speakerData.metadata || {},
      createdAt: speakerData.created_at,
      updatedAt: speakerData.updated_at,
    };
    
    console.log('✅ Retrieved speaker:', speaker);
    return speaker;
  }

  // Create new speaker
  static async createSpeaker(data: CreateSpeakerData): Promise<Speaker> {
    console.log('Creating speaker:', data);
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/speakers`, {
      method: 'POST',
      headers: this.getHeaders(true), // Include representation header
      body: JSON.stringify({
        organization_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Default org for now
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        company: data.company,
        bio: data.bio,
        expertise: data.expertise,
        profile_image_url: data.profileImageUrl,
        social_links: data.socialLinks,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        tags: data.tags,
        metadata: {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating speaker:', errorText);
      throw new Error(`Failed to create speaker: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Create speaker response text:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Failed to create speaker - no response');
    }
    
    const speakersData = JSON.parse(responseText);
    if (speakersData.length === 0) {
      throw new Error('Failed to create speaker - no data returned');
    }
    
    const speakerData = speakersData[0];
    
    // Transform snake_case to camelCase
    const speaker = {
      id: speakerData.id,
      organizationId: speakerData.organization_id,
      firstName: speakerData.first_name,
      lastName: speakerData.last_name,
      email: speakerData.email,
      phone: speakerData.phone,
      title: speakerData.title,
      company: speakerData.company,
      bio: speakerData.bio,
      expertise: speakerData.expertise || [],
      profileImageUrl: speakerData.profile_image_url,
      headshotUrl: speakerData.headshot_url,
      socialLinks: speakerData.social_links || {},
      isPublic: speakerData.is_public,
      allowContact: speakerData.allow_contact,
      tags: speakerData.tags || [],
      metadata: speakerData.metadata || {},
      createdAt: speakerData.created_at,
      updatedAt: speakerData.updated_at,
    };
    
    console.log('✅ Speaker created:', speaker);
    return speaker;
  }

  // Update speaker
  static async updateSpeaker(data: UpdateSpeakerData): Promise<Speaker> {
    console.log('Updating speaker:', data);
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/speakers?id=eq.${data.id}`, {
      method: 'PATCH',
      headers: this.getHeaders(true), // Include representation header
      body: JSON.stringify({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        company: data.company,
        bio: data.bio,
        expertise: data.expertise,
        profile_image_url: data.profileImageUrl,
        social_links: data.socialLinks,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        tags: data.tags,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating speaker:', errorText);
      throw new Error(`Failed to update speaker: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Update speaker response text:', responseText);
    
    if (!responseText.trim()) {
      // If no response, fetch the updated speaker data
      console.log('✅ Speaker updated successfully, fetching updated data...');
      return await this.getSpeakerById(data.id);
    }
    
    // If we have response data, parse it
    const speakersData = JSON.parse(responseText);
    if (speakersData.length === 0) {
      throw new Error('Failed to update speaker - no data returned');
    }
    
    const speakerData = speakersData[0];
    
    // Transform snake_case to camelCase
    const speaker = {
      id: speakerData.id,
      organizationId: speakerData.organization_id,
      firstName: speakerData.first_name,
      lastName: speakerData.last_name,
      email: speakerData.email,
      phone: speakerData.phone,
      title: speakerData.title,
      company: speakerData.company,
      bio: speakerData.bio,
      expertise: speakerData.expertise || [],
      profileImageUrl: speakerData.profile_image_url,
      headshotUrl: speakerData.headshot_url,
      socialLinks: speakerData.social_links || {},
      isPublic: speakerData.is_public,
      allowContact: speakerData.allow_contact,
      tags: speakerData.tags || [],
      metadata: speakerData.metadata || {},
      createdAt: speakerData.created_at,
      updatedAt: speakerData.updated_at,
    };
    
    console.log('✅ Speaker updated:', speaker);
    return speaker;
  }

  // Delete speaker
  static async deleteSpeaker(speakerId: string): Promise<void> {
    console.log('Deleting speaker:', { speakerId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/speakers?id=eq.${speakerId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting speaker:', errorText);
      throw new Error(`Failed to delete speaker: ${errorText}`);
    }

    console.log('✅ Speaker deleted');
  }

  // Get speaker's assigned events
  static async getSpeakerEvents(speakerId: string): Promise<string[]> {
    console.log('Getting speaker events:', { speakerId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_speakers?speaker_id=eq.${speakerId}&select=event_id`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting speaker events:', errorText);
      throw new Error(`Failed to get speaker events: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get speaker events response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No events found for speaker (empty response)');
      return [];
    }
    
    const eventData = JSON.parse(responseText);
    const eventIds = eventData.map((item: any) => item.event_id);
    
    console.log('✅ Retrieved speaker events:', eventIds);
    return eventIds;
  }

  // Get speaker's assigned activities
  static async getSpeakerActivities(speakerId: string): Promise<string[]> {
    console.log('Getting speaker activities:', { speakerId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_speakers?speaker_id=eq.${speakerId}&select=activity_id`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting speaker activities:', errorText);
      throw new Error(`Failed to get speaker activities: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get speaker activities response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No activities found for speaker (empty response)');
      return [];
    }
    
    const activityData = JSON.parse(responseText);
    const activityIds = activityData.map((item: any) => item.activity_id);
    
    console.log('✅ Retrieved speaker activities:', activityIds);
    return activityIds;
  }

  // Assign speaker to activity
  static async assignSpeakerToActivity(speakerId: string, activityId: string): Promise<void> {
    console.log('Assigning speaker to activity:', { speakerId, activityId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_speakers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        speaker_id: speakerId,
        activity_id: activityId,
        role: 'speaker',
        display_order: 0,
        is_confirmed: true,
        is_public: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error assigning speaker to activity:', errorText);
      throw new Error(`Failed to assign speaker to activity: ${errorText}`);
    }

    console.log('✅ Speaker assigned to activity');
  }

  // Unassign speaker from activity
  static async unassignSpeakerFromActivity(speakerId: string, activityId: string): Promise<void> {
    console.log('Unassigning speaker from activity:', { speakerId, activityId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_speakers?speaker_id=eq.${speakerId}&activity_id=eq.${activityId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning speaker from activity:', errorText);
      throw new Error(`Failed to unassign speaker from activity: ${errorText}`);
    }

    console.log('✅ Speaker unassigned from activity');
  }

  // Bulk assign speaker to multiple activities
  static async assignSpeakerToActivities(speakerId: string, activityIds: string[]): Promise<void> {
    console.log('Bulk assigning speaker to activities:', { speakerId, activityIds });
    
    // First, remove existing assignments for this speaker
    await this.unassignSpeakerFromAllActivities(speakerId);
    
    // Then assign to new activities
    const assignments = activityIds.map(activityId => ({
      speaker_id: speakerId,
      activity_id: activityId,
      role: 'speaker',
      display_order: 0,
      is_confirmed: true,
      is_public: true,
    }));

    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/activity_speakers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(assignments),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error bulk assigning speaker to activities:', errorText);
      throw new Error(`Failed to bulk assign speaker to activities: ${errorText}`);
    }

    console.log('✅ Speaker bulk assigned to activities');
  }

  // Unassign speaker from all activities
  static async unassignSpeakerFromAllActivities(speakerId: string): Promise<void> {
    console.log('Unassigning speaker from all activities:', { speakerId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_speakers?speaker_id=eq.${speakerId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning speaker from all activities:', errorText);
      throw new Error(`Failed to unassign speaker from all activities: ${errorText}`);
    }

    console.log('✅ Speaker unassigned from all activities');
  }
}
