-- PostgreSQL function to delete bank account with SECURITY DEFINER
-- This bypasses RLS by running with elevated privileges
CREATE OR REPLACE FUNCTION delete_bank_account(account_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete the account (RLS is bypassed due to SECURITY DEFINER)
  DELETE FROM bank_accounts WHERE id = account_uuid;
  
  -- Get the number of rows deleted
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Return true if at least one row was deleted
  RETURN deleted_count > 0;
END;
$$;

-- Grant execute permission to service_role (or authenticated users if needed)
GRANT EXECUTE ON FUNCTION delete_bank_account(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION delete_bank_account(UUID) TO authenticated;

