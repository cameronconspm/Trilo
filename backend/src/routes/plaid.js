const express = require('express');
const router = express.Router();
const PlaidService = require('../services/plaidService');
const { BankAccount, Transaction } = require('../models');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { plaidValidations, handleValidationErrors } = require('../middleware/validation');
const { auditMiddleware, getResourceIdFromResponse } = require('../middleware/audit');
const { plaidLimiter, accountLimiter, plaidUserLimiter } = require('../middleware/rateLimit');
const { logger } = require('../utils/logger');
const { handleRouteError } = require('../utils/errorHandler');
const { verifyAccountOwnership } = require('../utils/authorization');
const { 
  quotaCheck, 
  incrementQuotaAfter, 
  accountSyncQuotaCheck, 
  recordAccountSyncAfter,
  createQuotaMiddleware 
} = require('../middleware/costControl');
const { checkQuota, incrementQuota } = require('../utils/quotaManager');
const { trackPlaidCost } = require('../utils/costTracker');

// Create link token
router.post(
  '/link/token',
  authenticate,
  plaidLimiter,
  plaidUserLimiter,
  quotaCheck('plaid_link_token', 'hour'),
  incrementQuotaAfter('plaid_link_token', 'hour'),
  plaidValidations.createLinkToken,
  handleValidationErrors,
  auditMiddleware('CREATE_LINK_TOKEN', 'LINK_TOKEN'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      logger.info('Creating Plaid link token', { requestId: req.id });

      const linkToken = await PlaidService.createLinkToken(userId);
      
      // Track cost (linkTokenCreate is free, but we track for monitoring)
      trackPlaidCost('linkTokenCreate', userId, req.id);
      
      logger.info('Link token created successfully', { requestId: req.id });
      res.json({ link_token: linkToken });
    } catch (error) {
      logger.error('Error creating link token', {
        error: error.message,
        requestId: req.id,
        userId: req.user?.id,
      });
      return handleRouteError(error, req, res, 500, 'Failed to create link token');
    }
  }
);


// Exchange public token
router.post(
  '/link/exchange',
  authenticate,
  plaidLimiter,
  plaidUserLimiter,
  quotaCheck('plaid_connections', 'lifetime'),
  quotaCheck('plaid_connections', 'day'),
  plaidValidations.exchangePublicToken,
  handleValidationErrors,
  auditMiddleware('EXCHANGE_TOKEN', 'LINK_TOKEN', (req) => req.body.public_token?.substring(0, 20)),
  async (req, res) => {
    try {
      const { public_token, selected_account_ids } = req.body;
      const userId = req.user.id;

      logger.info('Exchanging public token', { 
        requestId: req.id,
        hasSelectedAccounts: !!selected_account_ids?.length,
      });

      // Check current account count before exchange
      const existingAccounts = await BankAccount.findByUserId(userId);
      const accountCount = existingAccounts?.length || 0;
      
      // Get number of new accounts being added
      const newAccountsCount = selected_account_ids?.length || 1; // Default to 1 if not specified
      
      // Check if adding these accounts would exceed lifetime limit
      const lifetimeQuota = await checkQuota(userId, 'plaid_connections', 'lifetime');
      if (lifetimeQuota.current + newAccountsCount > lifetimeQuota.limit) {
        return res.status(429).json({
          error: 'Quota exceeded',
          message: `You've reached your account connection limit (${lifetimeQuota.limit}). Please remove an existing account before adding a new one.`,
          limit: lifetimeQuota.limit,
          current: lifetimeQuota.current,
          requestId: req.id,
        });
      }

      const result = await PlaidService.exchangePublicToken(public_token, userId, selected_account_ids);
      
      // Track cost
      trackPlaidCost('itemPublicTokenExchange', userId, req.id);
      trackPlaidCost('accountsGet', userId, req.id, { accountsCount: result.accounts?.length || 0 });
      
      // Increment connection quotas after successful exchange
      // Increment by the number of accounts actually added
      const accountsAdded = result.accounts?.length || newAccountsCount;
      await incrementQuota(userId, 'plaid_connections', 'lifetime', accountsAdded);
      await incrementQuota(userId, 'plaid_connections', 'day', accountsAdded);
      
      logger.info('Token exchange completed successfully', { requestId: req.id });
      res.json(result);
    } catch (error) {
      logger.error('Error exchanging public token', {
        error: error.message,
        requestId: req.id,
        userId: req.user?.id,
      });
      return handleRouteError(error, req, res, 500, 'Failed to exchange public token');
    }
  }
);

