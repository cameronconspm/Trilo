-- Add logo_url column to transactions table for merchant logos
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add index for logo_url lookups (optional, but can help with queries)
CREATE INDEX IF NOT EXISTS idx_transactions_logo_url ON transactions(logo_url) WHERE logo_url IS NOT NULL;


