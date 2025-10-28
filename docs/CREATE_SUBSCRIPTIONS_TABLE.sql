-- Create user_subscriptions table for RevenueCat subscription tracking
-- Run this in Supabase SQL Editor

-- USER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'expired', 'freeAccess'
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  subscription_product_id TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  revenuecat_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON user_subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- This policy allows the backend/webhook to update any subscription
-- (for webhook handlers that receive RevenueCat events)
CREATE POLICY "Backend can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (true);