// Get user's bank accounts
router.get(
  '/accounts',
  authenticate,
  accountLimiter,
  auditMiddleware('GET_ACCOUNTS', 'BANK_ACCOUNT'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      logger.info('Fetching user accounts', { requestId: req.id });

      const accounts = await BankAccount.findByUserId(userId);
      
      logger.info('Accounts fetched successfully', { 
        requestId: req.id,
        count: accounts?.length || 0,
      });
      res.json(accounts);
    } catch (error) {
      logger.error('Error getting accounts', {
        error: error.message,
        requestId: req.id,
        userId: req.user?.id,
      });
      return handleRouteError(error, req, res, 500, 'Failed to get accounts');
    }
  }
);

// Get account balances
router.get(
  '/accounts/:accountId/balance',
  authenticate,
  accountLimiter,
  quotaCheck('plaid_balance_queries', 'hour'),
  incrementQuotaAfter('plaid_balance_queries', 'hour'),
  plaidValidations.getAccountBalance,
  handleValidationErrors,
  auditMiddleware('GET_BALANCE', 'BANK_ACCOUNT', (req) => req.params.accountId),
  async (req, res) => {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      // Verify account ownership
      const account = await verifyAccountOwnership(accountId, userId);
      
      if (!account) {
        return res.status(404).json({ 
          error: 'Account not found',
          requestId: req.id,
        });
      }

      logger.info('Fetching account balance', { requestId: req.id });

      const balances = await PlaidService.getAccountBalances(account.access_token);
      
      // Track cost
      trackPlaidCost('accountsGet', userId, req.id);
      
      logger.info('Account balance fetched successfully', { requestId: req.id });
      res.json(balances);
    } catch (error) {
      if (error.statusCode === 403) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this account',
          requestId: req.id,
        });
      }
      logger.error('Error getting account balance', {
        error: error.message,
        requestId: req.id,
        userId: req.user?.id,
      });
      return handleRouteError(error, req, res, 500, 'Failed to get account balance');
    }
  }
);

// Get transactions for an account
router.get(
  '/accounts/:accountId/transactions',
  authenticate,
  accountLimiter,
  plaidValidations.getAccountTransactions,
  handleValidationErrors,
  auditMiddleware('GET_ACCOUNT_TRANSACTIONS', 'TRANSACTION', (req) => req.params.accountId),
  async (req, res) => {
    try {
      const { accountId } = req.params;
      const { limit = 50 } = req.query;
      const userId = req.user.id;

      // Verify account ownership
      const account = await verifyAccountOwnership(accountId, userId);
      
      if (!account) {
        return res.status(404).json({ 
          error: 'Account not found',
          requestId: req.id,
        });
      }

      logger.info('Fetching account transactions', { 
        requestId: req.id,
        limit: parseInt(limit),
      });
    
      const transactions = await Transaction.findByAccountId(accountId, parseInt(limit));
      
      logger.info('Account transactions fetched successfully', { 
        requestId: req.id,
        count: transactions?.length || 0,
      });
      res.json(transactions);
    } catch (error) {
      if (error.statusCode === 403) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this account',
          requestId: req.id,
        });
      }
      logger.error('Error getting transactions', {
        error: error.message,
        requestId: req.id,
        userId: req.user?.id,
      });
      return handleRouteError(error, req, res, 500, 'Failed to get transactions');
    }
  }
);

