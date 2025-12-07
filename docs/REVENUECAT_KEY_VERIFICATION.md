# RevenueCat iOS Key Verification

## Quick Answer

Your current key: `appl_KYJdeAHerYQeEgWWYLlFZVhXQBH`

This doesn't look like a placeholder (no "YOUR_" or "_HERE"), but **you should verify it's your actual key** from RevenueCat.

## How to Verify/Find Your Key

### Step 1: Go to RevenueCat Dashboard

1. Visit: https://app.revenuecat.com
2. Log in with your RevenueCat account
3. Select your project: **Trilo**

### Step 2: Find API Keys

1. In the left sidebar, click: **Project Settings**
2. Click: **API Keys** (in the Project Settings menu)
3. Look for the **iOS API Key** section
4. You'll see a key that starts with `appl_`

### Step 3: Compare with Your Current Key

**If the key in RevenueCat matches `appl_KYJdeAHerYQeEgWWYLlFZVhXQBH`:**
- ✅ You're all set! No changes needed
- The key is already configured correctly

**If the key in RevenueCat is different:**
- ⚠️ You need to update your key
- Copy the key from RevenueCat dashboard
- Update it in `app.json` (see below)

**If you don't have a RevenueCat account yet:**
- Create one at https://app.revenuecat.com
- Create a new project
- Get your keys from Project Settings > API Keys

## Update the Key (If Needed)

### Option 1: Update in app.json (Recommended)

Edit `app.json`:

```json
{
  "expo": {
    "extra": {
      "revenueCatApiKeyIos": "appl_YOUR_ACTUAL_KEY_FROM_REVENUECAT"
    }
  }
}
```

### Option 2: Update in lib/revenuecat.ts

Edit `lib/revenuecat.ts` line 34:

```typescript
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_ACTUAL_KEY_FROM_REVENUECAT';
```

**Note**: The `app.json` method is preferred because it keeps keys in one place.

## Important Notes

### For TestFlight (Current Situation):
- ✅ **Sandbox mode works automatically**
- ✅ You can test subscriptions without production keys
- ✅ The key you have should work for TestFlight testing

### For Production App Store:
- ⚠️ You'll need to verify the key is a production key
- ⚠️ RevenueCat has separate sandbox and production environments
- ⚠️ TestFlight uses sandbox, so current key should work

## Quick Check: Is My Key Working?

1. **Build your app** for TestFlight
2. **Test subscription flow**:
   - Sign up as new user
   - See if paywall appears
   - Try to purchase (will use sandbox)
3. **If it works**: Your key is correct ✅
4. **If it doesn't**: Check RevenueCat dashboard for the correct key

## Where to Find RevenueCat Keys (Visual Guide)

```
RevenueCat Dashboard
  └── Your Project (Trilo)
      └── Project Settings (left sidebar)
          └── API Keys
              ├── iOS API Key: appl_XXXXXXXXXX  ← Copy this
              └── Android API Key: goog_XXXXXXXXXX
```

---

**Bottom Line**: 
- If you already have a RevenueCat account and project → Check if your current key matches
- If you don't have RevenueCat account → Create one and get your keys
- For TestFlight → Current setup should work (sandbox mode)

