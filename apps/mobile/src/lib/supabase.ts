import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
// import { Database } from '../../../packages/database/src/types';

// Environment-aware Supabase configuration
const getSupabaseConfig = () => {
  // Priority: EAS environment variables > app.json extra > fallback
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
    Constants.expoConfig?.extra?.supabaseUrl || 
    'https://zqjziejllixifpwzbdnf.supabase.co';
    
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
    Constants.expoConfig?.extra?.supabaseAnonKey || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';
    
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 
    Constants.expoConfig?.extra?.appEnv || 
    'staging';
    
  console.log(`🔧 Supabase Config - Environment: ${appEnv}, URL: ${supabaseUrl}`);
  
  return { supabaseUrl, supabaseAnonKey, appEnv };
};

const { supabaseUrl, supabaseAnonKey, appEnv } = getSupabaseConfig();

// Create Supabase client for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get service role client for admin operations
export const getServiceRoleClient = () => {
  // Environment-aware service role key (you'll need to set this for beta)
  const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Export current environment for debugging
export const currentEnvironment = appEnv;
