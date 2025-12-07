# Plaid Sandbox Testing Guide

This guide explains how to test the Plaid bank connection feature using Plaid's sandbox environment.

## Prerequisites

- ✅ Backend configured with sandbox credentials (`PLAID_ENV=sandbox`)
- ✅ Native module properly linked in TestFlight build
- ✅ Backend API accessible from mobile app
- ✅ TestFlight build installed on device

## Sandbox Overview

Plaid's sandbox environment allows you to test bank connections without connecting to real financial institutions. It uses test credentials and simulated bank data.

## Test Credentials

### Standard Test Credentials

These credentials work for most sandbox institutions:

- **Username**: `user_good`
- **Password**: `pass_good`

### Additional Test Scenarios

Plaid provides different test credentials for various scenarios:

| Username | Password | Scenario |
|----------|----------|----------|
| `user_good` | `pass_good` | Successful connection |
| `user_good` | `pass_good` | Duplicate connection (same institution) |
| `user_custom` | `pass_good` | Custom institution connection |

## Test Institutions

Common sandbox test institutions include:

1. **First Platypus Bank** - General purpose testing
2. **Test Bank** - Basic testing
3. **First Gingham Credit Union** - Credit union testing
4. **BofA** - Bank of America simulation
5. **Chase** - Chase simulation

**Note**: Available institutions may vary. Search for institutions in the Plaid Link modal to see what's available.

## Step-by-Step Testing Instructions

### 1. Open Plaid Connection

1. Open the Trilo app
2. Navigate to the **Banking** tab
3. Tap the **"Connect Your Bank"** card

### 2. Verify Modal Opens

**Expected Behavior**:
- Plaid Link modal opens (full-screen overlay)
- Search bar appears at top
- List of institutions or search interface displays

**If Modal Doesn't Open**:
- Check console logs for error messages
- Verify native module is loaded (see `PLAID_BUILD_FIX.md`)
- Check backend connectivity (link token creation)

### 3. Search for Test Institution

1. In the Plaid modal, search for **"First Platypus Bank"** or **"Test Bank"**
2. Select the institution from search results

### 4. Enter Test Credentials

1. Enter username: `user_good`
2. Enter password: `pass_good`
3. Tap **Continue** or **Submit**

### 5. Complete Connection Flow

**Expected Flow**:
1. ✅ Credentials accepted
2. ✅ Account selection screen appears
3. ✅ Select account(s) to connect
4. ✅ Success screen appears
5. ✅ Modal closes automatically
6. ✅ Success alert shown in app
7. ✅ Accounts appear in Banking screen

### 6. Verify Data Sync

After successful connection:

1. **Check Accounts**:
   - Account carousel shows connected accounts
   - Account balances display correctly
   - Account names and types are correct

2. **Check Transactions**:
   - Transactions section appears
   - Sample transactions are displayed
   - Transaction details are accurate

3. **Check Sync Status**:
   - Last sync time displays
   - Manual refresh works
   - Auto-sync occurs every 15 minutes

## Console Logging

Watch for these log messages during testing:

### Successful Connection Flow

```
🔗 Initiating Plaid Link connection...
✅ Link token created successfully
🚀 Opening Plaid Link...
✅ Plaid Link modal opened successfully
🎉 Plaid Link Success
   Institution: First Platypus Bank
   Accounts: 2
🔄 Exchanging public token for access token...
✅ Token exchange successful
✅ Accounts fetched successfully
✅ Transactions fetched successfully
```

### Error Scenarios

**Native Module Missing**:
```
❌ Plaid SDK not available
   Native Module Status: Missing
   Possible causes:
   1. Plugin not properly configured in expo.config.js
   2. Native module not linked during build
   ...
```

**Backend Connection Issue**:
```
❌ Link token creation failed
   Status: 500
   ⚠️ Network error detected - check backend connectivity
```

## Testing Different Scenarios

### Test 1: Single Account Connection

1. Connect to "First Platypus Bank"
2. Select one checking account
3. Verify account appears in app
4. Verify transactions sync

### Test 2: Multiple Accounts Connection

1. Connect to "First Platypus Bank"
2. Select multiple accounts (checking + savings)
3. Verify all accounts appear
4. Verify total balance is correct

### Test 3: Multiple Institutions

1. Connect "First Platypus Bank"
2. Connect "Test Bank" (different institution)
3. Verify both institutions appear
4. Verify accounts from both sync correctly

### Test 4: Error Handling

1. **Cancel Flow**: Close modal during connection
   - Expected: Graceful exit, no error
   
2. **Network Error**: Disable WiFi/mobile data
   - Expected: Clear error message, retry option
   
3. **Invalid Credentials**: Use wrong password
   - Expected: Plaid shows error, user can retry

### Test 5: Disconnection

1. Connect an account
2. Swipe to delete or use disconnect option
3. Verify account removed
4. Verify transactions cleared

## Troubleshooting

### Issue: Modal Doesn't Open

**Symptoms**: Tapping "Connect Your Bank" shows error dialog

**Solutions**:
1. Check console logs for native module status
2. Verify TestFlight build was rebuilt with fixes
3. Check backend API connectivity
4. Review `PLAID_BUILD_FIX.md` for build issues

### Issue: Link Token Creation Fails

**Symptoms**: Error about "unable to connect to bank services"

**Solutions**:
1. Verify backend is running and accessible
2. Check backend environment variables (`PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`)
3. Check backend logs for Plaid API errors
4. Verify API URL in `expo.config.js` extra config

### Issue: Connection Completes but No Accounts

**Symptoms**: Success message appears but accounts don't show

**Solutions**:
1. Check backend logs for token exchange
2. Verify accounts endpoint is working
3. Check database for saved accounts
4. Try manual refresh

### Issue: Transactions Don't Appear

**Symptoms**: Accounts show but no transactions

**Solutions**:
1. Check backend logs for transaction sync
2. Verify transactions endpoint is working
3. Check database for saved transactions
4. Plaid sandbox may have limited test transactions

## Sandbox Limitations

Be aware of sandbox environment limitations:

1. **Test Data Only**: All data is simulated, not real
2. **Limited Institutions**: Not all real banks are available
3. **Limited Transactions**: May have fewer test transactions than production
4. **Rate Limits**: Sandbox has rate limits for testing
5. **Reset Period**: Sandbox data may reset periodically

## Production Readiness

Before moving to production:

1. ✅ Test all connection flows thoroughly
2. ✅ Verify error handling works correctly
3. ✅ Test account disconnection
4. ✅ Verify data persistence
5. ✅ Update backend to production Plaid credentials
6. ✅ Update `PLAID_ENV` from `sandbox` to `production`
7. ✅ Test with real financial institutions (if possible)

## Additional Resources

- [Plaid Link Documentation](https://plaid.com/docs/link/)
- [Plaid Sandbox Guide](https://plaid.com/docs/sandbox/)
- [Plaid Test Credentials](https://plaid.com/docs/sandbox/test-credentials/)
- [Plaid Support](https://dashboard.plaid.com/support)

## Support

If you encounter issues not covered in this guide:

1. Check console logs for detailed error messages
2. Review backend logs for API errors
3. Consult `PLAID_BUILD_FIX.md` for build issues
4. Contact Plaid support if issues are Plaid-specific

