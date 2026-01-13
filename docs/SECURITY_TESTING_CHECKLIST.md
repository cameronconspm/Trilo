# Security Testing Checklist

**Last Updated:** January 2025  
**Purpose:** Manual testing procedures for security features

## Prerequisites

- Backend server running and accessible
- Valid test user credentials
- API testing tool (Postman, curl, or similar)
- Access to Supabase dashboard (for checking audit logs)

## Testing Overview

This checklist covers manual testing of:
1. Quota system enforcement
2. Security alerts and monitoring
3. Request security (size limits, timeouts)
4. API versioning

---

## 1. Quota System Testing

### 1.1 Link Token Quota (Hourly Limit: 5)

**Test:** Exceed hourly link token creation limit

**Steps:**
1. Create link token 5 times (should succeed)
2. Attempt 6th creation (should get 429 error)
3. Verify error message indicates quota exceeded
4. Check audit logs for quota violations

**Expected Result:**
- First 5 requests: `200 OK` with link token
- 6th request: `429 Too Many Requests` with quota exceeded message
- Audit log shows quota violation

**API Endpoint:**
```
POST /api/plaid/link/token
Headers: Authorization: Bearer <token>
```

**Check:**
- [ ] First 5 requests succeed
- [ ] 6th request returns 429
- [ ] Error message is clear and helpful
- [ ] Retry-After header is present
- [ ] Quota violation logged in audit logs

---

### 1.2 Account Connection Quota (Lifetime: 10, Daily: 3)

**Test:** Exceed account connection limits

**Steps:**
1. Connect 3 bank accounts (should succeed)
2. Attempt 4th connection (should get 429 for daily limit)
3. Check lifetime quota (if you have 10+ accounts total, should hit lifetime limit)

**Expected Result:**
- First 3 connections: Success
- 4th connection (same day): `429 Too Many Requests` (daily limit)
- If 10+ accounts total: `429 Too Many Requests` (lifetime limit)

**API Endpoint:**
```
POST /api/plaid/link/exchange
Headers: Authorization: Bearer <token>
Body: { "public_token": "...", "selected_account_ids": [...] }
```

**Check:**
- [ ] Daily limit enforced correctly
- [ ] Lifetime limit enforced correctly
- [ ] Error messages are clear
- [ ] Quota violations logged

---

### 1.3 Transaction Sync Quota (Per Account: 4/day, Total: 10/day, Min Interval: 1 hour)

**Test:** Enforce sync frequency limits

**Steps:**
1. Sync an account (should succeed)
2. Immediately sync again (should get 429 - minimum interval)
3. Wait 1+ hour, sync again (should succeed)
4. Sync same account 4 times in one day (4th should succeed)
5. Attempt 5th sync of same account (should get 429 - per account limit)
6. Sync 10 different accounts in one day (10th should succeed)
7. Attempt 11th sync (should get 429 - total daily limit)

**Expected Result:**
- Immediate re-sync: `429 Too Many Requests` (minimum interval)
- After 1 hour: Success
- After 4 syncs of same account: `429` (per account limit)
- After 10 total syncs: `429` (total daily limit)

**API Endpoint:**
```
POST /api/plaid/accounts/:accountId/sync
Headers: Authorization: Bearer <token>
```

**Check:**
- [ ] Minimum interval enforced (1 hour)
- [ ] Per-account daily limit enforced (4/day)
- [ ] Total daily limit enforced (10/day)
- [ ] Error messages indicate which limit was hit
- [ ] Sync tracking stored in database

---

### 1.4 Balance Query Quota (Hourly: 20, Daily: 100)

**Test:** Exceed balance query limits

**Steps:**
1. Query account balance 20 times (should succeed)
2. Attempt 21st query (should get 429 - hourly limit)
3. Wait 1 hour and query again (should succeed)
4. Query 100 times in one day (should succeed)
5. Attempt 101st query (should get 429 - daily limit)

**Expected Result:**
- First 20 queries: Success
- 21st query: `429` (hourly limit)
- After 100 queries in day: `429` (daily limit)

**API Endpoint:**
```
GET /api/plaid/accounts/:accountId/balance
Headers: Authorization: Bearer <token>
```

**Check:**
- [ ] Hourly limit enforced
- [ ] Daily limit enforced
- [ ] Error responses are correct
- [ ] Quotas tracked correctly

---

## 2. Security Alerts Testing

### 2.1 Failed Authentication Alerts

**Test:** Trigger security alert for failed auth attempts

**Steps:**
1. Make 5 failed authentication attempts (invalid tokens)
2. Check logs for security alert
3. Verify alert is logged in audit_logs table
4. Check alert statistics

