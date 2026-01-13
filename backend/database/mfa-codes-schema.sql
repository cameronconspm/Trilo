-- MFA Verification Codes Table
-- Stores SMS verification codes securely in database instead of in-memory

CREATE TABLE IF NOT EXISTS mfa_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mfa_codes_verification_id ON mfa_verification_codes(verification_id);
CREATE INDEX IF NOT EXISTS idx_mfa_codes_user_id ON mfa_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_codes_expires_at ON mfa_verification_codes(expires_at);

-- Clean up expired codes (run periodically via cron or scheduled job)
-- This can be done with a PostgreSQL function and pg_cron extension, or via application code

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM mfa_verification_codes
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE mfa_verification_codes IS 'Stores MFA verification codes for SMS-based authentication';
COMMENT ON COLUMN mfa_verification_codes.verification_id IS 'Unique identifier for the verification request';
COMMENT ON COLUMN mfa_verification_codes.code IS '6-digit verification code (stored as plaintext for comparison, expires quickly)';
COMMENT ON COLUMN mfa_verification_codes.attempts IS 'Number of verification attempts made';
COMMENT ON COLUMN mfa_verification_codes.expires_at IS 'Timestamp when the code expires (typically 10 minutes from creation)';

