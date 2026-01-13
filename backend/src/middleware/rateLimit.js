const rateLimit = require('express-rate-limit');

/**
 * Enhanced rate limiting middleware for different endpoint types
 */

// General API rate limit (applied to all routes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for Plaid operations (sensitive financial operations)
const plaidLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per 15 minutes
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many Plaid operations from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, including successful ones
});

// Stricter rate limit for account operations
const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per 15 minutes
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many account operations from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limit for MFA operations
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per 15 minutes
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many MFA requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Per-user rate limiting (requires authentication middleware to run first)
// This uses userId from req.user, so it must be applied after auth middleware
function createUserRateLimiter(maxRequests = 50, windowMs = 15 * 60 * 1000) {
  // In-memory store for user rate limits (in production, use Redis)
  const userLimitStore = new Map();

  return (req, res, next) => {
    // Only apply if user is authenticated
    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const userKey = `${userId}`;

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [key, value] of userLimitStore.entries()) {
        if (value.resetTime < now) {
          userLimitStore.delete(key);
        }
      }
    }

    const userLimit = userLimitStore.get(userKey);

    if (!userLimit || userLimit.resetTime < now) {
      // Create new limit window
      userLimitStore.set(userKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      const resetTime = new Date(userLimit.resetTime).toISOString();
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${resetTime}`,
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
        requestId: req.id,
      });
    }

    userLimit.count += 1;
    userLimitStore.set(userKey, userLimit);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - userLimit.count));
    res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());

    next();
  };
}

// Per-user rate limiter for Plaid operations
const plaidUserLimiter = createUserRateLimiter(15, 15 * 60 * 1000); // 15 requests per 15 minutes per user

module.exports = {
  generalLimiter,
  plaidLimiter,
  accountLimiter,
  mfaLimiter,
  plaidUserLimiter,
  createUserRateLimiter,
};