**Expected Result:**
- After 5 failed attempts: Security alert logged
- Alert appears in audit_logs with event_type `SECURITY_ALERT_FAILED_AUTH_ATTEMPTS`
- Alert statistics show failed auth attempts

**API Endpoint:**
```
GET /api/plaid/accounts
Headers: Authorization: Bearer <invalid_token>
```

**Check:**
- [ ] 5+ failed attempts trigger alert
- [ ] Alert logged in audit_logs
- [ ] Alert severity is HIGH
- [ ] Alert includes user ID and IP address

---

### 2.2 Quota Violation Alerts

**Test:** Trigger alert for excessive quota violations

**Steps:**
1. Trigger 10+ quota violations for same user/quota type in 1 hour
2. Check logs for security alert
3. Verify alert in audit_logs

**Expected Result:**
- After 10 violations: Security alert logged
- Alert event_type: `SECURITY_ALERT_QUOTA_VIOLATIONS`
- Alert severity: MEDIUM

**Check:**
- [ ] 10+ violations trigger alert
- [ ] Alert logged correctly
- [ ] Alert includes quota type and user ID

---

### 2.3 Audit Log Verification

**Test:** Verify security events are logged in audit_logs

**Steps:**
1. Perform various security-relevant actions
2. Check audit_logs table in Supabase
3. Verify events are logged correctly

**Actions to Test:**
- Successful authentication
- Failed authentication
- Quota violations
- Security alerts

**Check:**
- [ ] All security events logged
- [ ] Log entries include required fields (user_id, event_type, timestamp)
- [ ] Sensitive data is redacted in logs
- [ ] Logs are queryable and searchable

---

## 3. Request Security Testing

### 3.1 Request Size Limits (Default: 1mb)

**Test:** Enforce maximum request body size

**Steps:**
1. Create a request body larger than 1mb
2. Send request to any POST endpoint
3. Verify request is rejected

**Expected Result:**
- Request rejected with appropriate error
- Error indicates request too large
- No processing of oversized request

**Test Request:**
```bash
# Using curl
curl -X POST http://localhost:3001/api/plaid/link/token \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"data": "'$(python -c "print('x' * 1024 * 1024)")'"}'
```

**Check:**
- [ ] Request > 1mb rejected
- [ ] Error message is clear
- [ ] Server doesn't process oversized request
- [ ] No security issues from oversized requests

---

### 3.2 Request Timeout (Default: 30 seconds)

**Test:** Enforce request timeout

**Steps:**
1. Create an endpoint that takes > 30 seconds (or mock it)
2. Make request that exceeds timeout
3. Verify timeout error returned

**Expected Result:**
- After 30 seconds: `408 Request Timeout`
- Error message indicates timeout
- Connection closed

**Note:** Testing timeouts requires special setup. In production, ensure long-running operations complete within timeout or use async processing.

**Check:**
- [ ] Timeout enforced (if testable)
- [ ] Error code is 408
- [ ] Error message indicates timeout

---

### 3.3 Rate Limiting

**Test:** Verify rate limiting still works with new security features

**Steps:**
1. Make requests rapidly (exceeding rate limits)
2. Verify rate limiting works
3. Check rate limit headers in responses

**Expected Result:**
- Rate limiting still functions
- Rate limit headers present
- Error messages indicate rate limit exceeded

**Check:**
- [ ] Rate limiting works correctly
- [ ] Headers include rate limit info
- [ ] Errors are appropriate

---

## 4. API Versioning Testing

### 4.1 Backward Compatibility

**Test:** Verify old API routes still work

**Steps:**
1. Make request to `/api/plaid/accounts` (no version)
2. Verify request succeeds
3. Check response includes `API-Version` header

**Expected Result:**
- Request succeeds (backward compatible)
- Response includes `API-Version: v1` header
- No breaking changes

**API Endpoint:**
```
GET /api/plaid/accounts
Headers: Authorization: Bearer <token>
```

**Check:**
- [ ] Old routes work without version
- [ ] API-Version header present
- [ ] Default version is v1

---

### 4.2 Versioned Routes

**Test:** Verify versioned routes work

**Steps:**
1. Make request to `/api/v1/plaid/accounts`
2. Verify request succeeds
3. Check response includes correct version header

**Expected Result:**
- Versioned route works
- Response includes `API-Version: v1` header
- Same functionality as non-versioned route

**API Endpoint:**
```
GET /api/v1/plaid/accounts
Headers: Authorization: Bearer <token>
```

**Check:**
- [ ] Versioned routes work
- [ ] Version header is correct
- [ ] Functionality matches non-versioned route

---

### 4.3 Invalid Version Handling

**Test:** Verify invalid API versions are rejected

