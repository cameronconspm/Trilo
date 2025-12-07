# TestFlight Deployment Instructions - Subscription Features

## 🎯 What's New in This Build

### Subscription Management Updates
- ✅ **Banner Dismissal Logic**: Banner can be dismissed during trial, but reappears on app open until plan activated
- ✅ **Blocking Paywall**: When trial expires without subscription, blocking modal appears (cannot be dismissed)
- ✅ **Subscription Profile Section**: Expanded subscription info with plan management
- ✅ **Show Plans Button**: Quick access to subscription plans from profile
- ✅ **Trial Status**: Shows remaining days and activation requirements

---

## 📋 Pre-Build Checklist

### 1. Verify Code Changes
- [x] Subscription banner dismissal logic updated
- [x] Blocking paywall modal created
- [x] Profile subscription section enhanced
- [x] All TypeScript errors resolved

### 2. Version & Build Number
Check `app.json`:
```json
"version": "1.0.1",
"ios": {
  "buildNumber": "2"
}
```
**Note**: EAS will auto-increment build number if needed.

### 3. Environment Variables
Verify in `app.json`:
- [x] RevenueCat iOS API Key is set
- [x] Supabase credentials are set
- [x] Plaid configuration is correct

### 4. RevenueCat Configuration
- [x] Verify products are configured in RevenueCat dashboard
- [x] Monthly and Annual packages are active
- [x] Entitlements (`premium_access`) are set up

---

## 🚀 Deployment Steps

### Step 1: Build for TestFlight

**Recommended: Use auto-submit (builds AND submits in one command)**

```bash
cd /Users/cameroncons/Trilo
eas build --platform ios --profile production --auto-submit
```

**Alternative: Build then submit separately**

```bash
# Step 1: Build
eas build --platform ios --profile production

# Step 2: Submit (after build completes)
eas submit --platform ios --latest
```

**What Happens:**
- Build starts on EAS servers (~15-20 minutes)
- Build creates optimized production IPA
- Auto-submit uploads to App Store Connect
- Apple processes for TestFlight (~10-30 minutes)
- Build appears in TestFlight

**Monitor Build Progress:**
```bash
# Check build status
eas build:list

# Or visit dashboard
https://expo.dev/accounts/cameroncons/projects/trilo/builds
```

### Step 2: Configure TestFlight (App Store Connect)

1. **Go to App Store Connect**
   - Visit: https://appstoreconnect.apple.com
   - Select "Trilo" → "TestFlight"

2. **Add TestFlight Information**
   
   **Beta App Description:**
   ```
   Trilo - Personal Finance Management
   
   Track income, expenses, and savings goals. Plan spending, stay within budget, and build better financial habits.
   
   New in this build:
   - Enhanced subscription management
   - Improved trial period handling
   - Better subscription activation flow
   - Profile subscription section with plan management
   ```

   **What to Test:**
   ```
   🔑 Test Account: test@trilo.app / test123456
   
   Priority Testing:
   1. Subscription Banner: 
      - Dismiss during trial → Should reappear on next app open
      - Activate subscription → Banner can be permanently dismissed
   
   2. Trial Expiration:
      - After trial ends without subscription → Blocking paywall appears
      - Cannot dismiss blocking paywall → Must activate subscription
      - After activation → Full app access restored
   
   3. Profile Subscription Section:
      - Expand subscription section → See trial status/renewal date
      - "Show Plans" button → Opens paywall modal
      - Plan management (upgrade/downgrade/cancel) → For active subscriptions
   
   4. Core Features:
      - Sign up/Sign in
      - Add transactions
      - View insights
      - Bank connection (sandbox)
   ```

3. **Add Testers**
   - Internal testers (up to 100) - immediate access
   - External testers (up to 10,000) - requires Beta Review

---

## 🧪 Testing Guide

### Critical Test Scenarios

#### 1. Subscription Banner Behavior

**Test: Banner Dismissal During Trial**
- [ ] Sign in with test account (in trial)
- [ ] Go to Overview tab → See subscription banner
- [ ] Tap X to dismiss banner → Banner disappears
- [ ] Close app completely → Reopen app
- [ ] **Expected**: Banner reappears on Overview tab
- [ ] **Result**: ✅ Pass / ❌ Fail

**Test: Banner After Subscription Activation**
- [ ] Activate subscription (sandbox purchase)
- [ ] Dismiss banner with X button
- [ ] Close app → Reopen app
- [ ] **Expected**: Banner stays dismissed
- [ ] **Result**: ✅ Pass / ❌ Fail

#### 2. Blocking Paywall (Trial Expired)

