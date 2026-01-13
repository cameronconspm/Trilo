const { logger } = require('./logger');

/**
 * Cost Tracker - Tracks estimated costs for Plaid API calls
 * 
 * Note: These are estimated costs based on Plaid's pricing model.
 * Actual costs may vary based on your Plaid plan and usage.
 */

// Estimated costs per API call (in USD)
// These are conservative estimates based on Plaid's pricing
const PLAID_COSTS = {
  linkTokenCreate: 0.00, // Free
  itemPublicTokenExchange: 0.00, // Free
  accountsGet: 0.001, // $0.001 per call (very low cost)
  transactionsGet: 0.01, // $0.01 per call (more expensive, can fetch up to 500 transactions)
  transactionsSync: 0.01, // Similar to transactionsGet
  itemRemove: 0.00, // Free
};

/**
 * Track Plaid API call cost
 */
function trackPlaidCost(apiCall, userId, requestId, metadata = {}) {
  const cost = PLAID_COSTS[apiCall] || 0;
  
  if (cost > 0) {
    logger.info('Plaid API cost tracked', {
      apiCall,
      estimatedCost: cost,
      userId,
      requestId,
      ...metadata,
    });
  }
  
  return cost;
}

/**
 * Get cost estimate for an operation
 */
function getCostEstimate(apiCall) {
  return PLAID_COSTS[apiCall] || 0;
}

/**
 * Calculate total estimated cost for multiple operations
 */
function calculateTotalCost(operations) {
  return operations.reduce((total, op) => {
    return total + (PLAID_COSTS[op.apiCall] || 0);
  }, 0);
}

/**
 * Log cost summary (for monitoring/admin purposes)
 */
function logCostSummary(operations) {
  const total = calculateTotalCost(operations);
  const byType = {};
  
  operations.forEach(op => {
    byType[op.apiCall] = (byType[op.apiCall] || 0) + (PLAID_COSTS[op.apiCall] || 0);
  });
  
  logger.info('Cost summary', {
    totalEstimatedCost: total,
    breakdown: byType,
    operationCount: operations.length,
  });
  
  return {
    total,
    breakdown: byType,
    count: operations.length,
  };
}

module.exports = {
  trackPlaidCost,
  getCostEstimate,
  calculateTotalCost,
  logCostSummary,
  PLAID_COSTS,
};

