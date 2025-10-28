# RevenueCat Quick Start Guide 🚀

## TL;DR - Get Running in 5 Steps

### 1️⃣ Install Package (Done ✅)
```bash
npm install
# Already completed
```

### 2️⃣ Get RevenueCat API Keys
1. Sign up: https://app.revenuecat.com
2. Create project: **Trilo**
3. Go to **Project Settings > API Keys**
4. Copy keys:
   - iOS: `appl_XXXXXXXXXX`
   - Android: `goog_XXXXXXXXXX`

### 3️⃣ Update API Keys
Edit `lib/revenuecat.ts` (lines 18-24):

```typescript
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_KEY_HERE';
```

OR add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "revenueCatApiKeyIos": "appl_YOUR_KEY_HERE",
      "revenueCatApiKeyAndroid": "goog_YOUR_KEY_HERE"
    }
  }
}
```

### 4️⃣ Run Supabase Migration
1. Open Supabase SQL Editor
2. Copy contents of `supabase_schema.sql`
3. Run it (creates `user_subscriptions` table)

### 5️⃣ Test in App
```bash
npm run ios
# or
npm run android
```

**Test Account:** `test@trilo.app` / `test123456` (has free access)

---

## What Happens Now?

### For New Users:
- ✅ Auto 7-day trial on signup
- ✅ See trial countdown banner
- ✅ Full access during trial
- ❌ Access locked after trial ends
- 💰 Must subscribe to continue

### For Test Account:
- ✅ Full access always
- ✅ No subscription needed
- ✅ Bypasses all checks

### For Paid Users:
- ✅ Full access
- ✅ Recurring billing
- ✅ Auto-renewal

---

## Test Subscription Flow

### 1. Sandbox Testing

**iOS:**
- Use sandbox tester in App Store settings
- Or RevenueCat sandbox tester IDs

**Android:**
- Add test email to Play Console
- Use test accounts

### 2. Products Needed
Create in App Store Connect & Google Play:

- **Monthly:** `com.trilo.monthly` - $X.XX/month
- **Annual:** `com.trilo.annual` - $XX.XX/year (with 7-day trial)

### 3. RevenueCat Configuration

1. Add products to RevenueCat dashboard
2. Create entitlement: `premium_access`
3. Create offering: `default`
4. Set as current offering

---

## Files You Need to Know

| File | Purpose |
|------|---------|
| `lib/revenuecat.ts` | RevenueCat SDK functions |
| `context/SubscriptionContext.tsx` | Subscription state management |
| `components/modals/PaywallModal.tsx` | Purchase UI |
| `components/SubscriptionBanner.tsx` | Trial countdown banner |
| `supabase_schema.sql` | Database schema |

---

## Common Issues

### "No products found"
✅ Create products in App Store Connect/Google Play first

### "API key invalid"
✅ Double-check keys in `lib/revenuecat.ts`

### "Trial not working"
✅ Check `user_subscriptions` table in Supabase
✅ Ensure trial_start and trial_end are set

### "Package version error"
✅ Use `react-native-purchases@^9.6.0` (already set)

---

## Production Checklist

- [ ] RevenueCat API keys configured
- [ ] Products created in App Store Connect
- [ ] Products created in Google Play Console
- [ ] Supabase schema migrated
- [ ] Test users configured
- [ ] Products added to RevenueCat
- [ ] Offering created and set as current
- [ ] Sandbox testing completed
- [ ] Webhook endpoint configured (optional)
- [ ] Error handling tested
- [ ] Restore purchases tested

---

## Support

📚 Full Docs: `docs/REVENUECAT_SETUP.md`  
🚀 Ready to Test: Just add API keys!  
💬 Questions? Check error logs in console

