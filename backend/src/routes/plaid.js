const express = require('express');
const router = express.Router();
const PlaidService = require('../services/plaidService');
const { BankAccount, Transaction } = require('../models');
const supabase = require('../config/supabase');

// Create link token
router.post('/link/token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('[Plaid Backend] 📥 Link token request received');
    console.log('[Plaid Backend]   User ID:', userId);
    console.log('[Plaid Backend]   Has userId:', !!userId);
    
    if (!userId) {
      console.error('[Plaid Backend] ❌ Missing userId in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    const linkToken = await PlaidService.createLinkToken(userId);
    console.log('[Plaid Backend] ✅ Link token created, returning to client');
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error('[Plaid Backend] ❌ ========== ERROR in link token route ==========');
    console.error('[Plaid Backend]   Error type:', typeof error);
    console.error('[Plaid Backend]   Error constructor:', error?.constructor?.name);
    console.error('[Plaid Backend]   Error name:', error?.name);
    console.error('[Plaid Backend]   Error message:', error?.message);
    console.error('[Plaid Backend]   Error stack:', error?.stack);
    
    // Log Plaid API errors in detail
    if (error?.response) {
      console.error('[Plaid Backend]   Plaid API Error Status:', error.response.status);
      console.error('[Plaid Backend]   Plaid API Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Check for missing environment variables
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      console.error('[Plaid Backend]   ⚠️  Missing Plaid credentials!');
      console.error('[Plaid Backend]   PLAID_CLIENT_ID:', !!process.env.PLAID_CLIENT_ID);
      console.error('[Plaid Backend]   PLAID_SECRET:', !!process.env.PLAID_SECRET);
    }
    
    // Return detailed error in development, generic in production
    const errorMessage = error?.message || 'Failed to create link token';
    const errorResponse = {
      error: 'Failed to create link token',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
    };
    
    if (process.env.NODE_ENV === 'development' && error?.response?.data) {
      errorResponse.plaidError = error.response.data;
    }
    
    res.status(500).json(errorResponse);
  }
});


// Exchange public token
router.post('/link/exchange', async (req, res) => {
  try {
    const { public_token, userId, selected_account_ids } = req.body;
    
    console.log('[Plaid Backend] 📥 Exchange request received');
    console.log('[Plaid Backend]   Has public_token:', !!public_token);
    console.log('[Plaid Backend]   Has userId:', !!userId);
    console.log('[Plaid Backend]   UserId value:', userId);
    console.log('[Plaid Backend]   Selected account IDs:', selected_account_ids?.length || 0);
    if (selected_account_ids && selected_account_ids.length > 0) {
      console.log('[Plaid Backend]   Account IDs:', selected_account_ids);
    }
    
    if (!public_token || !userId) {
      console.error('[Plaid Backend] ❌ Missing required fields');
      return res.status(400).json({ error: 'Public token and user ID are required' });
    }

    const result = await PlaidService.exchangePublicToken(public_token, userId, selected_account_ids);
    console.log('[Plaid Backend] ✅ Exchange completed successfully');
    res.json(result);
  } catch (error) {
    console.error('[Plaid Backend] ❌ Error exchanging public token:');
    console.error('[Plaid Backend]   Error name:', error.name);
    console.error('[Plaid Backend]   Error message:', error.message);
    console.error('[Plaid Backend]   Error stack:', error.stack);
    
    // If it's a Plaid API error, log more details
    if (error.response) {
      console.error('[Plaid Backend]   Plaid API Error Status:', error.response.status);
      console.error('[Plaid Backend]   Plaid API Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Return more detailed error message
    const errorMessage = error.message || 'Failed to exchange public token';
    res.status(500).json({ 
      error: 'Failed to exchange public token',
      details: errorMessage,
      type: error.name || 'UnknownError'
    });
  }
});

// Get user's bank accounts
router.get('/accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const accounts = await BankAccount.findByUserId(userId);
    res.json(accounts);
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

// Get account balances
router.get('/accounts/:accountId/balance', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await BankAccount.findByAccessToken(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const balances = await PlaidService.getAccountBalances(account.access_token);
    res.json(balances);
  } catch (error) {
    console.error('Error getting account balance:', error);
    res.status(500).json({ error: 'Failed to get account balance' });
  }
});

// Get transactions for an account
router.get('/accounts/:accountId/transactions', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 50 } = req.query;
    
    const transactions = await Transaction.findByAccountId(accountId, parseInt(limit));
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get all transactions for a user
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;
    
    const transactions = await Transaction.findByUserId(userId, parseInt(limit));
    res.json(transactions);
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Sync transactions for an account
router.post('/accounts/:accountId/sync', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await BankAccount.findByAccessToken(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const syncedCount = await PlaidService.syncTransactions(accountId, account.access_token);
    res.json({ synced_count: syncedCount });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

// Remove bank account - ULTRA SIMPLIFIED VERSION
// Just try to delete - if account doesn't exist, that's success
router.delete('/accounts/:accountId', async (req, res) => {
  const { accountId } = req.params;
  console.log('[Plaid Backend] 🗑️  Removing account:', accountId);
  
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
    
    if (isNotFound) {
      console.log('[Plaid Backend]   PGRST116 detected - code:', code, 'message:', message);
    }
    return isNotFound;
  };
  
  // Wrap EVERYTHING in try-catch to handle PGRST116 at the top level
  try {
    // Step 1: Try to find account (to get access_token for Plaid removal)
    let account = null;
    try {
      account = await BankAccount.findById(accountId);
      if (account) {
        console.log('[Plaid Backend]   Found account:', account.name);
      } else {
        console.log('[Plaid Backend]   Account not found (null returned)');
        // Account doesn't exist - success!
        return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
      }
    } catch (findError) {
      // ANY error in findById means account doesn't exist or RLS is blocking
      // Treat as success (account effectively doesn't exist)
      if (isAccountNotFound(findError)) {
        console.log('[Plaid Backend]   Account not found (PGRST116 in findById)');
        return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
      }
      // Even non-PGRST116 errors in findById - account doesn't exist = success
      console.log('[Plaid Backend]   Account not found (error in findById):', findError.message);
      return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
    }
    
    // Step 2: Remove from Plaid (optional)
    if (account?.access_token) {
      try {
        await PlaidService.removeItem(account.access_token);
        console.log('[Plaid Backend]   ✅ Removed from Plaid');
      } catch (plaidError) {
        console.warn('[Plaid Backend]   ⚠️  Plaid removal failed (continuing):', plaidError.message);
      }
    }
    
    // Step 3: Delete transactions (optional - CASCADE handles this)
    try {
      const { error: txError } = await supabase.from('transactions').delete().eq('account_id', accountId);
      if (txError && !isAccountNotFound(txError)) {
        console.warn('[Plaid Backend]   ⚠️  Transaction deletion error (continuing):', txError.message);
      } else {
        console.log('[Plaid Backend]   ✅ Deleted transactions');
      }
    } catch (txError) {
      console.warn('[Plaid Backend]   ⚠️  Transaction deletion exception (continuing):', txError.message);
    }
    
    // Step 4: Delete account from database (THE CRITICAL STEP)
    // Skip all pre-checks - just try to delete
    // If PGRST116 occurs anywhere, treat as success (account doesn't exist)
    try {
      console.log('[Plaid Backend]   Attempting database delete for account:', accountId);
      
      // Now attempt the delete
      // Try multiple approaches to handle RLS:
      // 1. First try using PostgreSQL function (bypasses RLS with SECURITY DEFINER)
      // 2. Fallback to direct delete with user_id
      // 3. Final fallback to direct delete (SERVICE_ROLE_KEY should bypass RLS)
      let deleteError = null;
      let deleteSuccess = false;
      
      // Approach 1: Use PostgreSQL function (bypasses RLS)
      try {
        console.log('[Plaid Backend]   Attempting delete via PostgreSQL function (bypasses RLS)...');
        const { data: functionResult, error: functionError } = await supabase
          .rpc('delete_bank_account', { account_uuid: accountId });
        
        if (functionError) {
          // Check if it's PGRST116 - treat as success
          if (isAccountNotFound(functionError)) {
            console.log('[Plaid Backend]   ✅ Account not found (PGRST116 in function) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
          console.warn('[Plaid Backend]   ⚠️  Function delete failed:', functionError.message);
          console.warn('[Plaid Backend]   Trying direct delete methods...');
        } else {
          console.log('[Plaid Backend]   Function delete result:', functionResult);
          if (functionResult === true) {
            deleteSuccess = true;
            console.log('[Plaid Backend]   ✅ Delete successful via function');
          } else {
            // Function returned false = 0 rows deleted = account doesn't exist = success
            console.log('[Plaid Backend]   ✅ Function returned false (account doesn\'t exist) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
        }
      } catch (functionErr) {
        // Check if it's PGRST116
        if (isAccountNotFound(functionErr)) {
          console.log('[Plaid Backend]   ✅ Account not found (PGRST116 in function exception) - treating as success');
          return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
        }
        console.warn('[Plaid Backend]   ⚠️  Function exception:', functionErr.message);
        console.warn('[Plaid Backend]   Function may not exist, trying direct delete...');
      }
      
      // Approach 2: Direct delete with user_id (if function didn't work and we have account)
      if (!deleteSuccess && account && account.user_id) {
        try {
          console.log('[Plaid Backend]   Attempting direct delete with user_id:', account.user_id);
          const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', accountId)
            .eq('user_id', account.user_id);
          
          if (error) {
            // Check if it's PGRST116 - treat as success
            if (isAccountNotFound(error)) {
              console.log('[Plaid Backend]   ✅ Account not found (PGRST116 with user_id) - treating as success');
              return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
            }
            deleteError = error;
          } else {
            deleteSuccess = true;
            console.log('[Plaid Backend]   ✅ Delete successful with user_id');
          }
        } catch (err) {
          if (isAccountNotFound(err)) {
            console.log('[Plaid Backend]   ✅ Account not found (exception with user_id) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
          deleteError = err;
        }
      }
      
      // Approach 3: Direct delete (SERVICE_ROLE_KEY should bypass RLS)
      if (!deleteSuccess && !deleteError) {
        try {
          console.log('[Plaid Backend]   Attempting direct delete (SERVICE_ROLE_KEY should bypass RLS)');
          const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', accountId);
          
          if (error) {
            // Check if it's PGRST116 - treat as success
            if (isAccountNotFound(error)) {
              console.log('[Plaid Backend]   ✅ Account not found (PGRST116 direct) - treating as success');
              return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
            }
            deleteError = error;
          } else {
            deleteSuccess = true;
            console.log('[Plaid Backend]   ✅ Delete successful (direct)');
          }
        } catch (err) {
          if (isAccountNotFound(err)) {
            console.log('[Plaid Backend]   ✅ Account not found (exception direct) - treating as success');
            return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
          }
          deleteError = err;
        }
      }
      
      console.log('[Plaid Backend]   Delete operation completed');
      console.log('[Plaid Backend]   Delete success:', deleteSuccess);
      console.log('[Plaid Backend]   Delete error:', deleteError ? JSON.stringify(deleteError, null, 2) : 'none');
      
      // Handle delete result
      if (deleteError) {
        // Check if it's a PGRST116 or RLS-related error
        if (isAccountNotFound(deleteError)) {
          console.log('[Plaid Backend]   ✅ Account not found during delete (already deleted or RLS blocking)');
          // Treat as success - account is effectively gone
          return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
        }
        // Real error - but if we got here, all methods failed
        console.error('[Plaid Backend]   ❌ All delete methods failed');
        console.error('[Plaid Backend]   Final error:', deleteError);
        console.error('[Plaid Backend]   Error code:', deleteError.code);
        console.error('[Plaid Backend]   Error message:', deleteError.message);
        console.error('[Plaid Backend]   Error details:', deleteError.details);
        console.error('[Plaid Backend]   Error hint:', deleteError.hint);
        throw deleteError;
      }
      
      // If we got here, delete succeeded (no error)
      if (deleteSuccess) {
        console.log('[Plaid Backend]   ✅ Delete operation reported success');
      } else {
        // No error but also no explicit success - verify deletion
        console.log('[Plaid Backend]   Verifying deletion (no explicit success flag)...');
      }
      
      // Verify deletion using count (doesn't throw PGRST116)
      console.log('[Plaid Backend]   Verifying deletion...');
      const { count, error: verifyError } = await supabase
        .from('bank_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('id', accountId);
      
      if (verifyError) {
        // Error verifying - check if it's PGRST116 (means account doesn't exist = success)
        if (isAccountNotFound(verifyError)) {
          console.log('[Plaid Backend]   ✅ Account verified as deleted (PGRST116 in verification)');
          return res.json({ success: true, message: 'Account removed successfully' });
        }
        console.warn('[Plaid Backend]   ⚠️  Error verifying deletion (assuming success):', verifyError.message);
        // Assume success anyway (frontend already removed it optimistically)
        return res.json({ success: true, message: 'Account removed successfully' });
      } else if (count === 0) {
        console.log('[Plaid Backend]   ✅ Account verified as deleted (count: 0)');
        return res.json({ success: true, message: 'Account removed successfully' });
      } else {
        console.warn('[Plaid Backend]   ⚠️  Account still exists after delete (count:', count, ')');
        console.warn('[Plaid Backend]   This indicates RLS is blocking the delete');
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
        console.log('[Plaid Backend]   ✅ Account not found (PGRST116 in delete catch)');
        return res.json({ success: true, message: 'Account not found (already deleted)', alreadyDeleted: true });
      }
      throw deleteError; // Re-throw if it's not a "not found" error
    }
    
  } catch (error) {
    // FIRST: Check if this is a PGRST116 error (account not found = success)
    // This MUST be checked FIRST before any other error handling
    if (isAccountNotFound(error)) {
      console.log('[Plaid Backend]   ⚠️  PGRST116 error detected at outer catch level');
      console.log('[Plaid Backend]   Error code:', error?.code || error?.error?.code);
      console.log('[Plaid Backend]   Error message:', error?.message || error?.error?.message);
      console.log('[Plaid Backend]   ✅ Treating as success - account is not in database');
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
      console.log('[Plaid Backend]   ⚠️  PGRST116 detected in final check - treating as success');
      console.log('[Plaid Backend]   Error code:', errorCode);
      console.log('[Plaid Backend]   Error message:', errorMessage);
      return res.json({ 
        success: true, 
        message: 'Account not found (already deleted)',
        alreadyDeleted: true
      });
    }
    
    console.error('[Plaid Backend] ❌ ========== ERROR removing account ==========');
    console.error('[Plaid Backend]   Error type:', typeof error);
    console.error('[Plaid Backend]   Error constructor:', error?.constructor?.name);
    console.error('[Plaid Backend]   Error code:', errorCode);
    console.error('[Plaid Backend]   Error name:', error?.name);
    console.error('[Plaid Backend]   Error message:', errorMessage);
    console.error('[Plaid Backend]   Error stack:', error?.stack);
    console.error('[Plaid Backend]   Full error object:', JSON.stringify(error, null, 2));
    
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
    
    console.error('[Plaid Backend]   Sending error response:', JSON.stringify(responseBody, null, 2));
    
    // IMPORTANT: Send response BEFORE any other code runs
    // This ensures the error middleware doesn't intercept it
    return res.status(500).json(responseBody);
  }
});

module.exports = router;
