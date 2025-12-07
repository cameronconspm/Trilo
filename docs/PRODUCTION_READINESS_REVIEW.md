# Production Readiness Review: Plaid, RevenueCat, Supabase

This document reviews the configuration of Plaid, RevenueCat, and Supabase for production readiness and TestFlight sandbox testing.

## ✅ Current Status Summary

| Service | Status | TestFlight Ready | Production Ready |
|---------|--------|------------------|------------------|
| **Plaid** | ⚠️ Needs Config | ✅ Yes (sandbox) | ⚠️ Needs Production Keys |
| **RevenueCat** | ⚠️ Needs Config | ✅ Yes (sandbox) | ⚠️ Needs Production Setup |
| **Supabase** | ✅ Configured | ✅ Yes | ✅ Yes |

---

## 🔍 Detailed Analysis

### 1. Plaid Integration

#### Current Configuration

**Backend** (`backend/src/config/plaid.js`):
- ✅ Uses environment variable: `PLAID_ENV` (sandbox/development/production)
- ✅ Environment-aware configuration
- ⚠️ **Issue**: Redirect URI hardcoded in `plaidService.js` line 18

**Frontend** (`context/PlaidContext.tsx`):
- ⚠️ **Issue**: API URL is hardcoded (line 227):
  ```typescript
  const API_BASE_URL = 'https://trilo-production.up.railway.app/api/plaid';
  ```
  This should be environment-aware for TestFlight vs Production.

#### Required Actions for Production

1. **Backend Environment Variables** (Railway/Your Host):
   ```env
   PLAID_ENV=production  # Change from 'sandbox' to 'production'
   PLAID_CLIENT_ID=your_production_client_id  # Get from Plaid Dashboard
   PLAID_SECRET=your_production_secret  # Get from Plaid Dashboard
   ```

2. **Fix Hardcoded Redirect URI** in `backend/src/services/plaidService.js`:
   - Currently hardcoded to production URL
   - Should be environment-aware or configurable

3. **Make Frontend API URL Environment-Aware**:
   - Create environment variable for backend URL
   - Use different URLs for development, TestFlight, and production

4. **Update Plaid Dashboard**:
   - Add production redirect URI
   - Configure OAuth redirect URLs for production

---

### 2. RevenueCat Integration

#### Current Configuration

**Frontend** (`lib/revenuecat.ts`):
- ✅ Has environment-aware key selection
- ✅ Falls back to test key for Expo Go
- ⚠️ **Issue**: Production iOS key appears to be a placeholder
- ⚠️ **Issue**: Android key is definitely a placeholder

**Current Keys**:
- iOS: `appl_KYJdeAHerYQeEgWWYLlFZVhXQBH` (needs verification if this is production)
- Android: `goog_YOUR_ANDROID_KEY_HERE` (placeholder)

#### Required Actions for Production

1. **Verify/Update API Keys** in `lib/revenuecat.ts`:
   ```typescript
   // Get from RevenueCat Dashboard > Project Settings > API Keys
   const REVENUECAT_API_KEY_IOS = 'appl_YOUR_PRODUCTION_IOS_KEY';
   const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_PRODUCTION_ANDROID_KEY';
   ```

2. **Configure RevenueCat Dashboard**:
   - ✅ Create products in App Store Connect (`com.trilo.monthly`, `com.trilo.annual`)
   - ✅ Create products in Google Play Console
   - ✅ Create entitlement: `premium_access`
   - ✅ Create offering: `default`
   - ⚠️ **Set up webhook** for production:
     - URL: `https://trilo-production.up.railway.app/api/webhooks/revenuecat`
     - Secret: Add `REVENUECAT_WEBHOOK_SECRET` to backend env vars
     - Enable events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNSUBSCRIBE`

3. **TestFlight Testing**:
   - ✅ Sandbox mode works automatically with TestFlight builds
   - ✅ Use sandbox tester accounts in iOS Settings > App Store > Sandbox Account
   - ✅ Products work in sandbox without App Store review

---

### 3. Supabase Integration

#### Current Configuration

**Frontend** (`lib/supabase.ts`):
- ✅ Uses environment-aware configuration (app.json or env vars)
- ✅ Same instance used for all environments (acceptable)

**Backend** (`backend/src/config/supabase.js`):
- ✅ Uses service role key for backend operations
- ✅ Environment variables properly configured

#### Required Actions

**None** - Supabase is production-ready! ✅

- Current setup uses same Supabase instance for all environments
- RLS (Row Level Security) provides proper data isolation
- Service role key correctly used only on backend

---

## 📋 Action Items Checklist

### Before TestFlight

- [ ] Verify RevenueCat iOS API key is correct (not a test key)
- [ ] Add Android RevenueCat API key if planning Android release
- [ ] Test Plaid connection in TestFlight with sandbox mode
- [ ] Test RevenueCat subscriptions in sandbox mode
- [ ] Verify Supabase RLS policies are correct

### Before Production Launch

#### Plaid
- [ ] Get production `PLAID_CLIENT_ID` from Plaid Dashboard
- [ ] Get production `PLAID_SECRET` from Plaid Dashboard
- [ ] Update backend `PLAID_ENV` to `production`
- [ ] Add production redirect URI in Plaid Dashboard
- [ ] Update `backend/src/services/plaidService.js` to use environment-aware redirect URI
- [ ] Make frontend `API_BASE_URL` environment-aware
- [ ] Test production Plaid flow end-to-end

#### RevenueCat
- [ ] Verify production iOS API key in `lib/revenuecat.ts`
- [ ] Add production Android API key if needed
- [ ] Create products in App Store Connect (if not already done)
- [ ] Create products in Google Play Console (if not already done)
- [ ] Set up production webhook URL in RevenueCat dashboard
- [ ] Add `REVENUECAT_WEBHOOK_SECRET` to backend environment variables
- [ ] Test webhook with RevenueCat webhook tester
- [ ] Verify subscription products appear correctly in app

#### Supabase
- [ ] Review RLS policies for production
- [ ] Backup database before launch
- [ ] Set up monitoring/alerts if desired

---

## 🔧 Code Changes Needed

### 1. Make Plaid API URL Environment-Aware

**File**: `context/PlaidContext.tsx`

Replace hardcoded URL (line 227) with:

```typescript
// Environment-aware API URL
const getApiBaseUrl = () => {
  // Use environment variable if set
  if (process.env.EXPO_PUBLIC_PLAID_API_URL) {
    return process.env.EXPO_PUBLIC_PLAID_API_URL;
  }
  
  // Or use Constants from app.json
  const apiUrl = Constants.expoConfig?.extra?.plaidApiUrl;
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback: detect environment
  if (__DEV__) {
    return 'http://localhost:3001/api/plaid'; // Local development
  }
  
  // Production/TestFlight - use your Railway URL
  return 'https://trilo-production.up.railway.app/api/plaid';
};

