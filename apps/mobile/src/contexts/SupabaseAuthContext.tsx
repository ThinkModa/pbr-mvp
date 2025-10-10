import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
// Fallback storage for Expo Go compatibility
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  // Fallback for Expo Go - use in-memory storage
  console.log('AsyncStorage not available, using in-memory storage');
  AsyncStorage = {
    getItem: async (key: string) => {
      return global.__expoStorage?.[key] || null;
    },
    setItem: async (key: string, value: string) => {
      if (!global.__expoStorage) global.__expoStorage = {};
      global.__expoStorage[key] = value;
    },
    removeItem: async (key: string) => {
      if (global.__expoStorage) delete global.__expoStorage[key];
    },
  };
}
import 'react-native-url-polyfill/auto';
import { Database } from '../../../packages/database/src/types';

// Supabase configuration for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create Supabase client for React Native
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  
  // Authentication methods
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone: string;
    role: 'business' | 'general';
  }) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signOut: () => Promise<{ error: any | null }>;
  
  // User management
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile from public.users table
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // If profile doesn't exist, create it
        await createUserProfile(supabaseUser);
        return;
      }

      if (userProfile) {
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
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create user profile if it doesn't exist
  const createUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
          role: 'general',
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        // Reload the profile
        await loadUserProfile(supabaseUser);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        return { error };
      }

      // The auth state change listener will handle loading the user profile
      return { error: null };
    } catch (error) {
      console.error('Signin exception:', error);
      return { error };
    }
  };

  // Google sign in (placeholder for future implementation)
  const signInWithGoogle = async () => {
    return { error: { message: 'Google sign-in not implemented yet' } };
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
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUser,
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
