import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
// import { Database } from '../../../packages/database/src/types';

// Supabase configuration for cloud database
const supabaseUrl = 'https://zqjziejllixifpwzbdnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzgxMzIsImV4cCI6MjA3NTY1NDEzMn0.xCpv4401K5-WzojCMLy4HdY5xQJBP9xbar1sJTFkVgc';

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
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxanppZWpsbGl4aWZwd3piZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3ODEzMiwiZXhwIjoyMDc1NjU0MTMyfQ.xr96t-eC_8o0iMEhvTcdcBw9-ifcEwcwJdWGNzRe45M';
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
