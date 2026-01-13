# Key Rotation Procedure

**Last Updated:** January 2025  
**Version:** 1.0

## Overview

This document outlines the procedures for rotating API keys, secrets, and credentials used by the Trilo application. Regular key rotation is a security best practice that limits the impact of compromised credentials.

## Rotation Schedule

### Recommended Rotation Frequency
- **Quarterly (Every 3 months)**: Standard rotation schedule
- **Immediately**: After security incident or suspected compromise
- **Annually (Minimum)**: Absolute minimum for low-risk keys

### Rotation Priority

| Key Type | Rotation Frequency | Priority | Impact if Compromised |
|----------|-------------------|----------|----------------------|
| Plaid API Keys | Quarterly | HIGH | Financial data access |
| Supabase Service Role Key | Quarterly | HIGH | Database access |
| JWT Secret | Quarterly | HIGH | Authentication bypass |
| RevenueCat Webhook Secret | Quarterly | MEDIUM | Subscription manipulation |
| Twilio API Keys | Quarterly | MEDIUM | SMS spoofing |
| Supabase Anon Key | As needed | LOW | Public key (less critical) |

## Keys to Rotate

### 1. Plaid API Keys

**Location:** Railway Environment Variables
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`

**Rotation Steps:**

1. **Generate New Keys:**
   - Log into Plaid Dashboard
   - Go to Team Settings → Keys
   - Generate new keys (or contact Plaid support)

2. **Update Environment Variables:**
   - Go to Railway Dashboard → Your Project → Variables
   - Update `PLAID_SECRET` with new secret
   - Keep `PLAID_CLIENT_ID` if not changed
   - Save changes (deployment will restart)

3. **Verify Functionality:**
   - Test creating link token: `POST /api/plaid/link/token`
   - Test account connection flow
   - Monitor logs for errors

4. **Revoke Old Keys:**
   - After 24-48 hours of successful operation
   - Revoke old keys in Plaid Dashboard
   - Keep old keys for 7 days as backup (then delete)

**Downtime:** None (keys can be rotated without downtime)  
**Rollback:** Revert environment variable if issues occur

### 2. Supabase Keys

**Location:** Railway Environment Variables
- `SUPABASE_URL` (rarely changes)
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Rotation Steps:**

1. **Generate New Keys:**
   - Log into Supabase Dashboard
   - Go to Project Settings → API
   - Regenerate Service Role Key (⚠️ This is sensitive!)
   - Regenerate Anon Key if needed

2. **Update Environment Variables:**
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Railway
   - Update `SUPABASE_ANON_KEY` in Railway (if regenerated)
   - Update `SUPABASE_ANON_KEY` in frontend environment (if changed)
   - Save changes

3. **Verify Functionality:**
   - Test database queries
   - Test authentication
   - Test API endpoints
   - Monitor logs for errors

4. **Revoke Old Keys:**
   - After 24-48 hours of successful operation
   - Old keys are automatically invalidated when regenerated
   - Verify old keys no longer work

**Downtime:** Minimal (brief restart during deployment)  
**Rollback:** Revert environment variables if issues occur

### 3. JWT Secret

**Location:** Railway Environment Variables
- `JWT_SECRET`

**Rotation Steps:**

1. **Generate New Secret:**
   ```bash
   # Generate secure random string
   openssl rand -hex 32
   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update Environment Variable:**
   - Update `JWT_SECRET` in Railway
   - Save changes (deployment will restart)

3. **Impact:**
   - ⚠️ **All existing user sessions will be invalidated**
   - Users will need to log in again
   - This is expected behavior

4. **Verify Functionality:**
   - Test user login
   - Test authenticated API endpoints
   - Monitor logs for authentication errors

**Downtime:** None (but users must re-authenticate)  
**Rollback:** Revert environment variable if issues occur

### 4. RevenueCat Webhook Secret

**Location:** 
- Railway Environment Variables: `REVENUECAT_WEBHOOK_SECRET`
- RevenueCat Dashboard: Webhook Authorization Header

**Rotation Steps:**

1. **Generate New Secret:**
   ```bash
   openssl rand -hex 32
   ```

2. **Update Railway:**
   - Update `REVENUECAT_WEBHOOK_SECRET` in Railway
   - Save changes

3. **Update RevenueCat Dashboard:**
   - Log into RevenueCat Dashboard
   - Go to Project Settings → Integrations → Webhooks
   - Update Authorization Header with new secret
   - Save changes

