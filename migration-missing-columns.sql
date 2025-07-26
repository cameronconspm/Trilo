-- =====================================================
-- Migration: Add Missing Columns to Existing Tables
-- =====================================================

-- Add missing preferences column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add missing pay_schedule column to user_transactions table
ALTER TABLE user_transactions 
ADD COLUMN IF NOT EXISTS pay_schedule JSONB;

-- Add missing given_expense_schedule column to user_transactions table
ALTER TABLE user_transactions 
ADD COLUMN IF NOT EXISTS given_expense_schedule JSONB;

-- Add missing pay_schedule column to user_income table (if not exists)
ALTER TABLE user_income 
ADD COLUMN IF NOT EXISTS pay_schedule JSONB;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
AND column_name = 'preferences';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_transactions' 
AND column_name IN ('pay_schedule', 'given_expense_schedule');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_income' 
AND column_name = 'pay_schedule';