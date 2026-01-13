# Quota Cleanup Functions Setup Guide

## Overview

The quota system includes two cleanup functions that should be run periodically to maintain database performance and accuracy:

1. **`reset_periodic_quotas()`** - Resets daily/hourly quota counters (run daily)
2. **`cleanup_old_quotas(retention_days)`** - Removes old quota records (run weekly/monthly)

## Option 1: Supabase pg_cron Extension (Recommended)

Supabase supports the `pg_cron` extension for scheduling PostgreSQL functions.

### Step 1: Enable pg_cron Extension

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

### Step 2: Schedule Daily Quota Reset

Run this SQL to schedule daily quota resets (runs at 2 AM UTC daily):

```sql
-- Schedule daily quota reset at 2 AM UTC
SELECT cron.schedule(
  'reset-daily-quotas',
  '0 2 * * *',  -- Cron expression: 2 AM UTC daily
  $$SELECT reset_periodic_quotas()$$
);
```

To change the time, modify the cron expression:
- `'0 2 * * *'` = 2 AM UTC daily
- `'0 0 * * *'` = Midnight UTC daily
- `'0 3 * * *'` = 3 AM UTC daily

### Step 3: Schedule Weekly Cleanup (Optional)

Run this SQL to schedule weekly cleanup of old quota records (runs Sundays at 3 AM UTC):

```sql
-- Schedule weekly cleanup of old quota records (Sundays at 3 AM UTC)
SELECT cron.schedule(
  'cleanup-old-quotas',
  '0 3 * * 0',  -- Cron expression: 3 AM UTC every Sunday
  $$SELECT cleanup_old_quotas(90)$$  -- Keep 90 days of quota records
);
```

### Step 4: Verify Scheduled Jobs

Check your scheduled jobs:

```sql
-- View all scheduled cron jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Step 5: Manage Scheduled Jobs (Optional)

```sql
-- Pause a scheduled job
SELECT cron.alter_job('reset-daily-quotas', schedule => null);

-- Resume a scheduled job
SELECT cron.alter_job('reset-daily-quotas', schedule => '0 2 * * *');

-- Delete a scheduled job
SELECT cron.unschedule('reset-daily-quotas');
SELECT cron.unschedule('cleanup-old-quotas');
```

## Option 2: Application-Level Scheduler (Alternative)

If pg_cron is not available, you can create a simple cron job or scheduled task that calls these functions via a database connection.

### Using Node.js with node-cron

Create a new file: `backend/src/scripts/quotaCleanup.js`

```javascript
const cron = require('node-cron');
const supabase = require('../config/supabase');

// Reset daily quotas (runs daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily quota reset...');
  const { data, error } = await supabase.rpc('reset_periodic_quotas');
  if (error) {
    console.error('Error resetting quotas:', error);
  } else {
    console.log('Quota reset completed:', data);
  }
});

// Cleanup old quotas (runs weekly on Sunday at 3 AM)
cron.schedule('0 3 * * 0', async () => {
  console.log('Running weekly quota cleanup...');
  const { data, error } = await supabase.rpc('cleanup_old_quotas', { retention_days: 90 });
  if (error) {
    console.error('Error cleaning up old quotas:', error);
  } else {
    console.log('Cleanup completed, deleted:', data, 'records');
  }
});

console.log('Quota cleanup scheduler started');
```

Then install node-cron:
```bash
cd backend
npm install node-cron
```

And run it as a separate process or integrate into your server.

## Option 3: External Cron Service (For Production)

Use an external service like:
- **GitHub Actions** (free, runs on schedule)
- **Railway Cron Jobs** (if available)
- **AWS Lambda + EventBridge** (for AWS deployments)
- **Vercel Cron** (if using Vercel)

### Example: GitHub Actions Workflow

Create `.github/workflows/quota-cleanup.yml`:

```yaml
name: Quota Cleanup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual triggers

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Reset Quotas
        run: |
          # Use Supabase CLI or direct SQL connection
          psql $DATABASE_URL -c "SELECT reset_periodic_quotas();"
```

## Testing the Functions

Before scheduling, test the functions manually:

```sql
-- Test reset function
SELECT reset_periodic_quotas();

-- Test cleanup function (with shorter retention for testing)
SELECT cleanup_old_quotas(7);  -- Keep only 7 days for testing

-- Check results
SELECT COUNT(*) FROM user_quotas;
SELECT * FROM user_quotas ORDER BY created_at DESC LIMIT 10;
```

## Monitoring

After setup, monitor the functions:

```sql
-- Check quota counts
SELECT 
  quota_type,
  period,
  COUNT(*) as record_count,
  SUM(current_count) as total_usage
FROM user_quotas
GROUP BY quota_type, period;

-- Check when quotas were last reset
SELECT 
  period,
  MAX(period_start) as last_reset,
  COUNT(*) as active_quotas
FROM user_quotas
WHERE period IN ('day', 'hour')
GROUP BY period;
```

## Troubleshooting

**Issue: pg_cron extension not available**
- Solution: Use Option 2 (application-level) or Option 3 (external service)

**Issue: Functions not running**
- Check cron job status: `SELECT * FROM cron.job;`
- Check job run details: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
- Verify functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE '%quota%';`

**Issue: Too many quota records**
- Reduce retention period: `SELECT cleanup_old_quotas(30);` (keep 30 days instead of 90)
- Run cleanup more frequently

## Recommendations

1. **Start with pg_cron** (Option 1) - Simplest and most reliable
2. **Monitor initially** - Check logs for the first few days to ensure it's working
3. **Adjust schedules** - Based on your usage patterns and timezone preferences
4. **Set retention period** - 90 days is reasonable, but adjust based on your analytics needs