const API_BASE_URL = getApiBaseUrl();
```

### 2. Update app.json for Environment Variables

Add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "plaidApiUrl": "https://trilo-production.up.railway.app/api/plaid",
      "revenueCatApiKeyIos": "appl_KYJdeAHerYQeEgWWYLlFZVhXQBH",
      "revenueCatApiKeyAndroid": "goog_YOUR_ANDROID_KEY_HERE"
    }
  }
}
```

### 3. Fix Plaid Redirect URI

**File**: `backend/src/services/plaidService.js`

Update line 16-19:

```javascript
// Environment-aware redirect URI
const redirectUri = process.env.PLAID_REDIRECT_URI || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://trilo-production.up.railway.app/api/plaid/redirect'
    : null);
    
const request = {
  user: {
    client_user_id: userId.toString(),
  },
  client_name: 'Trilo',
  products: ['transactions', 'auth'],
  country_codes: ['US'],
  language: 'en',
  ...(redirectUri && { redirect_uri: redirectUri }),
};
```

---

## 🧪 Testing Checklist

### TestFlight (Sandbox Mode)

#### Plaid
- [ ] Connect bank account using sandbox credentials
- [ ] Verify transactions sync correctly
- [ ] Test account disconnection
- [ ] Check error handling

#### RevenueCat
- [ ] View subscription packages
- [ ] Purchase subscription with sandbox account
- [ ] Verify subscription status updates
- [ ] Test restore purchases
- [ ] Verify free trial works
- [ ] Test subscription cancellation

#### Supabase
- [ ] Verify user authentication works
- [ ] Check data syncing
- [ ] Verify RLS policies work correctly

### Production

Repeat all TestFlight tests with production credentials:
- [ ] Use real Plaid production credentials
- [ ] Use real RevenueCat production keys
- [ ] Test with real App Store purchases (use test accounts first)

---

## 📝 Environment Variable Reference

### Frontend (app.json / expo.config.js)

```json
{
  "expo": {
    "extra": {
      "plaidApiUrl": "https://trilo-production.up.railway.app/api/plaid",
      "revenueCatApiKeyIos": "appl_YOUR_IOS_KEY",
      "revenueCatApiKeyAndroid": "goog_YOUR_ANDROID_KEY",
      "supabaseUrl": "https://raictkrsnejvfvpgqzcq.supabase.co",
      "supabaseAnonKey": "your_anon_key"
    }
  }
}
```

### Backend (Railway/Production Host)

```env
# Plaid
PLAID_CLIENT_ID=your_production_client_id
PLAID_SECRET=your_production_secret
PLAID_ENV=production
PLAID_REDIRECT_URI=https://trilo-production.up.railway.app/api/plaid/redirect

# Supabase
SUPABASE_URL=https://raictkrsnejvfvpgqzcq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# RevenueCat Webhook
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_from_revenuecat

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
```

---

## ⚠️ Important Notes

1. **TestFlight Still Uses Sandbox**: Even in TestFlight, Plaid and RevenueCat will use sandbox/test modes until you explicitly switch to production credentials.

2. **RevenueCat Products**: Products must be created and approved in App Store Connect/Google Play before they work in production. Sandbox products work immediately for testing.

3. **Plaid Production Access**: Requires Plaid production access approval. Make sure you've completed Plaid's onboarding process.

4. **Webhook Security**: The RevenueCat webhook secret is important for security. Never commit it to version control.

5. **Environment Detection**: Consider using EAS Build environment variables or separate builds for TestFlight vs Production if you need different configurations.

---

## 🚀 Quick Start for Production

1. **Update Backend Environment Variables** (Railway dashboard):
   - Set `PLAID_ENV=production`
   - Add production Plaid credentials
   - Add RevenueCat webhook secret

2. **Update Frontend** (`app.json`):
   - Add/update RevenueCat API keys
   - Verify Plaid API URL

3. **RevenueCat Dashboard**:
   - Set up webhook URL
   - Verify products are configured

4. **Test**:
   - TestFlight with sandbox (current setup)
   - Production build with production credentials

---

## 📞 Support Resources

- **Plaid**: https://dashboard.plaid.com/support
- **RevenueCat**: https://www.revenuecat.com/docs
- **Supabase**: https://supabase.com/docs/guides/platform/troubleshooting

