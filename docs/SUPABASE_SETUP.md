# Supabase Setup Guide - User-Specific Data Storage

## Step 1: Create Supabase Tables

Go to your Supabase dashboard: https://supabase.com/dashboard

Navigate to: **SQL Editor** → **New Query**

Run this SQL:

```sql
-- Enable Row Level Security (RLS) for auth.users
-- This allows users to only see their own data

-- 1. USER TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS user_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  name TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  pay_schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER INCOME TABLE
CREATE TABLE IF NOT EXISTS user_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT DEFAULT 'income',
  is_recurring BOOLEAN DEFAULT FALSE,
  pay_schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USER SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS user_savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT,
  avatar_uri TEXT,
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. USER TUTORIAL STATUS TABLE
CREATE TABLE IF NOT EXISTS user_tutorial_status (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  needs_tutorial BOOLEAN DEFAULT TRUE,
  tutorial_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. USER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'trial',
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  subscription_product_id TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  revenuecat_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON user_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_income_user_id ON user_income(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON user_savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_status_user_id ON user_tutorial_status(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON user_subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tutorial_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can only access their own data

-- Transactions
CREATE POLICY "Users can view own transactions"
  ON user_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON user_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON user_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON user_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Income
CREATE POLICY "Users can view own income"
  ON user_income FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income"
  ON user_income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income"
  ON user_income FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income"
  ON user_income FOR DELETE
  USING (auth.uid() = user_id);

-- Savings Goals
CREATE POLICY "Users can view own savings goals"
  ON user_savings_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own savings goals"
  ON user_savings_goals FOR ALL
  USING (auth.uid() = user_id);

-- Settings
CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Tutorial Status
CREATE POLICY "Users can manage own tutorial status"
  ON user_tutorial_status FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can manage own subscription"
  ON user_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Step 2: Verify Tables Created

Check your Supabase dashboard:
- **Table Editor** → You should see the 6 new tables
- Each table should have a user_id column linked to auth.users

## Step 3: Test Connection

Your Supabase instance appears to be down (503 errors). Let's check:

```bash
# Test if Supabase is accessible
curl -I https://aputbauyuhhcsrnpwacb.supabase.co
```

If it's still down, the test account fallback will allow you to continue development.

## What's Next?

Once Supabase is back online:
1. Create the tables (SQL above)
2. Implement data sync service
3. Update storage keys to include user_id
4. Add sync logic to save/load from Supabase