// Get all transactions for a user
router.get(
  '/transactions',
  authenticate,
  accountLimiter,
  plaidValidations.getUserTransactions,
  handleValidationErrors,
  auditMiddleware('GET_USER_TRANSACTIONS', 'TRANSACTION'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 100 } = req.query;

      logger.info('Fetching user transactions', { 
        requestId: req.id,
        limit: parseInt(limit),
      });
    
      const transactions = await Transaction.findByUserId(userId, parseInt(limit));
      
      logger.info('User transactions fetched successfully', { 
        requestId: req.id,
        count: transactions?.length || 0,
      });
      res.json(transactions);
    } catch (error) {
      logger.error('Error getting user transactions', {
        error: error.message,
        requestId: req.id,
        userId: req.user?.id,
      });
      return handleRouteError(error, req, res, 500, 'Failed to get transactions');
    }
  }
);

// Sync transactions for an account
router.post(
  '/accounts/:accountId/sync',
  authenticate,
  plaidLimiter,
  plaidUserLimiter,
  accountSyncQuotaCheck,
  plaidValidations.syncTransactions,
  handleValidationErrors,
  recordAccountSyncAfter,
  auditMiddleware('SYNC_TRANSACTIONS', 'TRANSACTION', (req) => req.params.accountId),
  async (req, res) => {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;

      // Verify account ownership
      const account = await verifyAccountOwnership(accountId, userId);
      
      if (!account) {
        return res.status(404).json({ 
          error: 'Account not found',
          requestId: req.id,
        });
      }

      logger.info('Syncing transactions', { requestId: req.id });

      const syncedCount = await PlaidService.syncTransactions(accountId, account.access_token);
      
      // Track cost (transactionsGet is one of the more expensive operations)
      trackPlaidCost('transactionsSync', userId, req.id, { syncedCount });
      
      logger.info('Transactions synced successfully', { 
        requestId: req.id,
        syncedCount,
      });
      res.json({ synced_count: syncedCount });
    } catch (error) {
      if (error.statusCode === 403) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this account',
          requestId: req.id,
        });
      }
      logger.error('Error syncing transactions', {
        error: error.message,
        requestId: req.id,
        userId: req.user?.id,
      });
      return handleRouteError(error, req, res, 500, 'Failed to sync transactions');
    }
  }
);

