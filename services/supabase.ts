import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cycgtdtsnprulpmfkzwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y2d0ZHRzbnBydWxwbWZrendyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDQwOTUsImV4cCI6MjA2ODUyMDA5NX0.bQUSpMX4KkWJTcgPfewOPg19FXw9FvO05mN6FjQ3D7c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);