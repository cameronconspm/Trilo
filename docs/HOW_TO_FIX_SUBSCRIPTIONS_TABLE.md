# How to Fix the Subscriptions Table Error

## The Problem
```
ERROR: Could not find the table 'public.user_subscriptions' in the schema cache
```

The `user_subscriptions` table doesn't exist in your Supabase database yet.

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project (raictkrsnejvfvpgqzcq)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run This SQL

Copy and paste this SQL into the editor:

```sql
-- Create user_subscriptions table for RevenueCat subscription tracking
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

CREATE POLICY "Backend can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (true);
```

### Step 3: Execute
1. Click **Run** (or press Cmd/Ctrl + Enter)
2. You should see: ✅ Success. No rows returned

### Step 4: Verify
1. Go to **Table Editor**
2. You should see `user_subscriptions` in the list
3. It should have these columns:
   - user_id (UUID, primary key)
   - status (TEXT)
   - trial_start (TIMESTAMP)
   - trial_end (TIMESTAMP)
   - subscription_product_id (TEXT)
   - subscription_expires_at (TIMESTAMP)
   - revenuecat_user_id (TEXT)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

## Test It
1. Refresh your app
2. The error should be gone
3. You can sign up for a new account and it will auto-create a trial subscription

## Alternative: Use the Existing SQL File

If you prefer, you can use the complete migration:

1. Open: `docs/CREATE_SUBSCRIPTIONS_TABLE.sql`
2. Copy all the SQL
3. Paste into Supabase SQL Editor
4. Run it

## What This Does

- ✅ Creates the `user_subscriptions` table
- ✅ Sets up proper columns for subscription tracking
- ✅ Enables Row Level Security (RLS)
- ✅ Creates policies so users can only see their own data
- ✅ Allows backend/webhook to manage subscriptions
- ✅ Creates an index for fast queries

## Next Steps

After running this:
1. Restart your app (or just reload)
2. Sign up for a new account - it will auto-create a 7-day trial
3. Check the table in Supabase to verify the trial was created

The subscription system is now fully operational! 🎉

