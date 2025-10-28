-- Run this in Supabase SQL Editor to check which tables exist

-- Check if user_subscriptions table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_subscriptions';

-- List all your tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

