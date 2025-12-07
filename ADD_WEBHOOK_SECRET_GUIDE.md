# How to Add REVENUECAT_WEBHOOK_SECRET

## Step 1: Generate a Secure Secret

You need to generate a secure random string. You have a few options:

### Option A: Using Terminal/Command Line (Recommended)
```bash
# macOS/Linux
openssl rand -hex 32

# Or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option B: Using Online Generator
1. Go to https://www.uuidgenerator.net/
2. Generate a UUID v4
3. Copy it (or use multiple UUIDs concatenated)

### Option C: Manual Random String
Use any long random string (at least 32 characters). Example:
```
rc_webhook_2024_abc123xyz789_secret_key_secure_random
```

**Example output:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

## Step 2: Add to Railway

### In Railway Dashboard:

1. **Go to your Railway project** (the "Trilo" project you're viewing)
2. **Click on the "Variables" tab** (you're already there!)
3. **Click the purple "+ New Variable" button** (top right)
4. **Fill in the form:**
   - **Key:** `REVENUECAT_WEBHOOK_SECRET`
   - **Value:** Paste your generated secret (from Step 1)
5. **Click "Add"**

**Important:** 
- ✅ The key must be exactly: `REVENUECAT_WEBHOOK_SECRET` (case-sensitive)
- ✅ Copy the secret somewhere safe - you'll need it for RevenueCat too
- ✅ Railway will automatically redeploy your backend after adding the variable

---

## Step 3: Configure in RevenueCat Dashboard

### In RevenueCat Dashboard:

1. **Log in to RevenueCat:** https://app.revenuecat.com/
2. **Select your project** (Trilo)
3. **Go to:** Project Settings → Integrations → Webhooks
4. **Click "Add Webhook"** (or edit existing if you have one)
5. **Configure the webhook:**
   - **Webhook URL:** `https://trilo-production.up.railway.app/api/webhooks/revenuecat`
     - ⚠️ Replace with your actual Railway URL if different
     - You can find your Railway URL in Railway Dashboard → Settings → Domains
   - **Authorization Header:** 
     - Enter the **same secret** you just added to Railway
     - Format options:
       - Option 1: `Bearer your_secret_here`
       - Option 2: `your_secret_here` (just the secret)
     - The webhook code supports both formats
6. **Enable these events:**
   - ✅ `INITIAL_PURCHASE`
   - ✅ `RENEWAL`
   - ✅ `CANCELLATION`
   - ✅ `UNSUBSCRIBE`
7. **Click "Save"**

---

## Step 4: Verify It's Working

### Test the Setup:

1. **Check Railway Variables:**
   - Go back to Railway → Variables tab
   - You should now see **9 variables** (including `REVENUECAT_WEBHOOK_SECRET`)
   - The value should be masked with `*******`

2. **Test Webhook (Optional):**
   - Make a test purchase in your app (Sandbox/TestFlight)
   - Check Railway logs for webhook events
   - Check Supabase `user_subscriptions` table to see if status updates

3. **Check for Errors:**
   - If webhook fails, check Railway logs for:
     - "Missing authorization header" → RevenueCat not sending header
     - "Invalid webhook authorization token" → Secrets don't match
     - "User not found" → User doesn't exist in `user_subscriptions` table

---

## Quick Reference

### What You Need:
- ✅ Secret generated (32+ characters)
- ✅ Secret added to Railway as `REVENUECAT_WEBHOOK_SECRET`
- ✅ Same secret configured in RevenueCat dashboard
- ✅ Webhook URL set in RevenueCat: `https://your-railway-url/api/webhooks/revenuecat`
- ✅ Events enabled in RevenueCat

### Your Current Railway Variables (Should be 9 after adding):
1. `CORS_ORIGIN`
2. `NODE_ENV`
3. `PLAID_CLIENT_ID`
4. `PLAID_ENV`
5. `PLAID_SECRET`
6. `PORT`
7. `SUPABASE_SERVICE_ROLE_KEY`
8. `SUPABASE_URL`
9. `REVENUECAT_WEBHOOK_SECRET` ← **ADD THIS ONE**

---

## Troubleshooting

### Issue: "REVENUECAT_WEBHOOK_SECRET not configured"
**Solution:** Make sure you added it to Railway and it's spelled exactly right

### Issue: "Invalid webhook authorization token"
**Solution:** 
- Secrets must match exactly between Railway and RevenueCat
- Check for extra spaces or typos
- Make sure you're using the same secret in both places

### Issue: "Webhook not receiving events"
**Solution:**
- Verify webhook URL is correct in RevenueCat
- Check Railway logs for incoming requests
- Make sure events are enabled in RevenueCat dashboard

---

## Need Help?

If you get stuck:
1. Check Railway logs for error messages
2. Verify the secret is the same in both places
3. Test with a simple webhook test tool first
4. Make sure your Railway backend is deployed and running

