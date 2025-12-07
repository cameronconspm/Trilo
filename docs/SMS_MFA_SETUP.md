# SMS MFA Setup Guide

This guide explains how to configure SMS-based Multi-Factor Authentication (MFA) for Trilo.

## Overview

Trilo uses SMS-based MFA to enhance account security. Users receive verification codes via SMS to their registered phone numbers when signing in or accessing sensitive features.

## Architecture

- **Frontend**: React Native app handles MFA setup and verification UI
- **Backend**: Express.js server generates and verifies SMS codes
- **SMS Service**: Twilio (configurable) or console logging in development

## Setup Instructions

### 1. Backend Configuration

#### Option A: Twilio (Recommended for Production)

1. **Sign up for Twilio**
   - Go to https://www.twilio.com
   - Create an account and verify your phone number
   - Get a phone number with SMS capabilities (Trial accounts have limitations)

2. **Install Twilio SDK**
   ```bash
   cd backend
   npm install twilio
   ```

3. **Get Twilio Credentials**
   - From Twilio Console: https://console.twilio.com
   - Copy your **Account SID** and **Auth Token**
   - Copy your Twilio phone number (format: +1234567890)

4. **Update Environment Variables**
   Add to `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

5. **Deploy to Railway**
   - Add these environment variables to your Railway project
   - Redeploy your backend service

#### Option B: Development Mode (Console Logging)

In development mode, if Twilio is not configured, verification codes are logged to the console instead of being sent via SMS. This is useful for testing but **MUST NOT be used in production**.

**⚠️ Important**: Never rely on console logging in production. Always configure Twilio or another SMS service.

### 2. Frontend Configuration

No additional configuration needed. The frontend automatically uses the backend API endpoints:
- `/api/mfa/send-code` - Sends verification code
- `/api/mfa/verify-code` - Verifies code

Make sure your frontend's API base URL is configured correctly in:
- `services/mfaService.ts` - Uses `EXPO_PUBLIC_PLAID_API_URL` or falls back to Railway URL

### 3. Testing

1. **Enable MFA for a user**
   - Sign in to the app
   - Go to Profile → Security
   - Tap "Enable Two-Factor Authentication"
   - Enter your phone number (with country code, e.g., +1 for US)
   - Enter the verification code received via SMS

2. **Test MFA Sign-in**
   - Sign out
   - Sign in again
   - After entering password, you'll be prompted for SMS code
   - Enter the code from your phone

3. **Verify Code Expiration**
   - Codes expire after 10 minutes
   - After 5 failed attempts, code becomes invalid

### 4. Security Considerations

- **Phone Number Storage**: Full phone numbers are stored locally (encrypted in production) and in user metadata. Masked versions are displayed in the UI.
- **Code Generation**: 6-digit random codes generated server-side
- **Code Expiration**: 10 minutes
- **Rate Limiting**: Maximum 5 verification attempts per code
- **Code Cleanup**: Expired codes are automatically cleaned up

### 5. Troubleshooting

#### SMS Codes Not Received

1. **Check Twilio Configuration**
   - Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are set
   - Check Twilio console for errors: https://console.twilio.com

2. **Check Phone Number Format**
   - Must include country code (e.g., +1 for US, +44 for UK)
   - Format: `+[country code][number]`
   - Example: `+15551234567`

3. **Check Twilio Account Status**
   - Trial accounts have limitations (can only send to verified numbers)
   - Upgrade to paid account for production use

4. **Check Backend Logs**
   - Look for errors in Railway logs
   - Check console for logged codes in development mode

#### Backend Errors

1. **"SMS sending not configured"**
   - Twilio credentials are missing
   - Codes are being logged to console (development mode)

2. **"Invalid verification ID"**
   - Code may have expired (10 minutes)
   - Request a new code

3. **"Too many attempts"**
   - 5 failed verification attempts reached
   - Request a new code

### 6. Production Checklist

Before deploying to production:

- [ ] Configure Twilio with production credentials
- [ ] Upgrade Twilio account from trial to paid (if needed)
- [ ] Test SMS delivery to various phone numbers
- [ ] Verify code expiration (10 minutes)
- [ ] Test rate limiting (5 attempts max)
- [ ] Remove or secure console logging in production
- [ ] Enable MFA on Supabase, Railway, and GitHub accounts (see `SECURITY_IMPLEMENTATION.md`)

## API Reference

### POST `/api/mfa/send-code`

Send SMS verification code to a phone number.

**Request Body:**
```json
{
  "phone_number": "+15551234567",
  "user_id": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent",
  "verification_id": "random-verification-id"
}
```

### POST `/api/mfa/verify-code`

Verify SMS code.

**Request Body:**
```json
{
  "verification_id": "random-verification-id",
  "code": "123456",
  "user_id": "user-uuid",
  "phone_number": "+15551234567"
}
```

**Response (Success):**
```json
{
  "verified": true
}
```

**Response (Error):**
```json
{
  "verified": false,
  "error": "Invalid verification code"
}
```

## Alternative SMS Providers

To use a different SMS provider (e.g., AWS SNS, Vonage), modify the `sendSMS` function in `backend/src/routes/mfa.js`.

Example for AWS SNS:
```javascript
const AWS = require('aws-sdk');
const sns = new AWS.SNS({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

await sns.publish({
  PhoneNumber: phoneNumber,
  Message: `Your Trilo verification code is: ${code}. This code expires in 10 minutes.`,
}).promise();
```

