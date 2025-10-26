// Real profile service that fetches from Supabase via REST API
// This avoids Supabase client compatibility issues with Expo Go
//
// CRITICAL RULE: Test environment must ALWAYS use live database data, never mock data.
// This ensures real-time sync between desktop admin and mobile app for true integration testing.

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  tShirtSize?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  bio?: string;
  organizationAffiliation?: string;
  titlePosition?: string;
  points: number;
  avatar_url?: string;
  professionalCategories: ProfessionalCategory[];
  communityInterests: CommunityInterest[];
  eventHistory: EventAttendance[];
}

export interface ProfessionalCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface CommunityInterest {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  eventTitle: string;
  attendedAt: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  tShirtSize?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  bio?: string;
  organizationAffiliation?: string;
  titlePosition?: string;
  avatar_url?: string;
}

export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

import { supabase } from '../lib/supabase';

export class ProfileService {
  private static readonly SUPABASE_URL = 'https://zqjziejllixifpwzbdnf.supabase.co';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

  /**
   * Get user profile with all related data
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      console.log('Getting user profile:', { userId });

      // Get user basic info
      const userResponse = await fetch(
        `${this.SUPABASE_URL}/rest/v1/users?select=*&id=eq.${userId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user: ${userResponse.status}`);
      }

      const users = await userResponse.json();
      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Get professional categories
      const professionalCategories = await this.getUserProfessionalCategories(userId);

      // Get community interests
      const communityInterests = await this.getUserCommunityInterests(userId);

      // Get event history
      const eventHistory = await this.getUserEventHistory(userId);

      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number,
        tShirtSize: user.t_shirt_size,
        dietaryRestrictions: user.dietary_restrictions,
        accessibilityNeeds: user.accessibility_needs,
        bio: user.bio,
        organizationAffiliation: user.organization_affiliation,
        titlePosition: user.title_position,
        points: user.points || 0,
        avatar_url: user.avatar_url,
        professionalCategories,
        communityInterests,
        eventHistory,
      };

      console.log('✅ Retrieved user profile:', { userId, profile });
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: ProfileUpdateData): Promise<void> {
    try {
      console.log('Updating user profile:', { userId, data });

      // Map camelCase field names to snake_case for database
      const dbData: any = {};
      if (data.firstName !== undefined) dbData.first_name = data.firstName;
      if (data.lastName !== undefined) dbData.last_name = data.lastName;
      if (data.email !== undefined) dbData.email = data.email;
      if (data.phoneNumber !== undefined) dbData.phone_number = data.phoneNumber;
      if (data.tShirtSize !== undefined) dbData.t_shirt_size = data.tShirtSize;
      if (data.dietaryRestrictions !== undefined) dbData.dietary_restrictions = data.dietaryRestrictions;
      if (data.accessibilityNeeds !== undefined) dbData.accessibility_needs = data.accessibilityNeeds;
      if (data.bio !== undefined) dbData.bio = data.bio;
      if (data.organizationAffiliation !== undefined) dbData.organization_affiliation = data.organizationAffiliation;
      if (data.titlePosition !== undefined) dbData.title_position = data.titlePosition;
      if (data.avatar_url !== undefined) dbData.avatar_url = data.avatar_url;

      console.log('Sending PATCH request with data:', dbData);
      
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dbData),
        }
      );

      console.log('PATCH response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PATCH error response:', errorText);
        throw new Error(`Failed to update profile: ${response.status} ${errorText}`);
      }

      // Handle 204 No Content response (successful update with no response body)
      if (response.status === 204) {
        console.log('✅ Updated user profile (204 No Content):', { userId });
      } else {
        const responseData = await response.json();
        console.log('PATCH response data:', responseData);
        console.log('✅ Updated user profile:', { userId });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get all available professional categories
   */
  static async getProfessionalCategories(): Promise<ProfessionalCategory[]> {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/professional_categories?select=*&is_active=eq.true&order=sort_order.asc`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch professional categories: ${response.status}`);
      }

      const categories = await response.json();
      console.log('✅ Retrieved professional categories:', categories.length);
      return categories;
    } catch (error) {
      console.error('Error getting professional categories:', error);
      throw error;
    }
  }

  /**
   * Get all available community interests
   */
  static async getCommunityInterests(): Promise<CommunityInterest[]> {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/community_interests?select=*&is_active=eq.true&order=sort_order.asc`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch community interests: ${response.status}`);
      }

      const interests = await response.json();
      console.log('✅ Retrieved community interests:', interests.length);
      return interests;
    } catch (error) {
      console.error('Error getting community interests:', error);
      throw error;
    }
  }

  /**
   * Get user's professional categories
   */
  static async getUserProfessionalCategories(userId: string): Promise<ProfessionalCategory[]> {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/user_professional_categories?select=professional_categories(*)&user_id=eq.${userId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user professional categories: ${response.status}`);
      }

      const data = await response.json();
      const categories = data.map((item: any) => item.professional_categories).filter(Boolean);
      console.log('✅ Retrieved user professional categories:', categories.length);
      return categories;
    } catch (error) {
      console.error('Error getting user professional categories:', error);
      return [];
    }
  }

  /**
   * Get user's community interests
   */
  static async getUserCommunityInterests(userId: string): Promise<CommunityInterest[]> {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/user_community_interests?select=community_interests(*)&user_id=eq.${userId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user community interests: ${response.status}`);
      }

      const data = await response.json();
      const interests = data.map((item: any) => item.community_interests).filter(Boolean);
      console.log('✅ Retrieved user community interests:', interests.length);
      return interests;
    } catch (error) {
      console.error('Error getting user community interests:', error);
      return [];
    }
  }

  /**
   * Get user's event attendance history
   */
  static async getUserEventHistory(userId: string): Promise<EventAttendance[]> {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/user_event_attendance?select=*,events(title)&user_id=eq.${userId}&order=attended_at.desc`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user event history: ${response.status}`);
      }

      const data = await response.json();
      const history = data.map((item: any) => ({
        id: item.id,
        eventId: item.event_id,
        eventTitle: item.events?.title || 'Unknown Event',
        attendedAt: item.attended_at,
        checkInTime: item.check_in_time,
        checkOutTime: item.check_out_time,
      }));
      console.log('✅ Retrieved user event history:', history.length);
      return history;
    } catch (error) {
      console.error('Error getting user event history:', error);
      return [];
    }
  }

  /**
   * Update user's professional categories
   */
  static async updateUserProfessionalCategories(userId: string, categoryIds: string[]): Promise<void> {
    try {
      console.log('Updating user professional categories:', { userId, categoryIds });

      // First, remove existing categories
      await fetch(
        `${this.SUPABASE_URL}/rest/v1/user_professional_categories?user_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      // Then, add new categories
      if (categoryIds.length > 0) {
        const categoriesToInsert = categoryIds.map(categoryId => ({
          user_id: userId,
          category_id: categoryId,
        }));

        const response = await fetch(
          `${this.SUPABASE_URL}/rest/v1/user_professional_categories`,
          {
            method: 'POST',
            headers: {
              ...this.getHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoriesToInsert),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update professional categories: ${response.status} ${errorText}`);
        }
      }

      console.log('✅ Updated user professional categories:', { userId, categoryIds });
    } catch (error) {
      console.error('Error updating user professional categories:', error);
      throw error;
    }
  }

  /**
   * Update user's community interests
   */
  static async updateUserCommunityInterests(userId: string, interestIds: string[]): Promise<void> {
    try {
      console.log('Updating user community interests:', { userId, interestIds });

      // First, remove existing interests
      await fetch(
        `${this.SUPABASE_URL}/rest/v1/user_community_interests?user_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      // Then, add new interests
      if (interestIds.length > 0) {
        const interestsToInsert = interestIds.map(interestId => ({
          user_id: userId,
          interest_id: interestId,
        }));

        const response = await fetch(
          `${this.SUPABASE_URL}/rest/v1/user_community_interests`,
          {
            method: 'POST',
            headers: {
              ...this.getHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(interestsToInsert),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update community interests: ${response.status} ${errorText}`);
        }
      }

      console.log('✅ Updated user community interests:', { userId, interestIds });
    } catch (error) {
      console.error('Error updating user community interests:', error);
      throw error;
    }
  }

  /**
   * Upload profile image to Supabase Storage using the official Supabase client
   * Based on official Supabase documentation for React Native
   */
  static async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('📸 Starting profile image upload:', { userId, imageUri });

      // Convert image to ArrayBuffer (required for React Native)
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      console.log('📸 Image converted to ArrayBuffer, size:', arrayBuffer.byteLength);

      // Generate unique filename with proper extension
      const timestamp = Date.now();
      const fileExt = imageUri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const filename = `profile-${userId}-${timestamp}.${fileExt}`;
      console.log('📸 Generated filename:', filename);

      // Use Supabase client for upload (official method)
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filename, arrayBuffer, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('📸 Supabase upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filename);

      const imageUrl = publicData.publicUrl;
      console.log('✅ Successfully uploaded profile image:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      throw error;
    }
  }

  /**
   * Check if user profile is complete for RSVP eligibility
   * Required fields: first_name, last_name, phone, email, t_shirt_size, dietary_restrictions, accessibility_needs
   */
  static async checkProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
    try {
      console.log('Checking profile completeness:', { userId });

      const profile = await this.getUserProfile(userId);
      
      // Define required fields for RSVP
      const requiredFields = [
        { key: 'firstName', label: 'First Name', value: profile.firstName },
        { key: 'lastName', label: 'Last Name', value: profile.lastName },
        { key: 'phoneNumber', label: 'Phone Number', value: profile.phoneNumber },
        { key: 'email', label: 'Email', value: profile.email },
        { key: 'tShirtSize', label: 'T-Shirt Size', value: profile.tShirtSize },
        { key: 'dietaryRestrictions', label: 'Dietary Restrictions', value: profile.dietaryRestrictions },
        { key: 'accessibilityNeeds', label: 'Accessibility Needs', value: profile.accessibilityNeeds },
      ];

      const missingFields: string[] = [];
      
      for (const field of requiredFields) {
        // Check if string fields are not empty or null
        if (!field.value || (typeof field.value === 'string' && field.value.trim() === '')) {
          missingFields.push(field.label);
        }
      }

      const isComplete = missingFields.length === 0;
      const completionPercentage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

      const result: ProfileCompleteness = {
        isComplete,
        missingFields,
        completionPercentage,
      };

      console.log('✅ Profile completeness check:', result);
      return result;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      throw error;
    }
  }

  /**
   * Get API headers
   */
  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }
}
