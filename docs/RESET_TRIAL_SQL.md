# Reset Trial SQL Script

This guide provides a SQL script to reset subscription trials for specific test accounts in Supabase. Use this when you need to restart trials during testing.

## Quick Start

1. Open **Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

2. Copy and paste the script below

3. Modify the configuration variables if needed (trial duration, target emails)

4. Click **Run** (or press Cmd/Ctrl + Enter)

---

## Reset Trial Script

### Standard Script (7-day trial)

```sql
-- Reset trials for test accounts
-- Modify the trial duration and email addresses below as needed

DO $$
DECLARE
  trial_days INTEGER := 7;  -- Trial duration in days (change to 1, 3, etc. for faster testing)
  target_emails TEXT[] := ARRAY['cameroncons@icloud.com', 'test@trilo.app'];
BEGIN
  -- Update subscriptions for matching users
  UPDATE user_subscriptions
  SET 
    trial_start = NOW(),
    trial_end = NOW() + (trial_days || ' days')::INTERVAL,
    status = 'trial',
    updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = ANY(target_emails)
  )
  AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_subscriptions.user_id
  );
  
  -- Display results
  RAISE NOTICE 'Trials reset for % users', (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'trial' AND user_id IN (SELECT id FROM auth.users WHERE email = ANY(target_emails)));
END $$;
```

---

## Configuration

### Change Trial Duration

Modify the `trial_days` variable:

- **1 day** (fast testing): `trial_days INTEGER := 1;`
- **3 days** (quick testing): `trial_days INTEGER := 3;`
- **7 days** (standard): `trial_days INTEGER := 7;`
- **14 days** (extended): `trial_days INTEGER := 14;`

### Change Target Accounts

Modify the `target_emails` array:

```sql
-- Single account
target_emails TEXT[] := ARRAY['cameroncons@icloud.com'];

-- Multiple accounts
target_emails TEXT[] := ARRAY['cameroncons@icloud.com', 'test@trilo.app', 'another@example.com'];

-- All accounts (use with caution!)
-- See "Reset All Trials" section below
```

---

## Verification Query

After running the reset script, verify it worked:

```sql
-- Check trial status for specific users
SELECT 
  u.email,
  us.status,
  us.trial_start,
  us.trial_end,
  EXTRACT(DAY FROM (us.trial_end - NOW())) AS days_remaining,
  us.updated_at
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.email IN ('cameroncons@icloud.com', 'test@trilo.app')
ORDER BY u.email;
```

**Expected Results:**
- `status` should be `'trial'`
- `trial_start` should be recent (within last minute)
- `trial_end` should be `trial_start + trial_days`
- `days_remaining` should match your configured `trial_days`

---

## Common Use Cases

### 1. Fast Testing (1-day trial)

Use this when you need to quickly test trial expiration:

```sql
DO $$
DECLARE
  trial_days INTEGER := 1;  -- 1 day trial
  target_emails TEXT[] := ARRAY['cameroncons@icloud.com', 'test@trilo.app'];
BEGIN
  UPDATE user_subscriptions
  SET 
    trial_start = NOW(),
    trial_end = NOW() + (trial_days || ' days')::INTERVAL,
    status = 'trial',
    updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = ANY(target_emails)
  );
  
  RAISE NOTICE 'Trials reset to 1 day for test accounts';
END $$;
```

### 2. Quick Testing (3-day trial)

Use this for a balance between speed and realistic testing:

```sql
DO $$
DECLARE
  trial_days INTEGER := 3;  -- 3 day trial
  target_emails TEXT[] := ARRAY['cameroncons@icloud.com', 'test@trilo.app'];
BEGIN
  UPDATE user_subscriptions
  SET 
    trial_start = NOW(),
    trial_end = NOW() + (trial_days || ' days')::INTERVAL,
    status = 'trial',
    updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = ANY(target_emails)
  );
  
  RAISE NOTICE 'Trials reset to 3 days for test accounts';
END $$;
```

### 3. Standard Testing (7-day trial)

Use this for standard testing scenarios:

```sql
DO $$
DECLARE
  trial_days INTEGER := 7;  -- 7 day trial (standard)
  target_emails TEXT[] := ARRAY['cameroncons@icloud.com', 'test@trilo.app'];
BEGIN
  UPDATE user_subscriptions
  SET 
    trial_start = NOW(),
    trial_end = NOW() + (trial_days || ' days')::INTERVAL,
    status = 'trial',
    updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = ANY(target_emails)
  );
  
  RAISE NOTICE 'Trials reset to 7 days for test accounts';
END $$;
```

### 4. Reset Single Account

Reset trial for just one account:

