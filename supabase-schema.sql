-- =====================================================
-- Supabase Schema: app_users Table Setup
-- =====================================================

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view own profile" ON app_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON app_users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (auth.uid() = id);

-- Optional: Index on email for faster lookup
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- Auto-update updated_at timestamp on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON app_users;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
