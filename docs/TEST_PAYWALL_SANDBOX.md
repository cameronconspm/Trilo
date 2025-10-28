# How to Test Your Paywall Without App Store Review

## Quick Answer

**Yes, you can test right now!** Use **Sandbox Testing** - your products work in sandbox mode even before Apple review.

---

## Setup Steps (15 minutes)

### Step 1: Configure Products in RevenueCat

1. Go to https://app.revenuecat.com
2. **Products** → **Add Product**
3. Add your iOS products:
   - Product ID: `com.trilo.monthly`
   - Reference Name: Monthly Subscription
   - Store: Apple App Store
   - App Store Connect Product ID: Your product from App Store Connect
   
4. Repeat for `com.trilo.annual`

### Step 2: Create Entitlement

1. **Products** → **Entitlements** → **Add Entitlement**
2. Name: `premium_access`
3. Click **Save**

### Step 3: Attach Products to Entitlement

1. Click on `com.trilo.monthly` product
2. Under "Entitlements", select `premium_access`
3. Click **Save**
4. Repeat for annual

### Step 4: Create Offering

1. **Offerings** → **Create Offering**
2. Name: `default`
3. Add packages:
   - Package 1: `monthly` → Product `com.trilo.monthly`
   - Package 2: `annual` → Product `com.trilo.annual`
4. Set as **Current Offering**
5. Click **Save**

### Step 5: Set Up Sandbox Account (iOS)

1. Open **Settings** on your iPhone
2. Scroll to **App Store** → **Sandbox Account**
3. Sign in with a test email:
   - Use a unique email (e.g., `test1@trilo.app`)
   - Accept sandbox terms

---

## Test Your Paywall

### How to Trigger Paywall:

1. **Sign up as new user** → Auto-creates 7-day trial
2. **Wait for trial to expire** → Shows "Subscribe Now" banner
3. **Or manually show paywall:**
   ```typescript
   // In any component:
   const [showPaywall, setShowPaywall] = useState(true);
   
   <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
   ```

### What You'll See:

✅ Products loaded from RevenueCat  
✅ Prices displayed  
✅ "Best Value" badge on annual plan  
✅ "Subscribe Now" button works  
✅ Sandbox purchase processes  
✅ Subscription activated after purchase  

---

## Troubleshooting

### "No products found"
**Cause:** Products not linked in RevenueCat or not set as current offering  
**Fix:** Complete Steps 1-4 above

### "Cannot make purchases"
**Cause:** Not signed in to sandbox account  
**Fix:** Settings → App Store → Sandbox Account → Sign in

### Products show wrong prices
**Cause:** Using production API key instead of sandbox  
**Fix:** Check RevenueCat dashboard → Use sandbox keys

---

## Sandbox vs Production

### Sandbox (Testing)
- ✅ Works without App Store review
- ✅ Uses test accounts
- ✅ No real charges
- ✅ Instant approval
- ❌ Only works on test devices

### Production (Live)
- ✅ Real users can purchase
- ✅ Real charges processed
- ⏳ Requires App Store review (1-2 days)
- ✅ Available to all users

---

## Testing Checklist

- [ ] Products added to RevenueCat
- [ ] Entitlement created (`premium_access`)
- [ ] Products attached to entitlement
- [ ] Offering created and set as current
- [ ] Sandbox account signed in on device
- [ ] App restart after configuration
- [ ] Paywall opens and shows products
- [ ] "Subscribe Now" button works
- [ ] Purchase completes successfully
- [ ] Subscription status updates

---

## Quick Test Without Configuring Everything

If you just want to see the UI working:

1. Add API keys (✅ already done)
2. Restart app
3. The paywall will show "No products found"
4. But the UI will be visible and functional
5. When you add products, they'll automatically appear

---

## Expected Timeline

- **Setup in RevenueCat:** 10 minutes
- **Test on device:** 5 minutes
- **Total:** 15 minutes to see working paywall

**Production Approval:** 1-2 days (you can test in sandbox while waiting)

---

## Need Help?

- RevenueCat Docs: https://docs.revenuecat.com
- Testing Guide: https://docs.revenuecat.com/docs/testing
- Your API Key: `appl_KYJdeAHerYQeEgWWYLlFZVhXQBH`

