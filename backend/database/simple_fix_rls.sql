-- SIMPLE FIX: Modify RLS policy to allow service_role to delete
-- This is the easiest and most reliable solution

-- Step 1: Drop the existing DELETE policy
DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON bank_accounts;

-- Step 2: Create a new policy that allows both regular users AND service_role
CREATE POLICY "Users can delete their own bank accounts" ON bank_accounts
  FOR DELETE 
  USING (
    -- Allow if user_id matches (for regular authenticated users)
    user_id = current_setting('app.current_user_id', true)
    OR
    -- Allow service_role to delete any account (for backend operations)
    -- This checks if the JWT claim has role = 'service_role'
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
  );

-- Step 3: Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'bank_accounts' AND cmd = 'DELETE';

-- If the above doesn't work, try this alternative:
-- Create a separate policy specifically for service_role
-- DROP POLICY IF EXISTS "Service role can delete bank accounts" ON bank_accounts;
-- CREATE POLICY "Service role can delete bank accounts" ON bank_accounts
--   FOR DELETE 
--   TO service_role
--   USING (true);