**Test: Expired Trial Without Subscription**
- [ ] Use test account where trial has expired (or wait for expiration)
- [ ] **Expected**: Blocking paywall modal appears immediately
- [ ] Try to tap outside modal → Should not close
- [ ] Try to swipe down → Should not close
- [ ] **Result**: ✅ Pass / ❌ Fail

**Test: Activate Subscription from Blocking Paywall**
- [ ] In blocking paywall modal
- [ ] Select plan (Monthly or Annual)
- [ ] Tap "Activate Subscription"
- [ ] Complete sandbox purchase
- [ ] **Expected**: 
  - Modal closes automatically
  - Full app access restored
  - Status changes to 'active'
- [ ] **Result**: ✅ Pass / ❌ Fail

#### 3. Profile Subscription Section

**Test: View Subscription Info**
- [ ] Go to Profile tab
- [ ] Scroll to Account section
- [ ] Tap "Subscription" to expand
- [ ] **Expected**: 
  - Shows trial status (if in trial)
  - Shows renewal date (if active)
  - Shows price information
- [ ] **Result**: ✅ Pass / ❌ Fail

**Test: Show Plans Button**
- [ ] In Profile → Subscription section (expanded)
- [ ] Tap "Show Plans" button
- [ ] **Expected**: Paywall modal opens with plans
- [ ] Select plan and purchase
- [ ] **Result**: ✅ Pass / ❌ Fail

**Test: Plan Management (Active Subscription)**
- [ ] With active subscription
- [ ] In Profile → Subscription section
- [ ] **Expected**: 
  - "Upgrade to Annual" or "Switch to Monthly" buttons visible
  - "Cancel Subscription" button visible
  - "Manage in Settings" opens system subscription settings
- [ ] **Result**: ✅ Pass / ❌ Fail

#### 4. Trial Flow End-to-End

**Test: Complete Trial to Subscription Flow**
1. [ ] Create new account → Get 7-day trial
2. [ ] Dismiss banner → Verify it reappears on next open
3. [ ] Wait for trial to expire (or manually expire in backend)
4. [ ] Open app → Blocking paywall appears
5. [ ] Activate subscription from blocking paywall
6. [ ] Verify full app access
7. [ ] Dismiss banner → Verify it stays dismissed
8. [ ] **Result**: ✅ Pass / ❌ Fail

---

## 🐛 Known Issues to Document (If Any)

If you encounter any issues during testing, document them here:

**Example:**
```
Issue: [Description]
Steps to Reproduce: [Steps]
Expected: [What should happen]
Actual: [What actually happened]
Device: [iPhone model, iOS version]
```

---

## ✅ Testing Checklist Summary

Before marking build as ready:

- [ ] Subscription banner dismissal works correctly
- [ ] Banner reappears on app open during trial (if dismissed)
- [ ] Banner stays dismissed after subscription activation
- [ ] Blocking paywall appears when trial expires
- [ ] Blocking paywall cannot be dismissed
- [ ] Subscription can be activated from blocking paywall
- [ ] Profile subscription section displays correctly
- [ ] "Show Plans" button works
- [ ] Plan management options work (for active subscriptions)
- [ ] Core app functionality works (transactions, insights, etc.)
- [ ] Bank connection works (sandbox)
- [ ] Data syncs correctly

---

## 📞 Support During Testing

**If testers encounter issues:**
1. Check TestFlight crash logs in App Store Connect
2. Review error logs from RevenueCat dashboard
3. Check backend logs (Railway) for API errors
4. Verify test accounts are set up correctly

**Common Issues & Solutions:**

**Issue**: Blocking paywall doesn't appear after trial expires
- **Solution**: Check subscription status in RevenueCat dashboard
- **Solution**: Verify trial end date in Supabase

**Issue**: "Show Plans" button doesn't work
- **Solution**: Check PaywallModal import
- **Solution**: Verify RevenueCat packages are loading

**Issue**: Subscription activation fails
- **Solution**: Verify RevenueCat sandbox mode is active
- **Solution**: Check test Apple account has sandbox enabled

---

## 🎉 Next Steps After Testing

Once testing is complete:

1. **Review Feedback**: Collect feedback from testers
2. **Fix Critical Issues**: Address any blocking bugs
3. **Prepare Production Build**: Once stable, prepare for App Store submission
4. **Document Changes**: Update release notes for production

---

## Quick Command Reference

```bash
# Build and submit (recommended)
eas build --platform ios --profile production --auto-submit

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Submit existing build
eas submit --platform ios --latest

# Login to EAS
eas login

# Check EAS configuration
eas build:configure
```

---

**Good luck with testing! 🚀**