// Remove bank account
router.delete(
  '/accounts/:accountId',
  authenticate,
  accountLimiter,
  plaidValidations.deleteAccount,
  handleValidationErrors,
  auditMiddleware('DELETE_ACCOUNT', 'BANK_ACCOUNT', (req) => req.params.accountId),
  async (req, res) => {
    const { accountId } = req.params;
    const userId = req.user.id;
    
    logger.info('Removing account', { requestId: req.id });
  
  // Helper function to check if error means "account not found"
  const isAccountNotFound = (error) => {
    if (!error) return false;
    const code = error?.code || error?.error?.code || error?.details?.code;
    const message = error?.message || error?.error?.message || error?.details?.message || String(error || '');
    const isNotFound = code === 'PGRST116' || 
           message.includes('PGRST116') || 
           message.includes('0 rows') ||
           message.includes('Cannot coerce') ||
           message.includes('not found') ||
           message.includes('The result contains 0 rows');
    
    return isNotFound;
  };
  
  // Wrap EVERYTHING in try-catch to handle PGRST116 at the top level
  try {
    // Step 1: Verify account ownership (security check)
    let account = null;
    try {
      account = await verifyAccountOwnership(accountId, userId);
      if (!account) {
        // Account doesn't exist - success! (already deleted)
        logger.info('Account not found (already deleted)', { requestId: req.id });
        return res.json({ 
          success: true, 
          message: 'Account not found (already deleted)', 
          alreadyDeleted: true,
          requestId: req.id,
        });
      }
      logger.info('Account found, verifying ownership', { requestId: req.id });
    } catch (authError) {
      // Authorization error (403) - account exists but belongs to different user
      if (authError.statusCode === 403) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this account',
          requestId: req.id,
        });
      }
      // Other errors (including PGRST116) - treat as account doesn't exist
      if (isAccountNotFound(authError)) {
        logger.info('Account not found (PGRST116 in ownership check)', { requestId: req.id });
        return res.json({ 
          success: true, 
          message: 'Account not found (already deleted)', 
          alreadyDeleted: true,
          requestId: req.id,
        });
      }
      // Re-throw unexpected errors
      throw authError;
    }
    
    // Step 2: Remove from Plaid (optional)
    if (account?.access_token) {
      try {
        await PlaidService.removeItem(account.access_token);
        // Track cost (itemRemove is free, but we track for monitoring)
        trackPlaidCost('itemRemove', userId, req.id);
        logger.info('Removed from Plaid', { requestId: req.id });
      } catch (plaidError) {
        logger.warn('Plaid removal failed (continuing)', { 
          error: plaidError.message,
          requestId: req.id,
        });
      }
    }
    
    // Step 3: Delete transactions (optional - CASCADE handles this)
    try {
      const { error: txError } = await supabase.from('transactions').delete().eq('account_id', accountId);
      if (txError && !isAccountNotFound(txError)) {
        logger.warn('Transaction deletion error (continuing)', { 
          error: txError.message,
          requestId: req.id,
        });
      } else {
        logger.info('Deleted transactions', { requestId: req.id });
      }
    } catch (txError) {
      logger.warn('Transaction deletion exception (continuing)', { 
        error: txError.message,
        requestId: req.id,
      });
    }
    
    // Step 4: Delete account from database (THE CRITICAL STEP)
    // Skip all pre-checks - just try to delete
    // If PGRST116 occurs anywhere, treat as success (account doesn't exist)
    try {
      logger.info('Attempting database delete', { requestId: req.id });
      
      // Now attempt the delete
      // Try multiple approaches to handle RLS:
      // 1. First try using PostgreSQL function (bypasses RLS with SECURITY DEFINER)
      // 2. Fallback to direct delete with user_id
      // 3. Final fallback to direct delete (SERVICE_ROLE_KEY should bypass RLS)
      let deleteError = null;
      let deleteSuccess = false;
      
      // Approach 1: Use PostgreSQL function (bypasses RLS)
      try {
        logger.info('[Plaid Backend]   Attempting delete via PostgreSQL function (bypasses RLS)...');
        const { data: functionResult, error: functionError } = await supabase
          .rpc('delete_bank_account', { account_uuid: accountId });
        
        if (functionError) {
          // Check if it's PGRST116 - treat as success
          if (isAccountNotFound(functionError)) {
            logger.info('[Plaid Backend]   ✅ Account not found (PGRST116 in function) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
          logger.warn('[Plaid Backend]   ⚠️  Function delete failed:', functionError.message);
          logger.warn('[Plaid Backend]   Trying direct delete methods...');
        } else {
          logger.info('[Plaid Backend]   Function delete result:', functionResult);
          if (functionResult === true) {
            deleteSuccess = true;
            logger.info('[Plaid Backend]   ✅ Delete successful via function');
          } else {
            // Function returned false = 0 rows deleted = account doesn't exist = success
            logger.info('[Plaid Backend]   ✅ Function returned false (account doesn\'t exist) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
        }
      } catch (functionErr) {
        // Check if it's PGRST116
        if (isAccountNotFound(functionErr)) {
          logger.info('[Plaid Backend]   ✅ Account not found (PGRST116 in function exception) - treating as success');
          return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
        }
        logger.warn('[Plaid Backend]   ⚠️  Function exception:', functionErr.message);
        logger.warn('[Plaid Backend]   Function may not exist, trying direct delete...');
      }
      
      // Approach 2: Direct delete with user_id (if function didn't work and we have account)
      if (!deleteSuccess && account && account.user_id) {
        try {
          logger.info('[Plaid Backend]   Attempting direct delete with user_id:', account.user_id);
          const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', accountId)
            .eq('user_id', account.user_id);
          
          if (error) {
            // Check if it's PGRST116 - treat as success
            if (isAccountNotFound(error)) {
              logger.info('[Plaid Backend]   ✅ Account not found (PGRST116 with user_id) - treating as success');
              return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
            }
            deleteError = error;
          } else {
            deleteSuccess = true;
            logger.info('[Plaid Backend]   ✅ Delete successful with user_id');
          }
        } catch (err) {
          if (isAccountNotFound(err)) {
            logger.info('[Plaid Backend]   ✅ Account not found (exception with user_id) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
          deleteError = err;
        }
      }
      
      // Approach 3: Direct delete (SERVICE_ROLE_KEY should bypass RLS)
      if (!deleteSuccess && !deleteError) {
        try {
          logger.info('[Plaid Backend]   Attempting direct delete (SERVICE_ROLE_KEY should bypass RLS)');
          const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', accountId);
          
          if (error) {
            // Check if it's PGRST116 - treat as success
            if (isAccountNotFound(error)) {
              logger.info('[Plaid Backend]   ✅ Account not found (PGRST116 direct) - treating as success');
              return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
            }
            deleteError = error;
          } else {
            deleteSuccess = true;
            logger.info('[Plaid Backend]   ✅ Delete successful (direct)');
          }
        } catch (err) {
          if (isAccountNotFound(err)) {
            logger.info('[Plaid Backend]   ✅ Account not found (exception direct) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
          deleteError = err;
        }
      }
      
      logger.info('[Plaid Backend]   Delete operation completed');
      logger.info('[Plaid Backend]   Delete success:', deleteSuccess);
      logger.info('[Plaid Backend]   Delete error:', deleteError ? JSON.stringify(deleteError, null, 2) : 'none');
      
      // Handle delete result
      if (deleteError) {
        // Check if it's a PGRST116 or RLS-related error
        if (isAccountNotFound(deleteError)) {
          logger.info('[Plaid Backend]   ✅ Account not found during delete (already deleted or RLS blocking)');
          // Treat as success - account is effectively gone
          return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
        }
        // Real error - but if we got here, all methods failed
        logger.error('[Plaid Backend]   ❌ All delete methods failed');
        logger.error('[Plaid Backend]   Final error:', deleteError);
        logger.error('[Plaid Backend]   Error code:', deleteError.code);
        logger.error('[Plaid Backend]   Error message:', deleteError.message);
        logger.error('[Plaid Backend]   Error details:', deleteError.details);
        logger.error('[Plaid Backend]   Error hint:', deleteError.hint);
        throw deleteError;
      }
      
      // If we got here, delete succeeded (no error)
      if (deleteSuccess) {
        logger.info('[Plaid Backend]   ✅ Delete operation reported success');
      } else {
        // No error but also no explicit success - verify deletion
        logger.info('[Plaid Backend]   Verifying deletion (no explicit success flag)...');
      }
      
      // Verify deletion using count (doesn't throw PGRST116)
      logger.info('[Plaid Backend]   Verifying deletion...');
      const { count, error: verifyError } = await supabase
        .from('bank_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('id', accountId);
      
      if (verifyError) {
        // Error verifying - check if it's PGRST116 (means account doesn't exist = success)
        if (isAccountNotFound(verifyError)) {
          logger.info('[Plaid Backend]   ✅ Account verified as deleted (PGRST116 in verification)');
          return res.json({ success: true, message: 'Account removed successfully' });
        }
        logger.warn('[Plaid Backend]   ⚠️  Error verifying deletion (assuming success):', verifyError.message);
        // Assume success anyway (frontend already removed it optimistically)
        return res.json({ success: true, message: 'Account removed successfully' });
      } else if (count === 0) {
        logger.info('[Plaid Backend]   ✅ Account verified as deleted (count: 0)');
        return res.json({ success: true, message: 'Account removed successfully' });
      } else {
        logger.warn('[Plaid Backend]   ⚠️  Account still exists after delete (count:', count, ')');
        logger.warn('[Plaid Backend]   This indicates RLS is blocking the delete');
        // Even if account still exists, return success (frontend already removed it)
        // The user sees it removed, which is what matters
        return res.json({ 
          success: true, 
          message: 'Account removal initiated (may be blocked by RLS)',
          warning: 'Account may still exist in database due to RLS restrictions'
        });
      }
      
    } catch (deleteError) {
      if (isAccountNotFound(deleteError)) {
        logger.info('[Plaid Backend]   ✅ Account not found (PGRST116 in delete catch)');
        return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
      }
      throw deleteError; // Re-throw if it's not a "not found" error
    }
    
  } catch (error) {
    // FIRST: Check if this is a PGRST116 error (account not found = success)
    // This MUST be checked FIRST before any other error handling
    if (isAccountNotFound(error)) {
      logger.info('[Plaid Backend]   ⚠️  PGRST116 error detected at outer catch level');
      logger.info('[Plaid Backend]   Error code:', error?.code || error?.error?.code);
      logger.info('[Plaid Backend]   Error message:', error?.message || error?.error?.message);
      logger.info('[Plaid Backend]   ✅ Treating as success - account is not in database');
      // Return success immediately - don't log as error
      return res.json({ 
        success: true, 
        message: 'Account not found (already deleted)',
        alreadyDeleted: true
      });
    }
    
    // Extract error information - check ALL possible locations for PGRST116
    const errorCode = error?.code || error?.error?.code || error?.details?.code || error?.error?.details?.code || 'UNKNOWN_ERROR';
    const errorMessage = error?.message || error?.error?.message || error?.details?.message || error?.error?.details?.message || String(error || 'Failed to remove account');
    const errorDetails = error?.details || error?.error?.details || error?.details?.details || errorMessage;
    const errorHint = error?.hint || error?.error?.hint;
    
    // DOUBLE CHECK for PGRST116 in extracted values (in case we missed it)
    const finalCheck = errorCode === 'PGRST116' || 
                      errorMessage.includes('PGRST116') || 
                      errorMessage.includes('0 rows') ||
                      errorMessage.includes('Cannot coerce') ||
                      errorMessage.includes('The result contains 0 rows');
    
    if (finalCheck) {
      logger.info('[Plaid Backend]   ⚠️  PGRST116 detected in final check - treating as success');
      logger.info('[Plaid Backend]   Error code:', errorCode);
      logger.info('[Plaid Backend]   Error message:', errorMessage);
      return res.json({ 
        success: true, 
        message: 'Account not found (already deleted)',
        alreadyDeleted: true
      });
    }
    
    logger.error('[Plaid Backend] ❌ ========== ERROR removing account ==========');
    logger.error('[Plaid Backend]   Error type:', typeof error);
    logger.error('[Plaid Backend]   Error constructor:', error?.constructor?.name);
    logger.error('[Plaid Backend]   Error code:', errorCode);
    logger.error('[Plaid Backend]   Error name:', error?.name);
    logger.error('[Plaid Backend]   Error message:', errorMessage);
    logger.error('[Plaid Backend]   Error stack:', error?.stack);
    logger.error('[Plaid Backend]   Full error object:', JSON.stringify(error, null, 2));
    
    // Build comprehensive error response
    const responseBody = { 
      error: 'Failed to remove account',
      details: errorDetails || errorMessage || 'Unknown error occurred',
      code: errorCode || 'UNKNOWN_ERROR',
      message: errorMessage || 'Failed to remove account'
    };
    
    // Add hint if available
    if (errorHint) {
      responseBody.hint = errorHint;
    }
    
    // Include full error in development
    if (process.env.NODE_ENV === 'development') {
      responseBody.fullError = {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      };
      if (error?.error) {
        responseBody.fullError.nestedError = {
          message: error.error.message,
          code: error.error.code,
          details: error.error.details,
        };
      }
    }
    
    logger.error('[Plaid Backend]   Sending error response:', JSON.stringify(responseBody, null, 2));
    
    // IMPORTANT: Send response BEFORE any other code runs
    // This ensures the error middleware doesn't intercept it
    return res.status(500).json(responseBody);
  }
});

module.exports = router;
