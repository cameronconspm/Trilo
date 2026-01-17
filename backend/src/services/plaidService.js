const plaidClient = require('../config/plaid');
const { BankAccount, Transaction } = require('../models');

function getPlaid() {
  if (!plaidClient) {
    throw new Error('Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET.');
  }
  return plaidClient;
}

class PlaidService {
  // Create Link Token for frontend
  static async createLinkToken(userId, customRedirectUri = null) {
    try {
      console.log('[Plaid Backend] 🔗 Creating link token...');
      console.log('[Plaid Backend]   User ID:', userId);
      const plaidEnv = process.env.PLAID_ENV || 'sandbox';
      console.log('[Plaid Backend]   Environment:', plaidEnv);
      
      // Redirect URI is now required for all environments (including sandbox)
      // It must be registered in the Plaid Dashboard under "Allowed redirect URIs"
      let redirectUri = null;
      if (customRedirectUri) {
        redirectUri = customRedirectUri;
      } else if (process.env.PLAID_REDIRECT_URI) {
        redirectUri = process.env.PLAID_REDIRECT_URI;
      } else {
        // Default redirect URI (must match the route in server.js: /plaid/redirect)
        // Note: This must be registered in Plaid Dashboard
        redirectUri = 'https://trilo-production.up.railway.app/plaid/redirect';
      }
      
      console.log('[Plaid Backend]   Redirect URI:', redirectUri);
      console.log('[Plaid Backend]   ⚠️  Ensure this URI is registered in Plaid Dashboard under "Allowed redirect URIs"');

      const request = {
        user: {
          client_user_id: userId.toString(),
        },
        client_name: 'Trilo',
        products: ['transactions', 'auth'],
        country_codes: ['US'],
        language: 'en',
        redirect_uri: redirectUri, // Always include redirect_uri (required by Plaid)
      };

      console.log('[Plaid Backend]   Request:', JSON.stringify({
        ...request,
        user: { client_user_id: request.user.client_user_id },
      }, null, 2));

      const response = await getPlaid().linkTokenCreate(request);
      
      if (!response.data || !response.data.link_token) {
        throw new Error('Invalid response from Plaid: link_token missing');
      }
      
      console.log('[Plaid Backend] ✅ Link token created successfully');
      console.log('[Plaid Backend]   Link Token:', response.data.link_token.substring(0, 20) + '...');
      
      return response.data.link_token;
    } catch (error) {
      console.error('[Plaid Backend] ❌ ========== ERROR creating link token ==========');
      console.error('[Plaid Backend]   Error type:', typeof error);
      console.error('[Plaid Backend]   Error constructor:', error?.constructor?.name);
      console.error('[Plaid Backend]   Error name:', error?.name);
      console.error('[Plaid Backend]   Error message:', error?.message);
      console.error('[Plaid Backend]   Error stack:', error?.stack);
      
      // Log detailed Plaid API error information
      if (error.response) {
        console.error('[Plaid Backend]   Plaid API Error Status:', error.response.status);
        console.error('[Plaid Backend]   Plaid API Error Status Text:', error.response.statusText);
        console.error('[Plaid Backend]   Plaid API Error Data:', JSON.stringify(error.response.data, null, 2));
        
        // Extract Plaid error code and message
        const plaidErrorCode = error.response.data?.error_code;
        const plaidErrorMessage = error.response.data?.error_message;
        const plaidErrorType = error.response.data?.error_type;
        
        if (plaidErrorCode || plaidErrorMessage) {
          console.error('[Plaid Backend]   Plaid Error Code:', plaidErrorCode);
          console.error('[Plaid Backend]   Plaid Error Type:', plaidErrorType);
          console.error('[Plaid Backend]   Plaid Error Message:', plaidErrorMessage);
          
          throw new Error(`Plaid API error: ${plaidErrorMessage || plaidErrorCode || 'Unknown Plaid error'}`);
        }
      } else if (error.message) {
        console.error('[Plaid Backend]   Error Message:', error.message);
      } else {
        console.error('[Plaid Backend]   Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      
      // Re-throw with more context
      const errorMessage = error?.response?.data?.error_message || 
                          error?.response?.data?.error_code || 
                          error?.message || 
                          'Unknown error';
      throw new Error(`Failed to create link token: ${errorMessage}`);
    }
  }

  // Exchange public token for access token
  static async exchangePublicToken(publicToken, userId, selectedAccountIds = null) {
    try {
      console.log('[Plaid Backend] 🔄 Exchanging public token...');
      console.log('[Plaid Backend]   Public Token:', publicToken.substring(0, 20) + '...');
      console.log('[Plaid Backend]   User ID:', userId);
      console.log('[Plaid Backend]   Selected Account IDs:', selectedAccountIds?.length || 0);

      const request = {
        public_token: publicToken,
      };

      const response = await getPlaid().itemPublicTokenExchange(request);
      
      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid response from Plaid: access_token missing');
      }
      
      const { access_token, item_id } = response.data;
      console.log('[Plaid Backend] ✅ Token exchanged successfully');
      console.log('[Plaid Backend]   Item ID:', item_id);

      // Get account information
      console.log('[Plaid Backend] 📥 Fetching accounts...');
      const accountsResponse = await getPlaid().accountsGet({
        access_token: access_token,
      });

      if (!accountsResponse.data || !accountsResponse.data.accounts) {
        throw new Error('Invalid response from Plaid: accounts missing');
      }

      let accounts = accountsResponse.data.accounts;
      console.log('[Plaid Backend] ✅ Accounts fetched from Plaid:', accounts.length);
      
      // Filter to only selected accounts if provided
      if (selectedAccountIds && selectedAccountIds.length > 0) {
        const selectedIdsSet = new Set(selectedAccountIds);
        accounts = accounts.filter(account => selectedIdsSet.has(account.account_id));
        console.log('[Plaid Backend] ✅ Filtered to selected accounts:', accounts.length);
        if (accounts.length === 0) {
          console.warn('[Plaid Backend] ⚠️  No accounts match selected account IDs');
        }
      } else {
        console.log('[Plaid Backend] ⚠️  No selected account IDs provided - saving all accounts');
      }

      // Store account information in database
      const savedAccounts = [];
      for (const account of accounts) {
        try {
          const accountData = {
            user_id: userId,
            item_id: item_id,
            access_token: access_token,
            account_id: account.account_id,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            institution_id: account.institution_id,
            current_balance: account.balances.current || 0,
            available_balance: account.balances.available || 0,
            currency_code: account.balances.iso_currency_code || 'USD',
            mask: account.mask,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          console.log('[Plaid Backend]   Saving account:', account.name, account.mask);
          const savedAccount = await BankAccount.create(accountData);
          savedAccounts.push(savedAccount);
          console.log('[Plaid Backend]   ✅ Saved account:', account.name, account.mask);
        } catch (dbError) {
          console.error('[Plaid Backend] ❌ Database error saving account:', account.name);
          console.error('[Plaid Backend]   Error:', JSON.stringify(dbError, null, 2));
          
          // If it's a duplicate key error, log and continue (account already exists)
          if (dbError.code === '23505' || dbError.message?.includes('duplicate') || dbError.message?.includes('unique')) {
            console.log('[Plaid Backend]   ⚠️ Account already exists, skipping...');
            continue;
          }
          
          // Re-throw other database errors
          throw new Error(`Database error saving account: ${dbError.message || JSON.stringify(dbError)}`);
        }
      }

      // After saving accounts, sync recent transactions for each account
      console.log('[Plaid Backend] 🔄 Syncing transactions for saved accounts...');
      let totalSyncedTransactions = 0;
      for (const account of savedAccounts) {
        try {
          const syncedCount = await this.syncTransactions(account.id, account.access_token);
          totalSyncedTransactions += syncedCount;
          console.log(
            '[Plaid Backend]   ✅ Synced transactions for account:',
            account.name,
            account.mask,
            'Count:',
            syncedCount
          );
        } catch (syncError) {
          console.error(
            '[Plaid Backend]   ❌ Error syncing transactions for account:',
            account.name,
            account.mask,
            syncError
          );
          // Don't fail the whole exchange if one account's sync fails
        }
      }

      console.log('[Plaid Backend] ✅ Exchange complete');
      console.log('[Plaid Backend]   Saved Accounts:', savedAccounts.length);
      console.log('[Plaid Backend]   Total Synced Transactions:', totalSyncedTransactions);

      return {
        item_id,
        access_token,
        accounts: savedAccounts,
        totalSyncedTransactions,
      };
    } catch (error) {
      console.error('[Plaid Backend] ❌ Error exchanging public token');
      console.error('[Plaid Backend]   Error Type:', error.constructor?.name || typeof error);
      console.error('[Plaid Backend]   Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Log detailed error information
      if (error.response) {
        // Plaid API error
        console.error('[Plaid Backend]   Plaid API Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
        const plaidError = error.response.data?.error_message || error.response.data?.error_code || 'Unknown Plaid error';
        throw new Error(`Plaid API error: ${plaidError}`);
      } else if (error.code) {
        // Supabase/database error
        console.error('[Plaid Backend]   Database Error Code:', error.code);
        console.error('[Plaid Backend]   Database Error Message:', error.message);
        console.error('[Plaid Backend]   Database Error Details:', error.details);
        console.error('[Plaid Backend]   Database Error Hint:', error.hint);
        throw new Error(`Database error: ${error.message || error.code || 'Unknown database error'}`);
      } else if (error.message) {
        // Generic error
        console.error('[Plaid Backend]   Error Message:', error.message);
        throw new Error(`Failed to exchange public token: ${error.message}`);
      } else {
        // Unknown error format
        console.error('[Plaid Backend]   Unknown error format:', error);
        throw new Error(`Failed to exchange public token: Unknown error occurred`);
      }
    }
  }

  // Get account balances
  static async getAccountBalances(accessToken) {
    try {
      const response = await getPlaid().accountsGet({
        access_token: accessToken,
      });

      return response.data.accounts.map(account => ({
        account_id: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        current_balance: account.balances.current || 0,
        available_balance: account.balances.available || 0,
        currency_code: account.balances.iso_currency_code || 'USD',
        mask: account.mask,
      }));
    } catch (error) {
      console.error('Error getting account balances:', error);
      throw new Error('Failed to get account balances');
    }
  }

  // Helper method to save transactions to database
  // Handles duplicates gracefully - the UNIQUE constraint prevents duplicates
  static async saveTransactions(accountId, transactions) {
    if (!transactions || transactions.length === 0) {
      return 0;
    }

    // Transform transactions for database
    const transactionData = transactions.map(transaction => {
      // Extract logo URL from Plaid transaction data
      // Priority: counterparties logo_url > personal_finance_category icon_url
      let logoUrl = null;
      
      // Check counterparties array for merchant logo
      if (transaction.counterparties && Array.isArray(transaction.counterparties) && transaction.counterparties.length > 0) {
        const counterparty = transaction.counterparties[0];
        if (counterparty.logo_url) {
          logoUrl = counterparty.logo_url;
        }
      }
      
      // Fallback to personal finance category icon if no merchant logo
      if (!logoUrl && transaction.personal_finance_category) {
        const pfc = transaction.personal_finance_category;
        if (pfc.icon_url) {
          logoUrl = pfc.icon_url;
        }
      }
      
      return {
        account_id: accountId,
        transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        date: transaction.date,
        name: transaction.name,
        merchant_name: transaction.merchant_name,
        category: transaction.category ? transaction.category.join(', ') : null,
        subcategory: transaction.subcategory ? transaction.subcategory.join(', ') : null,
        account_owner: transaction.account_owner,
        pending: transaction.pending,
        logo_url: logoUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    try {
      // Bulk insert transactions
      // The UNIQUE constraint on (account_id, transaction_id) will prevent duplicates
      const saved = await Transaction.bulkCreate(transactionData);
      const savedCount = saved?.length || transactionData.length;
      
      if (savedCount > 0 && process.env.NODE_ENV === 'development') {
        console.log(`[Plaid Backend]   ✅ Saved ${savedCount} transactions to database`);
      }

      return savedCount;
    } catch (error) {
      // If it's a duplicate key error, that's okay - transactions already exist
      // The UNIQUE constraint prevents duplicates, so this is expected on re-syncs
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Plaid Backend]   ℹ️  Some transactions already exist (duplicates skipped)');
        }
        // Return the count we attempted to save (some may have been duplicates)
        // This is fine - the unique constraint handled it
        return transactionData.length;
      }
      // Re-throw if it's a different error
      throw error;
    }
  }

  // Get transactions
  // Note: transactionsGet returns up to 500 transactions per request
  // For larger datasets, consider using transactionsSync for better performance
  static async getTransactions(accessToken, startDate, endDate, accountIds = null) {
    try {
      // Build request with only recognized fields
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      if (accountIds) {
        request.account_ids = accountIds;
      }

      // Reduced logging to avoid Railway rate limits
      if (process.env.NODE_ENV === 'development') {
        console.log('[Plaid Backend]   Requesting transactions:', startDate, 'to', endDate);
      }

      const response = await getPlaid().transactionsGet(request);
      
      const transactions = response.data.transactions || [];
      const totalTransactions = response.data.total_transactions || transactions.length;
      
      // Log transaction count
      if (transactions.length > 0) {
        console.log(`[Plaid Backend]   ✅ Transactions received: ${transactions.length} of ${totalTransactions} total`);
        
        // Warn if we're not getting all transactions (transactionsGet returns max 500)
        if (totalTransactions > 500 && transactions.length === 500) {
          console.warn('[Plaid Backend]   ⚠️  More than 500 transactions available. Consider using transactionsSync for complete data.');
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('[Plaid Backend]   ⚠️  No transactions found for date range:', startDate, 'to', endDate);
      }
      
      return transactions;
    } catch (error) {
      // Always log errors, but keep them concise
      const errorCode = error.response?.data?.error_code;
      const errorMessage = error.response?.data?.error_message || error.message;
      console.error('[Plaid Backend] ❌ Transaction fetch error:', errorCode || errorMessage);
      throw new Error(`Failed to get transactions: ${errorMessage}`);
    }
  }

  // Sync transactions for an account
  static async syncTransactions(accountId, accessToken) {
    try {
      // Get transactions from the last 90 days (extended for test credentials)
      // Test credentials like user_transactions_dynamic may have transactions further back
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90); // Extended from 30 to 90 days
      
      // Format dates as YYYY-MM-DD (Plaid requires this format)
      const endDateStr = endDate.toISOString().split('T')[0];
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Validate dates are not in the future
      const today = new Date().toISOString().split('T')[0];
      if (endDateStr > today) {
        console.warn('[Plaid Backend]   ⚠️  End date is in the future, using today instead');
        const endDateFormatted = today;
        const startDateFormatted = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log('[Plaid Backend]   Fetching transactions from:', startDateFormatted, 'to', endDateFormatted);
        
        const transactions = await this.getTransactions(
          accessToken,
          startDateFormatted,
          endDateFormatted
        );
        
        console.log('[Plaid Backend]   Transactions fetched:', transactions?.length || 0);
        
        // Transform and save transactions
        return await this.saveTransactions(accountId, transactions);
      }

      // Only log in dev mode to reduce Railway log volume
      if (process.env.NODE_ENV === 'development') {
        console.log('[Plaid Backend]   Fetching transactions from:', startDateStr, 'to', endDateStr);
      }

      const transactions = await this.getTransactions(
        accessToken,
        startDateStr,
        endDateStr
      );
      
      // Transform and save transactions
      return await this.saveTransactions(accountId, transactions);
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw new Error('Failed to sync transactions');
    }
  }

  // Remove item (disconnect bank account)
  static async removeItem(accessToken) {
    try {
      await getPlaid().itemRemove({
        access_token: accessToken,
      });
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      throw new Error('Failed to remove item');
    }
  }
}

module.exports = PlaidService;
