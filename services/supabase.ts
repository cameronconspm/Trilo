import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://cycgtdtsnprulpmfkzwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y2d0ZHRzbnBydWxwbWZrendyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDQwOTUsImV4cCI6MjA2ODUyMDA5NX0.bQUSpMX4KkWJTcgPfewOPg19FXw9FvO05mN6FjQ3D7c';

// Get the appropriate redirect URL based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return `${window.location.origin}/verify`;
  }
  // For mobile development with Expo
  return 'exp://localhost:8081/--/verify';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure the redirect URL for email verification
    redirectTo: getRedirectUrl(),
  }
});