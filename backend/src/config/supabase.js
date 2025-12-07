const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client with SERVICE_ROLE_KEY
// SERVICE_ROLE_KEY automatically bypasses RLS (Row Level Security)
// This is required for backend operations that need to access all data
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Verify the key is actually a service role key (starts with 'eyJ' and is long)
if (supabaseKey.length < 100) {
  console.warn('[Supabase Config] ⚠️  SERVICE_ROLE_KEY appears to be too short. Make sure you\'re using the SERVICE_ROLE_KEY, not the anon key.');
}

module.exports = supabase;

