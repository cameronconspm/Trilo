# MFA Routes Deployment Guide

## Issue: "Route not found" Error

If you're seeing a "Route not found" error when trying to enable MFA, it means the backend server hasn't been deployed with the new MFA routes yet.

## Solution: Deploy Backend to Railway

The MFA routes are already set up in the code, but they need to be deployed to Railway.

### Step 1: Verify Routes Exist Locally

The routes are defined in:
- `backend/src/routes/mfa.js` - MFA route handlers
- `backend/src/server.js` - Route registration (line 104: `app.use('/api/mfa', mfaRoutes);`)

### Step 2: Deploy to Railway

1. **Commit your changes** (if not already committed):
   ```bash
   git add backend/src/routes/mfa.js backend/src/server.js
   git commit -m "Add MFA SMS verification routes"
   git push
   ```

2. **Railway will auto-deploy** if you have auto-deploy enabled, or manually trigger a deployment:
   - Go to Railway dashboard
   - Select your backend service
   - Click "Deploy" or "Redeploy"

3. **Verify deployment**:
   - Check Railway logs for: `✅ API Routes registered: /api/mfa/*`
   - Test the health endpoint: `https://trilo-production.up.railway.app/health`
   - Test MFA endpoint: `POST https://trilo-production.up.railway.app/api/mfa/send-code`

### Step 3: Test the Route

Once deployed, test with curl:
```bash
curl -X POST https://trilo-production.up.railway.app/api/mfa/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234567", "user_id": "test-user"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Verification code sent",
  "verification_id": "..."
}
```

## Development Mode

For local development, ensure your backend server is running:

```bash
cd backend
npm run dev
```

Then test locally:
```bash
curl -X POST http://localhost:3001/api/mfa/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234567", "user_id": "test-user"}'
```

## Troubleshooting

### Route Still Not Found After Deployment

1. **Check Railway logs** for errors during deployment
2. **Verify route registration** - Look for log: `✅ API Routes registered: /api/mfa/*`
3. **Check CORS settings** - Ensure Railway CORS allows requests from your frontend
4. **Verify backend URL** - Ensure frontend is pointing to correct Railway URL

### SMS Codes Not Being Sent

In development mode, codes are logged to console instead of being sent via SMS. To enable actual SMS:

1. Set up Twilio (see `docs/SMS_MFA_SETUP.md`)
2. Add environment variables to Railway:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

## Next Steps

Once routes are deployed:
1. ✅ Test SMS code sending
2. ✅ Test SMS code verification
3. ✅ Enable MFA for users
4. ✅ Configure Twilio for production SMS

