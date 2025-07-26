-- =====================================================
-- Supabase Schema: app_users Table Setup
-- =====================================================

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  preferences JSONB DEFAULT '{}',
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
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON app_users;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- User Transactions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  is_recurring BOOLEAN DEFAULT false,
  pay_schedule JSONB,
  given_expense_schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_transactions
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_transactions
CREATE POLICY "Users can view own transactions" ON user_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON user_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON user_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON user_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for user_transactions
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_date ON user_transactions(date);
CREATE INDEX IF NOT EXISTS idx_user_transactions_type ON user_transactions(type);

-- Create trigger for user_transactions
DROP TRIGGER IF EXISTS set_updated_at_transactions ON user_transactions;
CREATE TRIGGER set_updated_at_transactions
BEFORE UPDATE ON user_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- User Income Table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'yearly')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active BOOLEAN DEFAULT true,
  pay_schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_income
ALTER TABLE user_income ENABLE ROW LEVEL SECURITY;

-- Create policies for user_income
CREATE POLICY "Users can view own income" ON user_income
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income" ON user_income
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income" ON user_income
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income" ON user_income
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for user_income
CREATE INDEX IF NOT EXISTS idx_user_income_user_id ON user_income(user_id);
CREATE INDEX IF NOT EXISTS idx_user_income_is_active ON user_income(is_active);

-- Create trigger for user_income
DROP TRIGGER IF EXISTS set_updated_at_income ON user_income;
CREATE TRIGGER set_updated_at_income
BEFORE UPDATE ON user_income
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- User Goals Table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  time_to_save INTEGER,
  created_date TEXT NOT NULL,
  target_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_goals
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for user_goals
CREATE POLICY "Users can view own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for user_goals
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- Create trigger for user_goals
DROP TRIGGER IF EXISTS set_updated_at_goals ON user_goals;
CREATE TRIGGER set_updated_at_goals
BEFORE UPDATE ON user_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
