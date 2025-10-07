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

export interface CreateOrganizationData {
  name: string;
  slug?: string;
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
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  id: string;
}

export class OrganizationsService {
  private static readonly SUPABASE_URL = 'http://192.168.1.129:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }

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

  // Get all organizations
  static async getAllOrganizations(): Promise<Organization[]> {
    console.log('Getting all organizations');
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/organizations?order=name.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting all organizations:', errorText);
      throw new Error(`Failed to get organizations: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get all organizations response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No organizations found (empty response)');
      return [];
    }
    
    const organizationsData = JSON.parse(responseText);
    console.log('✅ Retrieved all organizations:', organizationsData.length);
    
    // Transform snake_case to camelCase
    const organizations = organizationsData.map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      website: org.website,
      email: org.email,
      phone: org.phone,
      address: org.address,
      logoUrl: org.logo_url,
      industry: org.industry,
      size: org.size,
      foundedYear: org.founded_year,
      isPublic: org.is_public,
      allowContact: org.allow_contact,
      isSponsor: org.is_sponsor,
      tags: org.tags || [],
      metadata: org.metadata || {},
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    }));
    
    return organizations;
  }

  // Get organization by ID
  static async getOrganizationById(organizationId: string): Promise<Organization> {
    console.log('Getting organization by ID:', { organizationId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/organizations?id=eq.${organizationId}`,
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
    
    const organizationsData = JSON.parse(responseText);
    if (organizationsData.length === 0) {
      throw new Error('Organization not found');
    }
    
    const orgData = organizationsData[0];
    
    // Transform snake_case to camelCase
    const organization = {
      id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      website: orgData.website,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      logoUrl: orgData.logo_url,
      industry: orgData.industry,
      size: orgData.size,
      foundedYear: orgData.founded_year,
      isPublic: orgData.is_public,
      allowContact: orgData.allow_contact,
      isSponsor: orgData.is_sponsor,
      tags: orgData.tags || [],
      metadata: orgData.metadata || {},
      createdAt: orgData.created_at,
      updatedAt: orgData.updated_at,
    };
    
    console.log('✅ Retrieved organization:', organization);
    return organization;
  }

  // Create new organization
  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    console.log('Creating organization:', data);
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/organizations`, {
      method: 'POST',
      headers: this.getHeaders(true), // Include representation header
      body: JSON.stringify({
        name: data.name,
        slug: data.slug || this.generateSlug(data.name),
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo_url: data.logoUrl,
        industry: data.industry,
        size: data.size,
        founded_year: data.foundedYear,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        is_sponsor: data.isSponsor,
        tags: data.tags,
        metadata: {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating organization:', errorText);
      throw new Error(`Failed to create organization: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Create organization response text:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Failed to create organization - no response');
    }
    
    const organizationsData = JSON.parse(responseText);
    if (organizationsData.length === 0) {
      throw new Error('Failed to create organization - no data returned');
    }
    
    const orgData = organizationsData[0];
    
    // Transform snake_case to camelCase
    const organization = {
      id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      website: orgData.website,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      logoUrl: orgData.logo_url,
      industry: orgData.industry,
      size: orgData.size,
      foundedYear: orgData.founded_year,
      isPublic: orgData.is_public,
      allowContact: orgData.allow_contact,
      isSponsor: orgData.is_sponsor,
      tags: orgData.tags || [],
      metadata: orgData.metadata || {},
      createdAt: orgData.created_at,
      updatedAt: orgData.updated_at,
    };
    
    console.log('✅ Organization created:', organization);
    return organization;
  }

  // Update organization
  static async updateOrganization(data: UpdateOrganizationData): Promise<Organization> {
    console.log('Updating organization:', data);
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/organizations?id=eq.${data.id}`, {
      method: 'PATCH',
      headers: this.getHeaders(true), // Include representation header
      body: JSON.stringify({
        name: data.name,
        slug: data.slug || (data.name ? this.generateSlug(data.name) : undefined),
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo_url: data.logoUrl,
        industry: data.industry,
        size: data.size,
        founded_year: data.foundedYear,
        is_public: data.isPublic,
        allow_contact: data.allowContact,
        is_sponsor: data.isSponsor,
        tags: data.tags,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating organization:', errorText);
      throw new Error(`Failed to update organization: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Update organization response text:', responseText);
    
    if (!responseText.trim()) {
      // If no response, fetch the updated organization data
      console.log('✅ Organization updated successfully, fetching updated data...');
      return await this.getOrganizationById(data.id);
    }
    
    // If we have response data, parse it
    const organizationsData = JSON.parse(responseText);
    if (organizationsData.length === 0) {
      throw new Error('Failed to update organization - no data returned');
    }
    
    const orgData = organizationsData[0];
    
    // Transform snake_case to camelCase
    const organization = {
      id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      website: orgData.website,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      logoUrl: orgData.logo_url,
      industry: orgData.industry,
      size: orgData.size,
      foundedYear: orgData.founded_year,
      isPublic: orgData.is_public,
      allowContact: orgData.allow_contact,
      isSponsor: orgData.is_sponsor,
      tags: orgData.tags || [],
      metadata: orgData.metadata || {},
      createdAt: orgData.created_at,
      updatedAt: orgData.updated_at,
    };
    
    console.log('✅ Organization updated:', organization);
    return organization;
  }

  // Delete organization
  static async deleteOrganization(organizationId: string): Promise<void> {
    console.log('Deleting organization:', { organizationId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/organizations?id=eq.${organizationId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting organization:', errorText);
      throw new Error(`Failed to delete organization: ${errorText}`);
    }

    console.log('✅ Organization deleted');
  }

  // Get organization's assigned events
  static async getOrganizationEvents(organizationId: string): Promise<string[]> {
    console.log('Getting organization events:', { organizationId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_organizations?organization_id=eq.${organizationId}&select=event_id`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting organization events:', errorText);
      throw new Error(`Failed to get organization events: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get organization events response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No events found for organization (empty response)');
      return [];
    }
    
    const eventsData = JSON.parse(responseText);
    const eventIds = eventsData.map((item: any) => item.event_id);
    
    console.log('✅ Retrieved organization events:', eventIds);
    return eventIds;
  }

  // Assign organization to event
  static async assignOrganizationToEvent(organizationId: string, eventId: string): Promise<void> {
    console.log('Assigning organization to event:', { organizationId, eventId });
    
    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/event_organizations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        organization_id: organizationId,
        event_id: eventId,
        role: 'sponsor',
        display_order: 0,
        is_confirmed: true,
        is_public: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error assigning organization to event:', errorText);
      throw new Error(`Failed to assign organization to event: ${errorText}`);
    }

    console.log('✅ Organization assigned to event');
  }

  // Unassign organization from event
  static async unassignOrganizationFromEvent(organizationId: string, eventId: string): Promise<void> {
    console.log('Unassigning organization from event:', { organizationId, eventId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_organizations?organization_id=eq.${organizationId}&event_id=eq.${eventId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error unassigning organization from event:', errorText);
      throw new Error(`Failed to unassign organization from event: ${errorText}`);
    }

    console.log('✅ Organization unassigned from event');
  }
}