4. **Verify Functionality:**
   - Test webhook receipt (make a test purchase/subscription change)
   - Verify webhook is received and processed
   - Monitor logs for webhook errors

**Downtime:** None  
**Rollback:** Revert both Railway and RevenueCat settings if issues occur

### 5. Twilio API Keys

**Location:** Railway Environment Variables
- `TWILIO_ACCOUNT_SID` (rarely changes)
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (rarely changes)

**Rotation Steps:**

1. **Generate New Auth Token:**
   - Log into Twilio Console
   - Go to Account → Auth Tokens
   - Create new Auth Token
   - Copy the new token (shown only once!)

2. **Update Environment Variables:**
   - Update `TWILIO_AUTH_TOKEN` in Railway
   - Save changes

3. **Verify Functionality:**
   - Test sending SMS (MFA code)
   - Monitor Twilio logs for errors
   - Verify messages are delivered

4. **Revoke Old Token:**
   - After 24-48 hours of successful operation
   - Delete old auth token in Twilio Console

**Downtime:** None  
**Rollback:** Revert environment variable if issues occur

## Rotation Checklist

### Pre-Rotation
- [ ] Review rotation schedule (quarterly recommended)
- [ ] Identify all keys that need rotation
- [ ] Generate new keys/secrets
- [ ] Document current key locations
- [ ] Schedule rotation during low-traffic period (if possible)
- [ ] Notify team of upcoming rotation (if team exists)

### During Rotation
- [ ] Update environment variables in Railway
- [ ] Update third-party service configurations (if needed)
- [ ] Deploy changes
- [ ] Monitor application logs
- [ ] Test critical functionality
- [ ] Verify no errors in logs

### Post-Rotation
- [ ] Verify all functionality works
- [ ] Monitor for 24-48 hours
- [ ] Revoke old keys (after verification period)
- [ ] Update key rotation log (see below)
- [ ] Document any issues encountered

## Key Rotation Log

Maintain a log of key rotations for audit purposes:

| Date | Key Type | Rotated By | Notes | Issues |
|------|----------|------------|-------|--------|
| 2025-01-XX | Plaid Secret | [Name] | Quarterly rotation | None |
| 2025-01-XX | JWT Secret | [Name] | Quarterly rotation | Users had to re-login (expected) |

## Emergency Rotation (Security Incident)

If a key is suspected to be compromised:

1. **Immediate Actions:**
   - Rotate the compromised key immediately
   - Don't wait for scheduled rotation
   - Rotate related keys if compromise is widespread

2. **Investigation:**
   - Review access logs
   - Identify scope of compromise
   - Document incident

3. **Communication:**
   - Notify team immediately
   - Update security documentation
   - Consider user notification if data accessed

4. **Post-Incident:**
   - Review security measures
   - Strengthen security if needed
   - Schedule security audit

## Backup Strategy for Keys

**Critical:** Always export environment variables before rotation as backup.

### Export Current Keys (Before Rotation)
```bash
# Export Railway environment variables
# Use Railway CLI or Dashboard → Export
railway variables
```

**Storage:**
- Store in secure, encrypted location
- Use password manager (1Password, LastPass, etc.)
- Keep for 30 days after rotation (then delete)
- Never commit to git repository

## Automation (Future Enhancement)

Consider automating key rotation in the future:
- Automated key generation
- Automated deployment
- Automated testing
- Automated rollback on failure

**Current Status:** Manual rotation (follow this procedure)

## Troubleshooting

### Issue: Application fails after key rotation

**Solution:**
1. Check environment variables are set correctly
2. Verify keys are active in third-party services
3. Check application logs for specific errors
4. Rollback to previous key if necessary
5. Investigate and fix issue before retrying

### Issue: Users can't authenticate after JWT secret rotation

**Solution:**
- This is expected behavior
- Users need to log in again
- If persistent, check JWT secret is set correctly
- Verify authentication middleware is using new secret

### Issue: Webhooks failing after RevenueCat secret rotation

**Solution:**
1. Verify secret matches in Railway and RevenueCat
2. Check webhook authorization header format
3. Test webhook with new secret
4. Review webhook logs in RevenueCat

## Revision History

- **v1.0** (January 2025): Initial key rotation procedure

## References

- [Plaid API Key Management](https://dashboard.plaid.com/team/keys)
- [Supabase API Keys](https://supabase.com/docs/guides/platform/api-keys)
- [Twilio Auth Token Rotation](https://www.twilio.com/docs/iam/keys/api-key)
- [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

