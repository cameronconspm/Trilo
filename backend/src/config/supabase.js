const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase Config] ❌ Missing Supabase configuration - DB features will be unavailable. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  module.exports = null;
  return;
}

// Create Supabase client with SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

if (supabaseKey.length < 100) {
  console.warn('[Supabase Config] ⚠️  SERVICE_ROLE_KEY appears to be too short. Make sure you\'re using the SERVICE_ROLE_KEY, not the anon key.');
}

module.exports = supabase;

