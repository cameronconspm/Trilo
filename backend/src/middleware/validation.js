const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation error handler middleware
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      requestId: req.id,
    });
  }
  next();
}

/**
 * Validation rules for Plaid routes
 */
const plaidValidations = {
  // POST /link/token - No body params needed (userId comes from JWT)
  createLinkToken: [],

  // POST /link/exchange
  exchangePublicToken: [
    body('public_token')
      .notEmpty()
      .withMessage('Public token is required')
      .isString()
      .withMessage('Public token must be a string')
      .isLength({ min: 1, max: 500 })
      .withMessage('Public token length invalid'),
    body('selected_account_ids')
      .optional()
      .isArray()
      .withMessage('Selected account IDs must be an array')
      .custom((value) => {
        if (value && value.length > 0) {
          return value.every(id => typeof id === 'string' && id.length > 0);
        }
        return true;
      })
      .withMessage('All account IDs must be non-empty strings'),
  ],

  // GET /accounts/:accountId
  getAccount: [
    param('accountId')
      .notEmpty()
      .withMessage('Account ID is required')
      .isUUID()
      .withMessage('Account ID must be a valid UUID'),
  ],

  // GET /accounts/:accountId/balance
  getAccountBalance: [
    param('accountId')
      .notEmpty()
      .withMessage('Account ID is required')
      .isUUID()
      .withMessage('Account ID must be a valid UUID'),
  ],

  // GET /accounts/:accountId/transactions
  getAccountTransactions: [
    param('accountId')
      .notEmpty()
      .withMessage('Account ID is required')
      .isUUID()
      .withMessage('Account ID must be a valid UUID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage('Limit must be between 1 and 500')
      .toInt(),
  ],

  // GET /transactions (no userId in params - comes from JWT)
  getUserTransactions: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage('Limit must be between 1 and 500')
      .toInt(),
  ],

  // POST /accounts/:accountId/sync
  syncTransactions: [
    param('accountId')
      .notEmpty()
      .withMessage('Account ID is required')
      .isUUID()
      .withMessage('Account ID must be a valid UUID'),
  ],

  // DELETE /accounts/:accountId
  deleteAccount: [
    param('accountId')
      .notEmpty()
      .withMessage('Account ID is required')
      .isUUID()
      .withMessage('Account ID must be a valid UUID'),
  ],
};

/**
 * Validation rules for MFA routes
 */
const mfaValidations = {
  // POST /send-code
  sendCode: [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .isString()
      .withMessage('Phone number must be a string')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
  ],

  // POST /verify-code
  verifyCode: [
    body('verification_id')
      .notEmpty()
      .withMessage('Verification ID is required')
      .isString()
      .withMessage('Verification ID must be a string'),
    body('code')
      .notEmpty()
      .withMessage('Verification code is required')
      .isString()
      .withMessage('Verification code must be a string')
      .matches(/^\d{6}$/)
      .withMessage('Verification code must be 6 digits'),
  ],
};

module.exports = {
  handleValidationErrors,
  plaidValidations,
  mfaValidations,
};

