# Quick Start: User Data Migration

## The Problem
Currently, data is stored locally and NOT tied to user accounts. If two people use the same phone, they see each other's data.

## The Solution
Store data in Supabase with `user_id` foreign keys so each user only sees their own data.

## What You Need to Do RIGHT NOW

### Option 1: Wait for Supabase to Come Back Online (Recommended)

The Supabase instance at `https://aputbauyuhhcsrnpwacb.supabase.co` is currently returning 503 errors.

**Steps:**
1. Check Supabase status: https://status.supabase.com
2. Wait for it to come back online
3. Then run the SQL from `docs/SUPABASE_SETUP.md` in your Supabase dashboard

### Option 2: Use a Different Supabase Instance

If you need to proceed now:

1. **Create a new Supabase project:**
   - Go to https://supabase.com
   - Create new project
   - Get your URL and API key

2. **Update credentials in `app.json`:**
   ```json
   "supabaseUrl": "https://your-new-project.supabase.co",
   "supabaseAnonKey": "your-new-anon-key"
   ```

3. **Run the SQL from `docs/SUPABASE_SETUP.md`**

4. **Restart the app**

### Option 3: Continue with Local Storage (Temporary)

For now, with the test account:
- Data stays on the device
- Multiple test users would share data
- Good for demos/testing
- Not production-ready

## What Files Need Changes

To make data user-specific, update these files:

1. **`context/FinanceContext.tsx`**
   - Add `useAuth()` hook
   - Include `userId` in all storage keys
   - Change from `'finance_transactions_v2'` to `'finance_transactions_v2_' + userId`

2. **`context/SettingsContext.tsx`**
   - Same changes for settings

3. **`context/SavingsContext.tsx`**
   - Same changes for savings goals

## Current Workaround

The test account (`test@trilo.app`) works because of the fallback logic in `context/AuthContext.tsx`:
- Creates a mock session
- Works without Supabase
- Data is local-only (per device)

## Summary

**Current State:**
- ❌ Data not in Supabase
- ❌ Data not user-specific
- ❌ Multiple users share data
- ✅ App works with test account
- ✅ Data stored locally on device

**Needed Changes:**
1. Supabase comes back online OR create new project
2. Run SQL to create tables
3. Update storage keys to include userId
4. Implement sync service
5. Test with real Supabase connection

## To Answer Your Question Directly

**"Is user data stored in Supabase tables?"**
- No, not yet. Tables are prepared but Supabase is down.

**"Is data user-specific?"**
- No, currently all users on a device share the same data.

**"When user signs in and adds data, is it only visible to them?"**
- No, currently anyone who uses the device can see all data.

**Solution:** Once Supabase is online and we update the storage keys to include `user_id`, then each user will have isolated data.

