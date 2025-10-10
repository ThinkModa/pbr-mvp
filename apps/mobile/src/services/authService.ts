// Hybrid Authentication Service
// This service provides real authentication capabilities while maintaining compatibility
// with the existing MockAuth system

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'business' | 'general';
  avatar_url?: string;
  is_active: boolean;
  preferences?: any;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  session?: any;
}

class AuthService {
  private baseUrl = 'http://127.0.0.1:54321';
  private anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  // Sign up a new user
  async signUp(email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone: string;
    role: 'business' | 'general';
  }): Promise<AuthResponse> {
    try {
      // Call Supabase auth API directly
      const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          data: {
            name: `${userData.firstName} ${userData.lastName}`,
            phone: userData.phone,
            role: userData.role,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.msg || 'Signup failed' };
      }

      // Get user profile from our users table
      const userProfile = await this.getUserProfile(data.user.id);
      
      return {
        success: true,
        user: userProfile,
        session: data.session
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Sign in a user
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.msg || 'Login failed' };
      }

      // Get user profile from our users table
      const userProfile = await this.getUserProfile(data.user.id);
      
      return {
        success: true,
        user: userProfile,
        session: data
      };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get user profile from our users table
  private async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
        },
      });

      const data = await response.json();
      
      if (data && data.length > 0) {
        return data[0] as AuthUser;
      }
      
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Sign out
  async signOut(): Promise<AuthResponse> {
    // For now, just return success since we're not maintaining server-side sessions
    return { success: true };
  }

  // Refresh user data
  async refreshUser(userId: string): Promise<AuthUser | null> {
    return await this.getUserProfile(userId);
  }
}

export const authService = new AuthService();
export type { AuthUser, AuthResponse };
