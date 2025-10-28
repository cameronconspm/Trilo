const express = require('express');
const router = express.Router();
const PlaidService = require('../services/plaidService');
const { BankAccount, Transaction } = require('../models');

// Create link token
router.post('/link/token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const linkToken = await PlaidService.createLinkToken(userId);
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});


// Exchange public token
router.post('/link/exchange', async (req, res) => {
  try {
    const { public_token, userId } = req.body;
    
    if (!public_token || !userId) {
      return res.status(400).json({ error: 'Public token and user ID are required' });
    }

    const result = await PlaidService.exchangePublicToken(public_token, userId);
    res.json(result);
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ error: 'Failed to exchange public token' });
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

// Remove bank account
router.delete('/accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await BankAccount.findByAccessToken(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Remove from Plaid
    await PlaidService.removeItem(account.access_token);
    
    // Remove from database
    await BankAccount.delete(accountId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing account:', error);
    res.status(500).json({ error: 'Failed to remove account' });
  }
});

module.exports = router;
