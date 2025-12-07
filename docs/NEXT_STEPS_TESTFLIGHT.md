# Next Steps for TestFlight Deployment

## ✅ Completed Must-Fix Items

1. **✅ ErrorBoundary Added**: Wrapped root layout with ErrorBoundary to catch top-level crashes
2. **✅ Console Logs Cleaned**: All console.log statements in FinanceContext replaced with conditional logging via `utils/logger.ts`

## 📋 Pre-Deployment Checklist

Before building and submitting to TestFlight, complete these steps:

### 1. Final Testing (Recommended)

Test the following in development/Expo Go:
- [ ] Add a transaction - verify it syncs to Supabase
- [ ] Update a transaction - verify sync works
- [ ] Delete a transaction - verify deletion syncs
- [ ] Sign out and sign in as different user - verify data isolation
- [ ] Test error boundary - intentionally crash app to see error UI

### 2. Verify Environment Variables

Check that all required variables are set in `app.json`:
- [x] `supabaseUrl` - Set
- [x] `supabaseAnonKey` - Set
- [x] `plaidApiUrl` - Set
- [x] `revenueCatApiKeyIos` - Set (`appl_KYJdeAHerYQeEgWWYLlFZVhXQBH`)
- [ ] **Verify** RevenueCat iOS key matches your RevenueCat dashboard (see `docs/REVENUECAT_KEY_VERIFICATION.md`)

### 3. Build Configuration

Verify `eas.json` is configured correctly:
- [x] Production profile exists
- [x] Auto-increment enabled

Verify `app.json`:
- [x] Version: 1.0.1
- [x] iOS buildNumber: 2
- [x] Bundle identifier: `app.ios-trilo`

### 4. Backend Configuration (Railway)

Ensure backend environment variables are set:
- [ ] `PLAID_ENV=sandbox` (for TestFlight)
- [ ] `PLAID_CLIENT_ID` - Set
- [ ] `PLAID_SECRET` - Set
- [ ] `SUPABASE_URL` - Set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set
- [ ] Backend is deployed and accessible

### 5. TestFlight-Specific

Prepare for TestFlight:
- [ ] **TestFlight Release Notes**: Prepare what's new in this build
- [ ] **Beta Testing Instructions**: Prepare instructions for testers
- [ ] **Known Issues**: Document any known issues

## 🚀 Deployment Steps

### Step 0: Verify RevenueCat Key (Optional but Recommended)

**Quick Check**:
1. Go to https://app.revenuecat.com
2. Select your project → Project Settings → API Keys
3. Compare iOS key with: `appl_KYJdeAHerYQeEgWWYLlFZVhXQBH`
4. If they match: ✅ You're good!
5. If different: Update in `app.json` (see `docs/REVENUECAT_KEY_VERIFICATION.md`)

**Note**: For TestFlight, sandbox mode works automatically, so even if the key isn't perfect, it should still work for testing.

### Step 1: Build for TestFlight

```bash
# Make sure you're in the project root
eas build --platform ios --profile production
```

**What happens:**
- Builds app on EAS servers (~15-20 minutes)
- Creates production build optimized for TestFlight
- Version: 1.0.1, Build: 2

### Step 2: Submit to TestFlight (Updates Existing App)

After build completes:

```bash
eas submit --platform ios --latest
```

**What happens:**
- ✅ **Updates your existing TestFlight app** (not a replacement!)
- ✅ Testers will see an update notification
- ✅ Uploads new build to App Store Connect
- ✅ Processes for TestFlight (~10-30 minutes)
- ✅ Appears as a new build version in TestFlight
- ✅ Testers can update via TestFlight app

**Important**: 
- This **updates** your existing TestFlight app, not replaces it
- Testers don't need to reinstall
- They'll see "Update" button in TestFlight app
- Much easier than replacing the app!

### Step 3: Configure TestFlight

1. **Go to App Store Connect**:
   - https://appstoreconnect.apple.com
   - Select your app → TestFlight

2. **Add TestFlight Information**:
   - **What's New**: Brief description of changes
   - **Beta App Description**: What testers should know
   - **Feedback Email**: Your email for tester feedback

3. **Add Testers**:
   - Internal testers (up to 100)
   - External testers (up to 10,000) - requires Beta Review

### Step 4: Test the Build

Once available in TestFlight:
- [ ] Install on your device via TestFlight app
- [ ] Test core functionality
- [ ] Verify data syncs to Supabase
- [ ] Check error handling
- [ ] Test with sandbox accounts (Plaid, RevenueCat)

## 📝 TestFlight Release Notes Template

**What's New in This Version (1.0.1, Build 2):**

- ✅ Improved error handling with ErrorBoundary
- ✅ Optimized performance (removed production console logs)
- ✅ Fixed initial load display issue on Overview tab
- ✅ Enhanced data synchronization with Supabase
- ✅ User data properly isolated per account

**For Testers:**
- Use sandbox accounts for Plaid and RevenueCat testing
- Report any crashes or issues you encounter
- Data syncs to cloud automatically

## 🐛 Known Issues (if any)

Document any known issues:
- None at this time

## ⚠️ Important Notes for TestFlight

1. **Sandbox Mode**: Plaid and RevenueCat will use sandbox/test modes - this is correct
2. **No Production Credentials**: Don't switch to production credentials until final App Store submission
3. **Test Data**: Testers will use sandbox/test data
4. **Feedback**: Monitor TestFlight feedback and crash reports

## 🔍 Monitoring After Deployment

1. **TestFlight Crash Reports**:
   - App Store Connect → Your App → TestFlight → Crashes
   - Review any crash reports from testers

2. **ErrorBoundary Logs**:
   - Check Metro console for error boundary catches
   - Errors will show "App failed to load" screen

3. **Supabase Dashboard**:
   - Monitor user_transactions table
   - Verify data is syncing correctly
   - Check for any errors

## 📊 Success Criteria

TestFlight is successful if:
- [ ] Build installs and launches without crashes
- [ ] Users can sign up/sign in
- [ ] Transactions sync to Supabase
- [ ] Data is isolated per user
- [ ] No critical bugs reported
- [ ] ErrorBoundary catches errors gracefully (if any occur)

## 🎯 Post-TestFlight Actions

After TestFlight testing:

1. **Collect Feedback**: Gather tester feedback
2. **Fix Issues**: Address any bugs found
3. **Iterate**: Make improvements based on feedback
4. **Plan Production**: Prepare for App Store submission

## 💡 Optional Enhancements (Future)

Consider adding these after TestFlight:
- Sentry for crash reporting
- Analytics for usage tracking
- User feedback mechanism
- Offline sync queue
- Sync status indicator in UI

---

## Quick Commands Reference

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest

# Check build status
eas build:list

# View logs
eas build:view [BUILD_ID]
```

---

**Ready to deploy?** Run the commands above when ready! 🚀

