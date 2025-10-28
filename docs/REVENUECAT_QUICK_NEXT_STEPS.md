# RevenueCat: Your Next Steps 📋

You've created your RevenueCat account! Here's what to do next.

## ⚡ Quick Answer: Will My Paywall Appear?

**No, not yet.** You need to complete the setup first. Here's why and what to do:

---

## 📋 Setup Checklist (In Order)

### ✅ Step 1: Get API Keys (2 minutes)

1. Go to https://app.revenuecat.com
2. Select your project
3. Go to: **Project Settings → API Keys**
4. Copy these keys:
   - **iOS API Key**: `appl_XXXXXXXXXX`
   - **Android API Key**: `goog_XXXXXXXXXX`

**Update your app:**
- Open: `lib/revenuecat.ts`
- Lines 20-28: Replace placeholder keys with your real keys

---

### ⚠️ Step 2: Create Supabase Table (5 minutes) - **DO THIS FIRST!**

Before the paywall can work, you need the database table:

1. Go to: https://supabase.com/dashboard/project/raictkrsnejvfvpgqzcq/editor
2. Copy the SQL from: `docs/CREATE_SUBSCRIPTIONS_TABLE.sql`
3. Paste and run it
4. ✅ Done! This creates the `user_subscriptions` table

**Why This Matters:**
- Without this table, the app crashes when checking subscription status
- The trial system needs this table to track users
- This is the #1 reason why paywall doesn't work initially

---

### 🎯 Step 3: Add API Keys (1 minute)

Edit `lib/revenuecat.ts`:

```typescript
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_ACTUAL_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ACTUAL_KEY_HERE';
```

Save and restart your app.

---

### 📱 Step 4: Create Products in App Store Connect

**This is the long part.** You need to create subscription products:

#### For iOS:
1. Go to: https://appstoreconnect.apple.com
2. Select your app: **Trilo**
3. Features → In-App Purchases
4. Create these products:
   - `com.trilo.monthly` - $X.XX/month (1 month subscription)
   - `com.trilo.annual` - $XX.XX/year (1 year subscription, 7-day trial)

**Time Required:** 20-30 minutes (requires Apple review for first time)

#### For Android:
1. Go to: https://play.google.com/console
2. Select your app: **Trilo**
3. Monetize → Subscriptions
4. Create the same products

**Time Required:** 15-20 minutes

---

### 🔗 Step 5: Link Products to RevenueCat

1. In RevenueCat: **Products** → **Add Product**
2. Add your iOS product: `com.trilo.monthly`
3. Add your Android product: `com.trilo.monthly` 
4. Repeat for annual
5. Attach to entitlement: `premium_access`

**Time Required:** 5 minutes

---

### 🎁 Step 6: Create Offering

1. In RevenueCat: **Offerings** → **Create Offering**
2. Name it: `default`
3. Add packages: monthly and annual
4. Set as **Current Offering**

**Time Required:** 2 minutes

---

## 🎉 When Will Paywall Appear?

The paywall will appear when:

✅ Step 2 is done (Supabase table created)  
✅ Step 3 is done (API keys added)  
✅ Step 4 is done (Products created - takes 1-2 days for approval)  
✅ Step 5 is done (Products linked to RevenueCat)  
✅ Step 6 is done (Offering created)  

**For existing users:** Trial banner appears immediately after Step 2-3  
**For new users:** 7-day trial starts automatically on signup

---

## 🚀 Quick Test Setup (Skip Products for Now)

Want to test the UI without waiting for product approval?

1. ✅ Complete Step 1-3 (API keys + Supabase table)
2. Run the app
3. You'll see:
   - ✅ Trial banner (if in trial)
   - ✅ SubscriptionBanner component
   - ❌ Paywall shows "No products found" (expected without products)

**To test the full flow:** You need actual products in App Store/Google Play.

---

## 📞 Need Help?

- Full guide: `docs/REVENUECAT_SETUP.md`
- Quick reference: `docs/REVENUECAT_QUICK_START.md`
- Database setup: `docs/HOW_TO_FIX_SUBSCRIPTIONS_TABLE.md`

---

## 💡 Pro Tip

**Start with Steps 2-3 NOW** (5 minutes total):
1. Run the Supabase SQL migration
2. Add your API keys
3. Restart app
4. You'll see the trial banner working!

Then tackle Steps 4-6 (1-2 days for product approval) when ready.

