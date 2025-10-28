const plaidClient = require('../config/plaid');
const { BankAccount, Transaction } = require('../models');

class PlaidService {
  // Create Link Token for frontend
  static async createLinkToken(userId, redirectUri = null) {
    try {
      const request = {
        user: {
          client_user_id: userId.toString(),
        },
        client_name: 'Trilo',
        products: ['transactions', 'auth'],
        country_codes: ['US'],
        language: 'en',
        // Only use redirect_uri for production, sandbox doesn't require it
        ...(process.env.NODE_ENV === 'production' && {
          redirect_uri: 'https://trilo-production.up.railway.app/plaid/redirect'
        }),
      };

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw new Error('Failed to create link token');
    }
  }

  // Exchange public token for access token
  static async exchangePublicToken(publicToken, userId) {
    try {
      const request = {
        public_token: publicToken,
      };

      const response = await plaidClient.itemPublicTokenExchange(request);
      const { access_token, item_id } = response.data;

      // Get account information
      const accountsResponse = await plaidClient.accountsGet({
        access_token: access_token,
      });

      const accounts = accountsResponse.data.accounts;

      // Store account information in database
      const savedAccounts = [];
      for (const account of accounts) {
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

        const savedAccount = await BankAccount.create(accountData);
        savedAccounts.push(savedAccount);
      }

      return {
        item_id,
        access_token,
        accounts: savedAccounts,
      };
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to exchange public token');
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

      const response = await plaidClient.transactionsGet(request);
      return response.data.transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw new Error('Failed to get transactions');
    }
  }

  // Sync transactions for an account
  static async syncTransactions(accountId, accessToken) {
    try {
      // Get transactions from the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const transactions = await this.getTransactions(
        accessToken,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

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
