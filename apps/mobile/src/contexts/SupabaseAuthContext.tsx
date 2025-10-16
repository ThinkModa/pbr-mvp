import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
// import { Database } from '../../../packages/database/src/types';

// Supabase configuration for cloud database
const supabaseUrl = 'https://zqjziejllixifpwzbdnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

// Create Supabase client for React Native
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// User type (compatible with existing interface)
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'business' | 'general';
  avatar_url?: string;
  is_active?: boolean;
  preferences?: any;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  // Authentication state
  user: User | null;
  loading: boolean;
  isConnected: boolean | null;
  connectionError: string | null;
  
  // Authentication methods
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone: string;
    role: 'business' | 'general';
  }) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signInWithApple: () => Promise<{ error: any | null }>;
  signOut: () => Promise<{ error: any | null }>;
  
  // User management
  refreshUser: () => Promise<void>;
  testConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Test connection function
  const testConnection = async () => {
    try {
      setConnectionError(null);
      setLoading(true);
      const { error } = await supabase.auth.getSession();
      if (error) {
        setIsConnected(false);
        setConnectionError('Authentication service unavailable');
        setLoading(false);
        return false;
      }
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      setConnectionError('Connection issue, retrying...');
      setLoading(false);
      return false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setConnectionError('Authentication service unavailable');
          setIsConnected(false);
          setLoading(false);
          return;
        }
        
        setIsConnected(true);
        setConnectionError(null);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setConnectionError('Connection issue, retrying...');
        setIsConnected(false);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, loading profile...');
          setLoading(true);
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed, ensuring profile is loaded...');
          if (!user) {
            await loadUserProfile(session.user);
          }
        } else if (session?.user && !user) {
          console.log('Session exists but no user loaded, loading profile...');
          setLoading(true);
          await loadUserProfile(session.user);
        } else if (!session?.user) {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to user profile changes for real-time role updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('User profile updated:', payload);
          // Refresh user data when profile changes
          await refreshUser();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Load user profile from public.users table
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', supabaseUser.email);
      
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // If profile doesn't exist, create it
        console.log('Creating user profile...');
        await createUserProfile(supabaseUser);
        return;
      }

      if (userProfile) {
        console.log('User profile loaded:', userProfile.email, userProfile.role);
        const user: User = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role as 'admin' | 'business' | 'general',
          avatar_url: userProfile.avatar_url,
          is_active: userProfile.is_active,
          preferences: userProfile.preferences,
          last_login_at: userProfile.last_login_at,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,
        };
        setUser(user);
        setLoading(false);
      } else {
        console.log('No user profile found, creating one...');
        await createUserProfile(supabaseUser);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setConnectionError('Failed to load user profile');
      setLoading(false);
    }
  };

  // Create user profile if it doesn't exist
  const createUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Creating user profile for:', supabaseUser.email);
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
          role: supabaseUser.user_metadata?.role || 'general',
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating user profile:', error);
        setLoading(false);
      } else {
        console.log('User profile created successfully');
        // Reload the profile
        await loadUserProfile(supabaseUser);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      setLoading(false);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone: string;
    role: 'business' | 'general';
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: `${userData.firstName} ${userData.lastName}`,
            firstName: userData.firstName,  // Add explicit field
            lastName: userData.lastName,     // Add explicit field
            phone: userData.phone,
            role: userData.role,
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      // The user profile will be created automatically by the database trigger
      // and the auth state change listener will load it
      return { error: null };
    } catch (error) {
      console.error('Signup exception:', error);
      return { error };
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signin error:', error);
        return { error };
      }

      console.log('✅ Sign in successful:', data.user?.email);
      console.log('📊 Session data:', data.session ? 'Session exists' : 'No session');

      // The auth state change listener will handle loading the user profile
      return { error: null };
    } catch (error) {
      console.error('💥 Signin exception:', error);
      return { error };
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
    try {
      console.log('🔐 Attempting password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://zqjziejllixifpwzbdnf.supabase.co/auth/v1/verify',
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error };
      }

      console.log('✅ Password reset email sent successfully');
      return { error: null };
    } catch (error) {
      console.error('💥 Password reset exception:', error);
      return { error };
    }
  };

  // Google sign in
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Attempting Google sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://zqjziejllixifpwzbdnf.supabase.co/auth/v1/callback',
        }
      });

      if (error) {
        console.error('❌ Google sign in error:', error);
        return { error };
      }

      console.log('✅ Google sign in initiated successfully');
      return { error: null };
    } catch (error) {
      console.error('💥 Google sign in exception:', error);
      return { error };
    }
  };

  // Apple sign in
  const signInWithApple = async () => {
    try {
      console.log('🔐 Attempting Apple sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'https://zqjziejllixifpwzbdnf.supabase.co/auth/v1/callback',
        }
      });

      if (error) {
        console.error('❌ Apple sign in error:', error);
        return { error };
      }

      console.log('✅ Apple sign in initiated successfully');
      return { error: null };
    } catch (error) {
      console.error('💥 Apple sign in exception:', error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        return { error };
      }
      return { error: null };
    } catch (error) {
      console.error('Signout exception:', error);
      return { error };
    }
  };

  // Refresh user
  const refreshUser = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        await loadUserProfile(supabaseUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isConnected,
    connectionError,
    signUp,
    signIn,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    signOut,
    refreshUser,
    testConnection,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
