-- FINAL FIX: Update RLS policies to allow service_role to delete accounts
-- This script handles existing policies gracefully

-- Step 1: Drop ALL existing DELETE policies for bank_accounts
DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Service role can delete bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Service role can delete any bank account" ON bank_accounts;

-- Step 2: Create the main DELETE policy that allows both users and service_role
CREATE POLICY "Users can delete their own bank accounts" ON bank_accounts
  FOR DELETE 
  USING (
    -- Allow if user_id matches (for regular authenticated users)
    user_id = current_setting('app.current_user_id', true)
    OR
    -- Allow service_role to delete (for backend operations)
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
  );

-- Step 3: Create explicit policy for service_role (backup method)
-- This is more explicit and ensures service_role can always delete
CREATE POLICY "Service role can delete bank accounts" ON bank_accounts
  FOR DELETE 
  TO service_role
  USING (true);

-- Step 4: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'bank_accounts' AND cmd = 'DELETE'
ORDER BY policyname;

-- You should see 2 policies:
-- 1. "Users can delete their own bank accounts" (for both users and service_role)
-- 2. "Service role can delete bank accounts" (explicitly for service_role)

