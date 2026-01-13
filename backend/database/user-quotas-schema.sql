-- User Quotas Table for Cost Control
-- Tracks per-user quotas for various operations to prevent abuse and cost overruns

CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  quota_type TEXT NOT NULL, -- 'plaid_link_token', 'plaid_connections', 'plaid_syncs', 'plaid_balance_queries', 'plaid_deletions', 'sms_codes'
  period TEXT NOT NULL, -- 'hour', 'day', 'month', 'lifetime'
  current_count INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quota_type, period, DATE(period_start))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_type_period ON user_quotas(quota_type, period);
CREATE INDEX IF NOT EXISTS idx_user_quotas_period_start ON user_quotas(period_start);

-- Account Sync Tracking Table
-- Tracks sync operations per account to enforce minimum intervals and daily limits
CREATE TABLE IF NOT EXISTS account_sync_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_cursor TEXT, -- For incremental syncs (Plaid cursor)
  sync_count_today INTEGER DEFAULT 0,
  sync_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, sync_date)
);

-- Indexes for account sync tracking
CREATE INDEX IF NOT EXISTS idx_account_sync_account_id ON account_sync_tracking(account_id);
CREATE INDEX IF NOT EXISTS idx_account_sync_user_id ON account_sync_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_account_sync_sync_date ON account_sync_tracking(sync_date);
CREATE INDEX IF NOT EXISTS idx_account_sync_last_sync ON account_sync_tracking(last_sync_at);

-- Function to clean up old quota records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_quotas(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete quotas older than retention period (keep recent quotas for analytics)
  DELETE FROM user_quotas
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    AND period != 'lifetime'; -- Keep lifetime quotas
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily/hourly quotas (run via cron or scheduled job)
CREATE OR REPLACE FUNCTION reset_periodic_quotas()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Reset daily quotas (set current_count to 0, update period_start)
  UPDATE user_quotas
  SET current_count = 0,
      period_start = NOW(),
      updated_at = NOW()
  WHERE period = 'day'
    AND DATE(period_start) < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Reset hourly quotas (set current_count to 0, update period_start)
  UPDATE user_quotas
  SET current_count = 0,
      period_start = NOW(),
      updated_at = NOW()
  WHERE period = 'hour'
    AND period_start < NOW() - INTERVAL '1 hour';
  
  -- Reset daily sync counts
  UPDATE account_sync_tracking
  SET sync_count_today = 0,
      sync_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE sync_date < CURRENT_DATE;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE user_quotas IS 'Tracks per-user quotas for API operations to prevent abuse and cost overruns';
COMMENT ON COLUMN user_quotas.quota_type IS 'Type of quota: plaid_link_token, plaid_connections, plaid_syncs, plaid_balance_queries, plaid_deletions, sms_codes';
COMMENT ON COLUMN user_quotas.period IS 'Time period: hour, day, month, lifetime';
COMMENT ON TABLE account_sync_tracking IS 'Tracks transaction sync operations per account to enforce frequency limits';
COMMENT ON COLUMN account_sync_tracking.last_sync_cursor IS 'Plaid sync cursor for incremental transaction syncing';

