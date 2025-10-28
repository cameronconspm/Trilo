-- Supabase Database Schema for Trilo Banking Integration (CORRECTED)

-- Enable Row Level Security
ALTER TABLE IF EXISTS bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  institution_id TEXT,
  current_balance DECIMAL(15,2) DEFAULT 0,
  available_balance DECIMAL(15,2) DEFAULT 0,
  currency_code TEXT DEFAULT 'USD',
  mask TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  merchant_name TEXT,
  category TEXT,
  subcategory TEXT,
  account_owner TEXT,
  pending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, transaction_id)
);

-- Indexes for better performance (CORRECTED)
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_access_token ON bank_accounts(access_token);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
-- Removed the problematic index with subquery

-- Row Level Security Policies
-- Bank Accounts: Users can only see their own accounts
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own bank accounts" ON bank_accounts
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own bank accounts" ON bank_accounts
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- Transactions: Users can only see transactions from their accounts
CREATE POLICY "Users can view transactions from their accounts" ON transactions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM bank_accounts 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can insert transactions to their accounts" ON transactions
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM bank_accounts 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update transactions from their accounts" ON transactions
  FOR UPDATE USING (
    account_id IN (
      SELECT id FROM bank_accounts 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete transactions from their accounts" ON transactions
  FOR DELETE USING (
    account_id IN (
      SELECT id FROM bank_accounts 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_bank_accounts_updated_at 
  BEFORE UPDATE ON bank_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

