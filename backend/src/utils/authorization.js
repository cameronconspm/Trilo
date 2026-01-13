const { BankAccount } = require('../models');

/**
 * Authorization helper functions
 * Verify that users can only access their own resources
 */

/**
 * Verify that an account belongs to the authenticated user
 * @param {string} accountId - Account ID to verify
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Object|null>} - Account object if authorized, null if not found
 * @throws {Error} - If account belongs to different user (403)
 */
async function verifyAccountOwnership(accountId, userId) {
  const account = await BankAccount.findById(accountId);
  
  if (!account) {
    return null; // Account doesn't exist
  }

  if (account.user_id !== userId) {
    const error = new Error('Forbidden: Account does not belong to user');
    error.statusCode = 403;
    throw error;
  }

  return account;
}

module.exports = {
  verifyAccountOwnership,
};

