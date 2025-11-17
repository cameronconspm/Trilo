const plaidClient = require('../config/plaid');
const { BankAccount, Transaction } = require('../models');

class PlaidService {
  // Create Link Token for frontend
  static async createLinkToken(userId, customRedirectUri = null) {
    try {
      console.log('[Plaid Backend] 🔗 Creating link token...');
      console.log('[Plaid Backend]   User ID:', userId);
      console.log('[Plaid Backend]   Environment:', process.env.PLAID_ENV || 'sandbox');
      
      // Environment-aware redirect URI
      // Only use redirect_uri for production, sandbox doesn't require it
      const redirectUri = customRedirectUri || 
        process.env.PLAID_REDIRECT_URI || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://trilo-production.up.railway.app/api/plaid/redirect'
          : null);

      const request = {
        user: {
          client_user_id: userId.toString(),
        },
        client_name: 'Trilo',
        products: ['transactions', 'auth'],
        country_codes: ['US'],
        language: 'en',
        ...(redirectUri && { redirect_uri: redirectUri }),
      };

      console.log('[Plaid Backend]   Request:', JSON.stringify({
        ...request,
        user: { client_user_id: request.user.client_user_id },
      }, null, 2));

      const response = await plaidClient.linkTokenCreate(request);
      
      if (!response.data || !response.data.link_token) {
        throw new Error('Invalid response from Plaid: link_token missing');
      }
      
      console.log('[Plaid Backend] ✅ Link token created successfully');
      console.log('[Plaid Backend]   Link Token:', response.data.link_token.substring(0, 20) + '...');
      
      return response.data.link_token;
    } catch (error) {
      console.error('[Plaid Backend] ❌ Error creating link token:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('[Plaid Backend]   Plaid API Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      } else if (error.message) {
        console.error('[Plaid Backend]   Error Message:', error.message);
      }
      
      throw new Error(`Failed to create link token: ${error.message || 'Unknown error'}`);
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

      const response = await plaidClient.itemPublicTokenExchange(request);
      
      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid response from Plaid: access_token missing');
      }
      
      const { access_token, item_id } = response.data;
      console.log('[Plaid Backend] ✅ Token exchanged successfully');
      console.log('[Plaid Backend]   Item ID:', item_id);

      // Get account information
      console.log('[Plaid Backend] 📥 Fetching accounts...');
      const accountsResponse = await plaidClient.accountsGet({
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
      const response = await plaidClient.accountsGet({
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

  // Get transactions
  static async getTransactions(accessToken, startDate, endDate, accountIds = null) {
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        count: 500,
        offset: 0,
      };

      if (accountIds) {
        request.account_ids = accountIds;
      }

      console.log('[Plaid Backend]   Requesting transactions:', {
        start_date: startDate,
        end_date: endDate,
        account_ids: accountIds?.length || 'all',
      });

      const response = await plaidClient.transactionsGet(request);
      
      const transactions = response.data.transactions || [];
      console.log('[Plaid Backend]   Transactions received:', transactions.length);
      
      // Log if no transactions found (helpful for debugging test credentials)
      if (transactions.length === 0) {
        console.warn('[Plaid Backend]   ⚠️  No transactions found for date range:', startDate, 'to', endDate);
      }
      
      return transactions;
    } catch (error) {
      console.error('[Plaid Backend] ❌ Error getting transactions:', error);
      console.error('[Plaid Backend]   Error code:', error.response?.data?.error_code);
      console.error('[Plaid Backend]   Error message:', error.response?.data?.error_message || error.message);
      throw new Error(`Failed to get transactions: ${error.response?.data?.error_message || error.message}`);
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

      console.log('[Plaid Backend]   Fetching transactions from:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

      const transactions = await this.getTransactions(
        accessToken,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      console.log('[Plaid Backend]   Transactions fetched:', transactions?.length || 0);

      // Transform transactions for database
      const transactionData = transactions.map(transaction => ({
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Bulk insert transactions
      if (transactionData.length > 0) {
        await Transaction.bulkCreate(transactionData);
      }

      return transactionData.length;
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw new Error('Failed to sync transactions');
    }
  }

  // Remove item (disconnect bank account)
  static async removeItem(accessToken) {
    try {
      await plaidClient.itemRemove({
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
