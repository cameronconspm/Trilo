# RevenueCat Troubleshooting - TestFlight Issues

## Issue: "Unable to load subscription plans" in TestFlight

If you see the error message "Unable to load subscription plans. Please check your connection and try again" in the paywall modal, follow these steps:

---

## 🔍 Diagnostic Steps

### 1. Check RevenueCat Dashboard Configuration

**Most Common Issue**: No "Current" Offering Set

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Navigate to: **Products** → **Offerings**
3. **Critical**: Ensure one offering is marked as **"Current"**
   - Only the "Current" offering is returned by `getOfferings()`
   - If no offering is set as current, packages will be empty
4. Verify your offering contains packages with identifiers that include:
   - Monthly: `monthly`, `month`, `$rc_monthly`, or package type `MONTHLY`
   - Annual: `annual`, `year`, `yearly`, `$rc_annual`, or package type `ANNUAL`

### 2. Verify Products are Configured

1. Go to **Products** → **All Products**
2. Ensure you have:
   - Monthly subscription product (e.g., `monthly_subscription`)
   - Annual subscription product (e.g., `annual_subscription`)
3. Products must be:
   - Created in App Store Connect
   - Added to RevenueCat
   - Connected to an Offering

### 3. Check API Key

1. In RevenueCat Dashboard: **Project Settings** → **API Keys**
2. Verify iOS API Key matches `app.json`:
   ```json
   "revenueCatApiKeyIos": "appl_KYJdeAHerYQeEgWWYLlFZVhXQBH"
   ```
3. Ensure you're using the **production** key (not sandbox) for TestFlight

### 4. Verify Entitlements

1. Go to **Entitlements**
2. Ensure `premium_access` entitlement exists
3. Verify entitlement is attached to your products

### 5. Check App Store Connect

1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to your app → **In-App Purchases**
3. Verify subscription products are:
   - Created and approved
   - Status: **Ready to Submit** or **Approved**

---

## 🛠️ Fixes Applied in Code

The following improvements have been made to help diagnose and fix issues:

### Enhanced Logging

- Added detailed console logs for:
  - RevenueCat initialization
  - Package fetching
  - Offerings retrieval
  - Error details

### Package Matching

- Expanded package identifier matching to include:
  - `monthly`, `month`, `$rc_monthly`
  - `annual`, `year`, `yearly`, `$rc_annual`
  - Package type matching (`MONTHLY`, `ANNUAL`)

### Retry Logic

- Automatic retry if RevenueCat not initialized
- Delayed loading to ensure initialization completes
- Error-specific retry logic

---

## 📋 TestFlight Checklist

Before testing in TestFlight:

- [ ] RevenueCat dashboard has a "Current" offering set
- [ ] Monthly and Annual products exist in RevenueCat
- [ ] Products are connected to the Current offering
- [ ] Products exist in App Store Connect (In-App Purchases)
- [ ] API key in `app.json` matches RevenueCat dashboard
- [ ] `premium_access` entitlement is configured
- [ ] TestFlight build uses sandbox App Store account

---

## 🧪 Testing in TestFlight

### Using Sandbox Account

1. **Sign Out** of your Apple ID in Settings → App Store
2. Open TestFlight app
3. Install/Update Trilo
4. When prompted, sign in with **sandbox test account** (created in App Store Connect)
5. Open Trilo → Sign in
6. Open paywall modal → Verify packages appear

### Check Console Logs

If testing on a physical device:
1. Connect device to Mac
2. Open **Console.app** (macOS)
3. Filter by "Trilo" or "RevenueCat"
4. Look for logs starting with:
   - `📦 Loading subscription packages...`
   - `✅ RevenueCat initialized successfully`
   - `⚠️ No current offering found` (if error)

---

## 🔧 Quick Fixes

### Fix 1: Set Current Offering (Most Common)

1. RevenueCat Dashboard → **Products** → **Offerings**
2. Find your offering (or create one)
3. Click **"Set as Current"**
4. Wait 1-2 minutes for propagation
5. Re-test in app

### Fix 2: Verify Package Identifiers

1. RevenueCat Dashboard → **Products** → **Offerings** → Your Offering
2. Check package identifiers:
   - Monthly package ID should contain: `monthly`, `month`, or be type `MONTHLY`
   - Annual package ID should contain: `annual`, `year`, `yearly`, or be type `ANNUAL`
3. Update identifiers if needed

### Fix 3: Check API Key

Verify `app.json` has correct key:
```json
"extra": {
  "revenueCatApiKeyIos": "appl_YOUR_KEY_HERE"
}
```

### Fix 4: Rebuild with Latest Code

The latest code includes:
- Enhanced error logging
- Better package matching
- Retry logic

Rebuild and test:
```bash
eas build --platform ios --profile production --auto-submit
```

---

## 📞 Still Not Working?

If packages still don't load after checking everything:

1. **Check RevenueCat Dashboard → Debugging → Events**
   - Look for errors or failed requests
   - Verify app is making requests to RevenueCat

2. **Verify Sandbox Environment**
   - TestFlight automatically uses sandbox
   - Ensure you're signed in with sandbox account

3. **Check Network**
   - RevenueCat requires internet connection
   - Verify device has connectivity

4. **Review Logs**
   - Check device console for detailed error messages
   - Look for specific RevenueCat error codes

---

## Common Error Codes

- **No Current Offering**: No offering marked as "Current" in dashboard
- **No Packages**: Offering exists but has no packages attached
- **API Key Mismatch**: Wrong API key in `app.json`
- **Network Error**: Connection issues or timeout
- **Not Initialized**: RevenueCat SDK not properly initialized

---

## Expected Console Output (Success)

```
🔧 Initializing RevenueCat with API key: appl_KYJd...
✅ RevenueCat initialized successfully
✅ RevenueCat app user ID: $RCAnonymousID:xxxxx
📦 Loading subscription packages... (attempt 1)
📦 Fetching offerings from RevenueCat...
📦 Offerings received: { hasCurrent: true, allOfferings: 1, currentIdentifier: 'default' }
📦 Available packages: { count: 2, identifiers: ['$rc_monthly', '$rc_annual'] }
📦 Package matching results: { totalPackages: 2, foundMonthly: true, foundAnnual: true, ... }
📦 Packages loaded: { hasMonthly: true, hasAnnual: true, ... }
```

---

## Expected Console Output (Failure)

```
⚠️ RevenueCat not initialized yet, waiting...
📦 Loading subscription packages... (attempt 2)
⚠️ No current offering found. Available offerings: []
⚠️ Check RevenueCat dashboard: Products → Offerings → Set "Current" offering
⚠️ No subscription packages found. Possible issues:
   1. RevenueCat not initialized properly
   2. No offerings configured in RevenueCat dashboard
   3. Package identifiers not matching
   4. Offerings not set as "Current" in RevenueCat dashboard
```

Use these logs to identify the specific issue!

