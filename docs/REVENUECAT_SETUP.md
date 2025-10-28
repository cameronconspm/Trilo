# RevenueCat Setup Guide

This guide will help you set up in-app subscriptions with RevenueCat for Trilo.

## Overview

- **RevenueCat SDK**: Handles Apple/Google billing, renewals, and entitlements
- **Free Trial**: 7 days for all new users
- **Subscription Plans**: Monthly and Annual
- **Test Users**: Bypass subscription with free access emails
- **Backend Sync**: Supabase stores subscription status and syncs via webhooks

---

## Step 1: Create RevenueCat Account

1. Go to https://app.revenuecat.com
2. Sign up for a free account
3. Create a new project: **Trilo**

---

## Step 2: Get API Keys

1. Go to **Project Settings > API Keys**
2. Copy your API keys:
   - **iOS API Key**: `appl_XXXXXXXXXX`
   - **Android API Key**: `goog_XXXXXXXXXX`
3. Update `lib/revenuecat.ts` with your keys:

```typescript
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_KEY_HERE';
```

Or add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "revenueCatApiKeyIos": "appl_YOUR_IOS_KEY_HERE",
      "revenueCatApiKeyAndroid": "goog_YOUR_ANDROID_KEY_HERE"
    }
  }
}
```

---

## Step 3: Create Entitlement

1. In RevenueCat dashboard, go to **Products > Entitlements**
2. Click **Add Entitlement**
3. Name it: `premium_access`
4. Click **Save**

---

## Step 4: Create Products in App Store Connect

### iOS (App Store Connect)

1. Go to https://appstoreconnect.apple.com
2. Select your app: **Trilo**
3. Go to **Features > In-App Purchases**
4. Click **+** to create subscriptions:

#### Annual Product
- **Product ID**: `com.trilo.annual`
- **Type**: Auto-Renewable Subscription
- **Subscription Duration**: 1 Year
- **Price**: $XX.XX/year
- **Free Trial**: 7 days

#### Monthly Product
- **Product ID**: `com.trilo.monthly`
- **Type**: Auto-Renewable Subscription
- **Subscription Duration**: 1 Month
- **Price**: $X.XX/month

#### Subscription Group
1. Create a subscription group: **Trilo Premium**
2. Add both products to this group
3. Set Annual as the recommended offer

---

## Step 5: Create Products in Google Play Console

### Android (Google Play Console)

1. Go to https://play.google.com/console
2. Select your app: **Trilo**
3. Go to **Monetize > Subscriptions**
4. Click **Create subscription**:

#### Annual Product
- **Product ID**: `com.trilo.annual`
- **Billing Period**: 1 Year
- **Price**: $XX.XX/year
- **Free Trial**: 7 days

#### Monthly Product
- **Product ID**: `com.trilo.monthly`
- **Billing Period**: 1 Month
- **Price**: $X.XX/month

---

## Step 6: Configure RevenueCat Products

1. In RevenueCat dashboard, go to **Products**
2. Click **Add Product**
3. Select your App Store Connect products:
   - `com.trilo.monthly`
   - `com.trilo.annual`
4. Attach to entitlement: `premium_access`

For Google Play:
1. Go to **Products**
2. Click **Add Product** for Android
3. Select your Google Play products
4. Attach to entitlement: `premium_access`

---

## Step 7: Create Offering

1. In RevenueCat dashboard, go to **Offerings**
2. Click **Create Offering**
3. Name it: `default`
4. Add packages:
   - **Package 1**: Identifier `annual` → Product `com.trilo.annual`
   - **Package 2**: Identifier `monthly` → Product `com.trilo.monthly`
5. Set as **Current Offering**

---

## Step 8: Install and Test

```bash
npm install
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

### Sandbox Testing

iOS:
1. Use sandbox tester account in Settings > App Store > Sandbox Account
2. Test with "Test@trilo.app" or create new test user

Android:
1. Add test email in Google Play Console > License Testing
2. Test purchases in sandbox mode

---

## Step 9: Update Supabase Schema

Run the SQL script to add subscription tracking:

```bash
cd supabase_schema.sql
# Copy contents and run in Supabase SQL Editor
```

This creates:
- `user_subscriptions` table
- `status` field (trial, active, expired, freeAccess)
- `trial_start`, `trial_end` timestamps
- RLS policies

---

## Step 10: Configure Webhooks (Optional)

For production, set up webhooks to sync subscription status:

1. In RevenueCat dashboard, go to **Project Settings > Webhooks**
2. Add webhook URL: `https://your-backend.com/api/webhooks/revenuecat`
3. Enable events:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `UNSUBSCRIBE`

---

## Step 11: Test Free Access Users

Add test emails to bypass subscription:

```typescript
// lib/revenuecat.ts
export const FREE_ACCESS_EMAILS = [
  'test@trilo.app',
  'demo@example.com',
  // Add your test emails here
];
```

---

## Usage in App

### Check Subscription Status

```typescript
import { useSubscription } from '@/context/SubscriptionContext';

function MyComponent() {
  const { status, hasAccess, trialDaysRemaining } = useSubscription();
  
  if (hasAccess) {
    // Show premium features
  }
}
```

### Show Paywall

```typescript
import { PaywallModal } from '@/components';

const [showPaywall, setShowPaywall] = useState(false);

<PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
```

### Show Trial Banner

```typescript
import { SubscriptionBanner } from '@/components';

<SubscriptionBanner />
```

---

## Troubleshooting

### "Unable to resolve module react-native-purchases"
```bash
cd ios && pod install && cd ..
npx expo start --clear
```

### "No products found"
- Ensure products are approved in App Store Connect / Google Play
- Check API keys are correct
- Verify offering is set as "Current"

### Trial not working
- Check Supabase `user_subscriptions` table
- Verify `trial_start` and `trial_end` are set correctly
- Ensure status is 'trial'

---

## Next Steps

- [ ] Configure actual pricing
- [ ] Design paywall UI
- [ ] Set up analytics tracking
- [ ] Test subscription flow end-to-end
- [ ] Set up customer support
- [ ] Configure dunning management (churn prevention)

---

## Support

- RevenueCat Docs: https://docs.revenuecat.com
- React Native Docs: https://docs.revenuecat.com/docs/react-native
- Help: support@revenuecat.com

