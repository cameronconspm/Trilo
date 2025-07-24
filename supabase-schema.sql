-- Supabase Schema for app_users table
-- Run this in your Supabase SQL editor to create the required table

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON app_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON app_users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (auth.uid() = id);



-- Optional: Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);