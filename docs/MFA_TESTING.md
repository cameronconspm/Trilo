# MFA Testing Guide - Development Mode

## Why You're Not Receiving SMS Codes

In **development mode**, SMS codes are **not actually sent** via SMS. Instead, they are:
1. **Logged to Railway console logs** (where you can see them)
2. **Returned in the API response** (in development mode only)

This is because Twilio (or another SMS service) needs to be configured for actual SMS sending.

## How to Get Your Verification Code

### Option 1: Check Railway Console Logs (Recommended)

1. Go to Railway dashboard: https://railway.app
2. Select your backend service
3. Click on "Logs" tab
4. Look for lines like:
   ```
   [MFA] ⚠️  SMS Code for +16025490022: 123456
   [MFA] Verification code sent to +16025490022 for user ...
   ```

### Option 2: Check Metro/Expo Console

The code is also logged to your frontend console. Look for:
```
[MFA] 📱 Development mode - Your code: 123456
```

### Option 3: Check Backend Response

In development mode, the code is included in the API response. Check your network tab or backend logs.

## Enable Actual SMS (Production)

To actually send SMS codes, you need to:

1. **Set up Twilio** (see `docs/SMS_MFA_SETUP.md`)
2. **Add environment variables to Railway**:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

3. **Install Twilio in backend**:
   ```bash
   cd backend
   npm install twilio
   ```

4. **Redeploy backend** to Railway

After this, codes will be sent via actual SMS instead of being logged to console.

## Testing Without SMS Service

For now, just check Railway logs to get your verification code!