```sql
DO $$
DECLARE
  trial_days INTEGER := 7;
  target_emails TEXT[] := ARRAY['cameroncons@icloud.com'];  -- Single account
BEGIN
  UPDATE user_subscriptions
  SET 
    trial_start = NOW(),
    trial_end = NOW() + (trial_days || ' days')::INTERVAL,
    status = 'trial',
    updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = ANY(target_emails)
  );
  
  RAISE NOTICE 'Trial reset for single account';
END $$;
```

### 5. Create Subscription if Missing

If a user doesn't have a subscription record yet, create one:

```sql
DO $$
DECLARE
  trial_days INTEGER := 7;
  target_emails TEXT[] := ARRAY['cameroncons@icloud.com', 'test@trilo.app'];
  user_id UUID;
BEGIN
  -- Loop through target emails
  FOR user_id IN 
    SELECT id FROM auth.users WHERE email = ANY(target_emails)
  LOOP
    -- Insert or update subscription
    INSERT INTO user_subscriptions (
      user_id,
      status,
      trial_start,
      trial_end,
      updated_at
    ) VALUES (
      user_id,
      'trial',
      NOW(),
      NOW() + (trial_days || ' days')::INTERVAL,
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      trial_start = NOW(),
      trial_end = NOW() + (trial_days || ' days')::INTERVAL,
      status = 'trial',
      updated_at = NOW();
  END LOOP;
  
  RAISE NOTICE 'Trials created/updated for % users', array_length(target_emails, 1);
END $$;
```

### 6. Reset All Expired Trials

Reset all accounts with expired trials:

```sql
DO $$
DECLARE
  trial_days INTEGER := 7;
  updated_count INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET 
    trial_start = NOW(),
    trial_end = NOW() + (trial_days || ' days')::INTERVAL,
    status = 'trial',
    updated_at = NOW()
  WHERE status = 'expired' 
    OR (status = 'trial' AND trial_end < NOW());
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Trials reset for % expired accounts', updated_count;
END $$;
```

---

## Troubleshooting

### Account Not Found

**Problem:** Script runs but no rows are updated.

**Solution:** Verify the email exists in `auth.users`:

```sql
-- Check if email exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('cameroncons@icloud.com', 'test@trilo.app');
```

**If email doesn't exist:**
- Verify the email address spelling
- Check if the account was created in Supabase
- Use the exact email address from the sign-up

### Subscription Record Missing

**Problem:** User exists but has no subscription record.

**Solution:** Use the "Create Subscription if Missing" script (Common Use Case #5) above.

### Status Not Updating

**Problem:** Trial reset but status still shows 'expired'.

**Solution:** Check for conflicting conditions:

```sql
-- Check current subscription status
SELECT 
  u.email,
  us.status,
  us.trial_start,
  us.trial_end,
  CASE 
    WHEN us.trial_end < NOW() THEN 'EXPIRED'
    WHEN us.trial_end >= NOW() THEN 'ACTIVE'
    ELSE 'UNKNOWN'
  END AS trial_status_check
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.email IN ('cameroncons@icloud.com', 'test@trilo.app');
```

**If still expired:** Run the reset script again and verify `trial_end` is in the future.

### RevenueCat Sync Issues

**Note:** This script only updates Supabase. RevenueCat data is not modified directly.

**After reset:**
1. Open the app and sign in with the test account
2. The app will call `checkAccess()` which syncs with Supabase
3. Trial status should update in the app

**If trial doesn't show in app:**
- Force quit and reopen the app
- Sign out and sign back in
- Check that `SubscriptionContext` is calling `checkAccess()` on mount

---

## Important Notes

### App Sync

- The app syncs subscription status when `checkAccess()` is called
- This happens automatically when:
  - User signs in
  - App starts (if user is logged in)
  - User navigates to a subscription-gated screen

### RevenueCat

- This script **only updates Supabase**
- RevenueCat entitlements are managed separately
- For testing, Supabase status is sufficient (app checks Supabase first)
- RevenueCat will sync on next subscription purchase

### Testing Workflow

1. Reset trial using this script
2. Sign in to the app with test account
3. App syncs trial status from Supabase
4. Test trial features
5. Wait for trial to expire OR reset again to continue testing

### Security

- This script respects RLS policies
- Only works when run in Supabase SQL Editor (uses service role)
- Users cannot reset their own trials via the app
- Always verify email addresses before running

---

## Quick Reference

### Default Accounts
- `cameroncons@icloud.com`
- `test@trilo.app`

### Default Trial Duration
- **7 days** (standard)
- **1 day** (fast testing)
- **3 days** (quick testing)

### Table Structure
```sql
user_subscriptions (
  user_id UUID PRIMARY KEY,
  status TEXT,  -- 'trial', 'active', 'expired', 'freeAccess'
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

