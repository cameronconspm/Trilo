const { checkQuota, incrementQuota, checkAccountSyncQuota, recordAccountSync } = require('../utils/quotaManager');
const { logger } = require('../utils/logger');
const { trackQuotaViolation } = require('../utils/securityAlerts');

/**
 * Cost Control Middleware
 * Enforces per-user quotas to prevent abuse and cost overruns
 */

/**
 * Middleware to check quota before allowing operation
 */
function quotaCheck(quotaType, period = 'day') {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
          requestId: req.id,
        });
      }

      const userId = req.user.id;
      const quotaResult = await checkQuota(userId, quotaType, period);

      if (!quotaResult.allowed) {
        logger.warn('Quota exceeded', {
          userId,
          quotaType,
          period,
          current: quotaResult.current,
          limit: quotaResult.limit,
          requestId: req.id,
        });

        // Calculate retry after time based on period
        let retryAfter = 3600; // Default 1 hour
        if (period === 'hour') {
          const periodStart = new Date();
          periodStart.setMinutes(0, 0, 0);
          const nextPeriod = new Date(periodStart.getTime() + 60 * 60 * 1000);
          retryAfter = Math.ceil((nextPeriod.getTime() - Date.now()) / 1000);
        } else if (period === 'day') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          retryAfter = Math.ceil((tomorrow.getTime() - Date.now()) / 1000);
        }

        return res.status(429).json({
          error: 'Quota exceeded',
          message: `You've reached your ${period}ly limit for this operation. Please try again later.`,
          quotaType,
          period,
          limit: quotaResult.limit,
          retryAfter,
          requestId: req.id,
        });
      }

      // Attach quota info to request for logging
      req.quota = {
        type: quotaType,
        period,
        remaining: quotaResult.remaining,
        limit: quotaResult.limit,
      };

      next();
    } catch (error) {
      logger.error('Error in quota check middleware', {
        error: error.message,
        quotaType,
        requestId: req.id,
      });
      // Fail open - allow request if quota check fails
      next();
    }
  };
}

/**
 * Middleware to increment quota after successful operation
 */
function incrementQuotaAfter(quotaType, period = 'day') {
  return async (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json.bind(res);
    let responseSent = false;

    res.json = function(data) {
      if (!responseSent) {
        responseSent = true;
        
        // Only increment quota on success (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (req.user && req.user.id) {
            incrementQuota(req.user.id, quotaType, period).catch(err => {
              logger.error('Error incrementing quota after operation', {
                error: err.message,
                userId: req.user.id,
                quotaType,
                requestId: req.id,
              });
            });
          }
        }
      }
      
      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware for account sync quota checking (includes timing checks)
 */
async function accountSyncQuotaCheck(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        requestId: req.id,
      });
    }

    const { accountId } = req.params;
    const userId = req.user.id;

    if (!accountId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Account ID is required',
        requestId: req.id,
      });
    }

    const quotaResult = await checkAccountSyncQuota(accountId, userId);

    if (!quotaResult.allowed) {
      logger.warn('Account sync quota exceeded', {
        userId,
        accountId,
        reason: quotaResult.reason,
        requestId: req.id,
      });

      let message = 'Sync quota exceeded';
      let retryAfter = 3600; // Default 1 hour

      if (quotaResult.reason === 'min_interval') {
        message = `Please wait ${quotaResult.minutesRemaining} more minute(s) before syncing this account again.`;
        retryAfter = quotaResult.retryAfter;
      } else if (quotaResult.reason === 'per_account_daily_limit') {
        message = `You've reached the daily sync limit (${quotaResult.limit}) for this account. Please try again tomorrow.`;
        retryAfter = 86400; // 24 hours
      } else if (quotaResult.reason === 'user_daily_limit') {
        message = `You've reached your daily sync limit (${quotaResult.limit}). Please try again tomorrow.`;
        retryAfter = 86400; // 24 hours
      }

      return res.status(429).json({
        error: 'Quota exceeded',
        message,
        reason: quotaResult.reason,
        retryAfter,
        requestId: req.id,
      });
    }

    // Attach quota info to request
    req.syncQuota = quotaResult;

    next();
  } catch (error) {
    logger.error('Error in account sync quota check', {
      error: error.message,
      requestId: req.id,
    });
    // Fail open - allow sync if quota check fails
    next();
  }
}

/**
 * Middleware to record account sync after successful operation
 */
function recordAccountSyncAfter(req, res, next) {
  // Store original res.json to intercept responses
  const originalJson = res.json.bind(res);
  let responseSent = false;

  res.json = function(data) {
    if (!responseSent) {
      responseSent = true;
      
      // Only record sync on success (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (req.user && req.user.id && req.params.accountId) {
          // Extract sync cursor from response if available (for incremental syncs)
          const syncCursor = data?.sync_cursor || null;
          
          recordAccountSync(req.params.accountId, req.user.id, syncCursor).catch(err => {
            logger.error('Error recording account sync', {
              error: err.message,
              accountId: req.params.accountId,
              userId: req.user.id,
              requestId: req.id,
            });
          });
        }
      }
    }
    
    return originalJson(data);
  };

  next();
}

/**
 * Middleware factory for quota checks
 */
function createQuotaMiddleware(quotaType, period = 'day') {
  return [quotaCheck(quotaType, period), incrementQuotaAfter(quotaType, period)];
}

module.exports = {
  quotaCheck,
  incrementQuotaAfter,
  accountSyncQuotaCheck,
  recordAccountSyncAfter,
  createQuotaMiddleware,
};

