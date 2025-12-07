# 🚀 Deploy MFA Routes to Railway - Quick Fix

## Problem
You're seeing "Route not found" because the MFA routes haven't been deployed to Railway yet.

## Solution: Deploy Backend Changes

The MFA routes are already coded, but Railway needs to redeploy with the new routes.

### Quick Steps:

1. **Commit the new files** (if not already committed):
   ```bash
   git add backend/src/routes/mfa.js backend/src/server.js
   git commit -m "Add MFA SMS verification routes"
   git push
   ```

2. **Railway will auto-deploy** (if connected to GitHub), or manually trigger:
   - Go to Railway dashboard → Your backend service → Click "Redeploy"

3. **Verify deployment**:
   - Check Railway logs for: `✅ API Routes registered: /api/mfa/*`
   - The route should be available at: `https://trilo-production.up.railway.app/api/mfa/send-code`

## What Gets Deployed

- ✅ `backend/src/routes/mfa.js` - New MFA route file
- ✅ `backend/src/server.js` - Updated to register MFA routes (line 104)

## Test After Deployment

```bash
curl -X POST https://trilo-production.up.railway.app/api/mfa/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234567", "user_id": "test-user"}'
```

Expected: `{"success": true, "message": "Verification code sent", ...}`

## After Deployment

Once deployed, MFA will work! The app will be able to:
- Send SMS verification codes
- Verify codes
- Enable MFA for users

**Note**: In development, codes are logged to console. For production SMS, configure Twilio (see `docs/SMS_MFA_SETUP.md`).
