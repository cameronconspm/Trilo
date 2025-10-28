import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase credentials from environment
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://raictkrsnejvfvpgqzcq.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaWN0a3JzbmVqdmZ2cGdxemNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTI4NDYsImV4cCI6MjA3NzA2ODg0Nn0.VGIKiPi03R_FgaXvYppCwvDkNXQMSu9xJ1H51Z2Eulw';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Please configure environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined, // We'll use AsyncStorage manually
    autoRefreshToken: true,
    persistSession: true,
  },
});
