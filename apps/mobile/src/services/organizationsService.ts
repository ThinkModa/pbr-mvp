export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
  isPublic: boolean;
  allowContact: boolean;
  isSponsor: boolean;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EventOrganization {
  id: string;
  eventId: string;
  organizationId: string;
  role: string;
  sponsorshipLevel?: string;
  boothNumber?: string;
  displayOrder: number;
  isFeatured: boolean;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
}

export interface ActivityOrganization {
  id: string;
  activityId: string;
  organizationId: string;
  role: string;
  displayOrder: number;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
}

export class OrganizationsService {
  private static readonly SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // Transform snake_case to camelCase
  private static transformOrganizationData(data: any): Organization {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      website: data.website,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logoUrl: data.logo_url,
      industry: data.industry,
      size: data.size,
      foundedYear: data.founded_year,
      isPublic: data.is_public,
      allowContact: data.allow_contact,
      isSponsor: data.is_sponsor,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Get all organizations for an event
  static async getEventOrganizations(eventId: string): Promise<EventOrganization[]> {
    console.log('Getting event organizations:', { eventId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_organizations?event_id=eq.${eventId}&is_public=eq.true&order=display_order.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting event organizations:', errorText);
      throw new Error(`Failed to get event organizations: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get event organizations response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No event organizations found (empty response)');
      return [];
    }
    
    const eventOrganizations = JSON.parse(responseText);
    console.log('✅ Retrieved event organizations:', eventOrganizations.length);

    // Fetch organization details for each event organization
    const organizationsWithDetails = await Promise.all(
      eventOrganizations.map(async (eventOrganization: any) => {
        try {
          const organization = await this.getOrganizationById(eventOrganization.organization_id);
          return { ...eventOrganization, organization };
        } catch (error) {
          console.error('Error fetching organization details:', error);
          return eventOrganization;
        }
      })
    );

    return organizationsWithDetails;
  }

  // Get organization by ID
  static async getOrganizationById(organizationId: string): Promise<Organization> {
    console.log('Getting organization by ID:', { organizationId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/organizations?id=eq.${organizationId}&is_public=eq.true`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting organization:', errorText);
      throw new Error(`Failed to get organization: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get organization response text:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Organization not found');
    }
    
    const organizations = JSON.parse(responseText);
    if (organizations.length === 0) {
      throw new Error('Organization not found');
    }
    
    const transformedOrganization = this.transformOrganizationData(organizations[0]);
    console.log('✅ Retrieved organization:', transformedOrganization);
    return transformedOrganization;
  }

  // Get all public organizations (for admin selection)
  static async getAllOrganizations(): Promise<Organization[]> {
    console.log('Getting all organizations');
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/organizations?is_public=eq.true&order=name.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting all organizations:', errorText);
      throw new Error(`Failed to get all organizations: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get all organizations response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No organizations found (empty response)');
      return [];
    }
    
    const organizations = JSON.parse(responseText);
    const transformedOrganizations = organizations.map((org: any) => this.transformOrganizationData(org));
    console.log('✅ Retrieved all organizations:', transformedOrganizations.length);
    return transformedOrganizations;
  }

  // Get organizations for a specific activity
  static async getActivityOrganizations(activityId: string): Promise<ActivityOrganization[]> {
    console.log('Getting activity organizations:', { activityId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/activity_organizations?activity_id=eq.${activityId}&is_public=eq.true&order=display_order.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting activity organizations:', errorText);
      throw new Error(`Failed to get activity organizations: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get activity organizations response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No activity organizations found (empty response)');
      return [];
    }
    
    const activityOrganizations = JSON.parse(responseText);
    console.log('✅ Retrieved activity organizations:', activityOrganizations.length);

    // Fetch organization details for each activity organization
    const organizationsWithDetails = await Promise.all(
      activityOrganizations.map(async (activityOrg: any) => {
        try {
          const organization = await this.getOrganizationById(activityOrg.organization_id);
          return { ...activityOrg, organization };
        } catch (error) {
          console.error('Error fetching organization details:', error);
          return activityOrg;
        }
      })
    );

    return organizationsWithDetails;
  }
}
