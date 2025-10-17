export interface Business {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  logoUrl?: string;
  coverImageUrl?: string;
  galleryUrls: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  foundedYear?: number;
  employeeCount?: number;
  revenue?: string;
  services: string[];
  products: string[];
  isPublic: boolean;
  allowContact: boolean;
  isSponsor: boolean;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessContact {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  role: string;
  isPrimary: boolean;
  isPublic: boolean;
  allowContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventBusiness {
  id: string;
  eventId: string;
  businessId: string;
  role: string;
  sponsorshipLevel?: string;
  boothNumber?: string;
  displayOrder: number;
  isFeatured: boolean;
  isConfirmed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  business?: Business;
  contacts?: BusinessContact[];
}

export class BusinessesService {
  private static readonly SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // Get all businesses for an event
  static async getEventBusinesses(eventId: string): Promise<EventBusiness[]> {
    console.log('Getting event businesses:', { eventId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/event_businesses?event_id=eq.${eventId}&is_public=eq.true&order=display_order.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting event businesses:', errorText);
      throw new Error(`Failed to get event businesses: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get event businesses response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No event businesses found (empty response)');
      return [];
    }
    
    const eventBusinesses = JSON.parse(responseText);
    console.log('✅ Retrieved event businesses:', eventBusinesses.length);

    // Fetch business details and contacts for each event business
    const businessesWithDetails = await Promise.all(
      eventBusinesses.map(async (eventBusiness: any) => {
        try {
          const business = await this.getBusinessById(eventBusiness.business_id);
          const contacts = await this.getBusinessContacts(eventBusiness.business_id);
          return { ...eventBusiness, business, contacts };
        } catch (error) {
          console.error('Error fetching business details:', error);
          return eventBusiness;
        }
      })
    );

    return businessesWithDetails;
  }

  // Get business by ID
  static async getBusinessById(businessId: string): Promise<Business> {
    console.log('Getting business by ID:', { businessId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/businesses?id=eq.${businessId}&is_public=eq.true`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting business:', errorText);
      throw new Error(`Failed to get business: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get business response text:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Business not found');
    }
    
    const businesses = JSON.parse(responseText);
    if (businesses.length === 0) {
      throw new Error('Business not found');
    }
    
    console.log('✅ Retrieved business:', businesses[0]);
    return businesses[0];
  }

  // Get business contacts
  static async getBusinessContacts(businessId: string): Promise<BusinessContact[]> {
    console.log('Getting business contacts:', { businessId });
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/business_contacts?business_id=eq.${businessId}&is_public=eq.true&order=is_primary.desc,first_name.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting business contacts:', errorText);
      throw new Error(`Failed to get business contacts: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get business contacts response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No business contacts found (empty response)');
      return [];
    }
    
    const contacts = JSON.parse(responseText);
    console.log('✅ Retrieved business contacts:', contacts.length);
    return contacts;
  }

  // Get all public businesses (for admin selection)
  static async getAllBusinesses(): Promise<Business[]> {
    console.log('Getting all businesses');
    
    const response = await fetch(
      `${this.SUPABASE_URL}/rest/v1/businesses?is_public=eq.true&order=name.asc`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting all businesses:', errorText);
      throw new Error(`Failed to get all businesses: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Get all businesses response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('✅ No businesses found (empty response)');
      return [];
    }
    
    const businesses = JSON.parse(responseText);
    console.log('✅ Retrieved all businesses:', businesses.length);
    return businesses;
  }
}