**Steps:**
1. Make request to `/api/v2/plaid/accounts` (invalid version)
2. Verify request is rejected
3. Check error message

**Expected Result:**
- Request rejected with `400 Bad Request`
- Error message indicates unsupported version
- Error lists supported versions

**API Endpoint:**
```
GET /api/v2/plaid/accounts
Headers: Authorization: Bearer <token>
```

**Check:**
- [ ] Invalid versions rejected
- [ ] Error code is 400
- [ ] Error message lists supported versions

---

## 5. Integration Testing

### 5.1 End-to-End Quota Flow

**Test:** Complete flow with quota enforcement

**Steps:**
1. Create link token (counts toward quota)
2. Connect bank account (counts toward quota)
3. Sync transactions (counts toward quota)
4. Verify quotas are tracked correctly
5. Exceed quota and verify enforcement

**Check:**
- [ ] Quotas increment correctly
- [ ] Quotas enforced at limits
- [ ] Multiple quota types tracked independently
- [ ] Quota resets work (after period)

---

### 5.2 Security Alert Integration

**Test:** Security alerts triggered and logged correctly

**Steps:**
1. Trigger security events (failed auth, quota violations)
2. Verify alerts are logged
3. Check audit logs for alert entries
4. Verify alert statistics

**Check:**
- [ ] Alerts triggered at thresholds
- [ ] Alerts logged in audit_logs
- [ ] Alert statistics accurate
- [ ] Alert details include necessary information

---

## 6. Database Verification

### 6.1 Quota Tables

**Verify quota tracking in database:**

```sql
-- Check user quotas
SELECT * FROM user_quotas 
WHERE user_id = '<test_user_id>' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check account sync tracking
SELECT * FROM account_sync_tracking 
WHERE user_id = '<test_user_id>' 
ORDER BY last_sync_at DESC 
LIMIT 10;
```

**Check:**
- [ ] Quota records created correctly
- [ ] Counts increment properly
- [ ] Periods tracked correctly
- [ ] Sync tracking works

---

### 6.2 Audit Logs

**Verify security events in audit logs:**

```sql
-- Check security alerts
SELECT * FROM audit_logs 
WHERE event_type LIKE 'SECURITY_ALERT%' 
ORDER BY timestamp DESC 
LIMIT 20;

-- Check quota-related events
SELECT * FROM audit_logs 
WHERE event_type LIKE '%QUOTA%' 
ORDER BY timestamp DESC 
LIMIT 20;
```

**Check:**
- [ ] Security alerts logged
- [ ] Quota events logged
- [ ] Log entries complete and accurate
- [ ] Sensitive data redacted

---

## 7. Performance Testing

### 7.1 Quota Check Performance

**Test:** Verify quota checks don't significantly impact performance

**Steps:**
1. Measure response time with quota checks
2. Compare to baseline (without quota checks)
3. Verify acceptable performance impact

**Check:**
- [ ] Quota checks don't add significant latency
- [ ] Performance is acceptable (< 50ms overhead)
- [ ] Database queries are optimized

---

## Testing Notes

### Environment Setup

- Use test/sandbox environment
- Use test user accounts
- Don't use production data
- Clean up test data after testing

### Test Data

- Create dedicated test users
- Use Plaid sandbox credentials
- Use test bank accounts
- Clean up quotas after testing if needed

### Reporting Issues

When issues are found:
1. Document the issue clearly
2. Note steps to reproduce
3. Include error messages/logs
4. Check audit logs for related events
5. Report with severity level

---

## Quick Reference

### Quota Limits Summary

| Operation | Limit | Period |
|-----------|-------|--------|
| Link Token Creation | 5 | Hour |
| Link Token Creation | 20 | Day |
| Account Connections | 10 | Lifetime |
| Account Connections | 3 | Day |
| Transaction Syncs | 4 | Per Account/Day |
| Transaction Syncs | 10 | Total/Day |
| Balance Queries | 20 | Hour |
| Balance Queries | 100 | Day |
| Account Deletions | 10 | Day |
| Sync Min Interval | 1 hour | Between syncs |

### Alert Thresholds

| Alert Type | Threshold |
|------------|-----------|
| Failed Auth Attempts | 5 |
| Quota Violations | 10/hour |
| Suspicious Patterns | 3 |
| Critical Errors | 20/hour |

### API Endpoints for Testing

- `POST /api/plaid/link/token` - Link token creation
- `POST /api/plaid/link/exchange` - Account connection
- `POST /api/plaid/accounts/:id/sync` - Transaction sync
- `GET /api/plaid/accounts/:id/balance` - Balance query
- `GET /api/plaid/accounts` - List accounts
- `GET /api/v1/plaid/accounts` - Versioned list accounts

