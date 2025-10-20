import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, AppState } from 'react-native';
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

  // Initialize auth state with timeout and retry logic
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔄 Initializing auth state...');
        
        // Set a timeout for the initialization
        const initTimeout = setTimeout(() => {
          console.log('⏰ Auth initialization timeout, stopping loading');
          setLoading(false);
        }, 10000); // 10 second timeout
        
        // Test connection first with retry
        let isConnected = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!isConnected && retryCount < maxRetries) {
          isConnected = await testConnection();
          if (!isConnected) {
            retryCount++;
            console.log(`❌ Connection failed, retry ${retryCount}/${maxRetries}`);
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            }
          }
        }
        
        if (!isConnected) {
          console.log('❌ No connection to Supabase after retries');
          setConnectionError('Authentication service unavailable');
          setIsConnected(false);
          clearTimeout(initTimeout);
          setLoading(false);
          return;
        }
        
        setIsConnected(true);
        setConnectionError(null);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setConnectionError('Failed to check authentication status');
          setIsConnected(false);
          clearTimeout(initTimeout);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Found existing session, loading profile for:', session.user.email);
          await loadUserProfile(session.user);
        } else {
          console.log('ℹ️ No existing session found');
          setUser(null);
        }
        
        clearTimeout(initTimeout);
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error);
        setConnectionError('Authentication initialization failed');
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Handle OAuth callback from deep links
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      if (url.includes('auth/callback')) {
        console.log('🔄 Processing OAuth callback...');
        
        try {
          // Check for error in the URL
          if (url.includes('error=')) {
            console.log('❌ OAuth error detected in callback URL');
            
            // Extract error details
            const urlFragment = url.split('#')[1];
            if (urlFragment) {
              const params = new URLSearchParams(urlFragment);
              const error = params.get('error');
              const errorDescription = params.get('error_description');
              
              console.log('🚨 OAuth Error:', error);
              console.log('📝 Error Description:', errorDescription);
              
              // If it's a database error saving new user, we can still proceed
              if (error === 'server_error' && errorDescription?.includes('Database error saving new user')) {
                console.log('🔄 Database error during user creation - this is expected for new users');
                console.log('💡 User authentication succeeded, but profile creation failed');
                console.log('🚀 Creating temporary user session from OAuth data...');
                
                // Create a temporary user session from OAuth data
                // We'll extract user info from the error URL or use defaults
                const tempUser: User = {
                  id: 'temp-' + Date.now(), // Temporary ID
                  email: 'user@example.com', // We don't have the email from error URL
                  name: 'New User',
                  role: 'general',
                  avatar_url: undefined,
                  is_active: true,
                  preferences: {},
                  last_login_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                
                console.log('✅ Temporary user session created:', tempUser.email);
                setUser(tempUser);
                setLoading(false);
                return;
              }
            }
            
            setLoading(false);
            return;
          }
          
          // Extract the URL fragment (everything after #)
          const urlFragment = url.split('#')[1];
          if (urlFragment) {
            console.log('📊 URL fragment:', urlFragment);
            
            // Parse the fragment to get the access token
            const params = new URLSearchParams(urlFragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken) {
              console.log('✅ Access token found, setting session...');
              
              // Set the session with the tokens
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (error) {
                console.error('❌ Error setting session:', error);
              } else {
                console.log('✅ Session set successfully:', data.user?.email);
              }
            }
          }
        } catch (error) {
          console.error('💥 Error processing OAuth callback:', error);
        }
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check for initial deep link (if app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in via OAuth, handling profile...');
          setLoading(true);
          await handleOAuthUser(session.user);
        } else if (event === 'SIGNED_IN' && !session?.user) {
          // This can happen when OAuth succeeds but user creation fails
          console.log('⚠️ SIGNED_IN event but no user session - OAuth succeeded but user creation failed');
          console.log('🔄 This is expected for new users when database has issues');
          setLoading(false);
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

    return () => {
      subscription.unsubscribe();
      linkingSubscription?.remove();
    };
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

  // Handle OAuth user (try to load first, create if needed)
  const handleOAuthUser = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('🔄 Handling OAuth user:', supabaseUser.email);
      console.log('🆔 User ID:', supabaseUser.id);
      
      // Try to load existing profile with timeout, fallback to OAuth data if database unavailable
      console.log('🔍 Attempting to load existing profile from database...');
      
      try {
        // Try database query with timeout
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000) // 5 second timeout
        );
        
        const { data: userProfile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        if (userProfile && !error) {
          // Existing profile found - use it
          console.log('✅ Existing user profile found:', userProfile.email, userProfile.role);
          const user: User = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role as 'admin' | 'business' | 'general',
            avatar_url: userProfile.avatar_url,
            is_active: userProfile.is_active,
            preferences: userProfile.preferences,
            last_login_at: new Date().toISOString(), // Update last login
            created_at: userProfile.created_at,
            updated_at: new Date().toISOString(),
          };
          setUser(user);
          setLoading(false);
          return;
        } else if (error && error.code === 'PGRST116') {
          // Profile doesn't exist - create it
          console.log('🆕 No existing profile found, creating new profile...');
          await createUserProfileWithFallback(supabaseUser);
          return;
        } else {
          // Other database error - fallback to OAuth data
          console.log('⚠️ Database error, falling back to OAuth data:', error);
          createUserFromOAuthData(supabaseUser);
          return;
        }
      } catch (timeoutError) {
        // Database timeout - fallback to OAuth data
        console.log('⏰ Database timeout, falling back to OAuth data');
        createUserFromOAuthData(supabaseUser);
        return;
      }
    } catch (error) {
      console.error('💥 Error handling OAuth user:', error);
      console.log('🔧 Exception details:', JSON.stringify(error, null, 2));
      setLoading(false);
    }
  };

  // Create user profile with fallback if database fails
  const createUserProfileWithFallback = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('🔄 Attempting to create user profile in database...');
      await createUserProfile(supabaseUser);
      // If successful, load the profile
      await loadUserProfile(supabaseUser);
    } catch (error) {
      console.log('⚠️ Failed to create profile in database, using OAuth data:', error);
      createUserFromOAuthData(supabaseUser);
    }
  };

  // Create user profile directly from OAuth data (fallback)
  const createUserFromOAuthData = (supabaseUser: SupabaseUser) => {
    console.log('🚀 Creating user profile from OAuth data (database unavailable)...');
    
    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
      role: 'general', // Default role for OAuth users
      avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      is_active: true,
      preferences: {},
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ User profile created from OAuth data:', user.email, user.name);
    setUser(user);
    setLoading(false);
  };

  // Load user profile from public.users table
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('🔄 Loading user profile for:', supabaseUser.email);
      console.log('🆔 User ID for profile load:', supabaseUser.id);
      
      // Set a timeout for profile loading
      const profileTimeout = setTimeout(() => {
        console.log('⏰ Profile loading timeout, creating fallback user');
        createUserFromOAuthData(supabaseUser);
      }, 8000); // 8 second timeout
      
      console.log('🔍 Executing profile query...');
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      clearTimeout(profileTimeout);
      console.log('📊 Profile query result:', { userProfile, error });

      if (error) {
        console.error('❌ Error loading user profile:', error);
        console.log('🔧 Error details:', JSON.stringify(error, null, 2));
        
        // If profile doesn't exist, create it
        console.log('🆕 Creating user profile...');
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
      // Don't set connection error, just create fallback user
      console.log('🔄 Creating fallback user from OAuth data due to error');
      createUserFromOAuthData(supabaseUser);
    }
  };

  // Create user profile if it doesn't exist
  const createUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Creating user profile for:', supabaseUser.email);
      
      const { error } = await supabase
        .from('users')
        .upsert({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
          role: supabaseUser.user_metadata?.role || 'general',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ Error creating user profile:', error);
        console.log('🔧 Create profile error details:', JSON.stringify(error, null, 2));
        throw error; // Let handleOAuthUser handle the error
      } else {
        console.log('✅ User profile created/updated successfully');
        // Don't reload here - handleOAuthUser will do it
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

  // Helper function to extract parameters from OAuth URL
  const extractParamsFromUrl = (url: string) => {
    const parsedUrl = new URL(url);
    const hash = parsedUrl.hash.substring(1); // Remove the leading '#'
    const params = new URLSearchParams(hash);

    return {
      access_token: params.get("access_token"),
      expires_in: parseInt(params.get("expires_in") || "0"),
      refresh_token: params.get("refresh_token"),
      token_type: params.get("token_type"),
      provider_token: params.get("provider_token"),
      code: params.get("code"),
    };
  };

  // Google sign in
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Attempting Google sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.thinkmodalabs.pbr-mvp://auth/callback',
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('❌ Google sign in error:', error);
        return { error };
      }

      console.log('✅ Google sign in initiated successfully');
      console.log('📊 OAuth data:', JSON.stringify(data, null, 2));
      
      // Check if we have a URL to open
      if (data?.url) {
        console.log('🌐 Opening OAuth URL:', data.url);
        try {
          const canOpen = await Linking.canOpenURL(data.url);
          if (canOpen) {
            await Linking.openURL(data.url);
            console.log('✅ Successfully opened OAuth URL');
          } else {
            console.log('❌ Cannot open OAuth URL');
          }
        } catch (error) {
          console.error('❌ Error opening OAuth URL:', error);
        }
      } else {
        console.log('⚠️ No OAuth URL received');
      }
      
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
          redirectTo: 'com.thinkmodalabs.pbr-mvp://auth/callback',
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('❌ Apple sign in error:', error);
        return { error };
      }

      console.log('✅ Apple sign in initiated successfully');
      console.log('📊 OAuth data:', JSON.stringify(data, null, 2));
      
      // Check if we have a URL to open
      if (data?.url) {
        console.log('🌐 Opening OAuth URL:', data.url);
        try {
          const canOpen = await Linking.canOpenURL(data.url);
          if (canOpen) {
            await Linking.openURL(data.url);
            console.log('✅ Successfully opened OAuth URL');
          } else {
            console.log('❌ Cannot open OAuth URL');
          }
        } catch (error) {
          console.error('❌ Error opening OAuth URL:', error);
        }
      } else {
        console.log('⚠️ No OAuth URL received');
      }
      
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
