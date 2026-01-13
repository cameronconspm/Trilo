-- Audit Logs Table for Financial Operations
-- This table stores audit logs for all financial operations to meet compliance requirements

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);

-- Row Level Security (RLS) - Service role can access all, users can only see their own
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own audit logs (if accessed via frontend)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

-- Policy: Service role can insert audit logs (backend operations)
-- Note: Service role key bypasses RLS, so this is mainly for frontend access patterns

-- Function to clean up old audit logs (retention policy)
-- Run this periodically (e.g., monthly) to remove logs older than retention period
CREATE OR REPLACE FUNCTION cleanup_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE audit_logs IS 'Audit logs for financial operations and security events';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: CREATE_LINK_TOKEN, EXCHANGE_TOKEN, GET_ACCOUNTS, GET_BALANCE, SYNC_TRANSACTIONS, DELETE_ACCOUNT, etc.';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource: BANK_ACCOUNT, TRANSACTION, LINK_TOKEN, etc.';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource affected (UUID or string)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata about the operation (JSON object)';

