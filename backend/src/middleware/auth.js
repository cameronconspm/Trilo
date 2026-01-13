const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { trackFailedAuth } = require('../utils/securityAlerts');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create a Supabase client for auth verification
// We use anon key for token verification (it can verify user tokens)
const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Authentication middleware for Supabase JWT tokens
 * Verifies JWT token from Authorization header and extracts userId
 * 
 * Usage:
 * router.get('/protected', authenticate, (req, res) => {
 *   const userId = req.user.id; // User ID from verified JWT
 *   // ...
 * });
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      trackFailedAuth('unknown', req.ip, req.id);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected format: Bearer <token>',
        requestId: req.id,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token is required',
        requestId: req.id,
      });
    }

    // Verify token using Supabase
    // Option 1: Use Supabase client (recommended for Supabase tokens)
    if (supabaseAuth) {
      try {
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
        
        if (error || !user) {
          trackFailedAuth('unknown', req.ip, req.id);
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
            requestId: req.id,
          });
        }

        // Attach user info to request
        req.user = {
          id: user.id,
          email: user.email,
        };

        return next();
      } catch (supabaseError) {
        // If Supabase verification fails, fall back to JWT verification
        // This allows for flexibility if tokens are not Supabase tokens
      }
    }

    // Option 2: Fallback to direct JWT verification (if JWT_SECRET is set)
    // This is useful if you're using custom JWT tokens
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        
        // Extract user ID from token payload
        // Supabase tokens have userId in 'sub' field
        const userId = decoded.sub || decoded.user_id || decoded.userId || decoded.id;
        
        if (!userId) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token does not contain user identifier',
            requestId: req.id,
          });
        }

        req.user = {
          id: userId,
          email: decoded.email,
        };

        return next();
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token has expired',
            requestId: req.id,
          });
        }
        
        if (jwtError.name === 'JsonWebTokenError') {
          // Try to extract userId from token for tracking
          let userId = 'unknown';
          try {
            const decoded = jwt.decode(token);
            userId = decoded?.sub || decoded?.user_id || decoded?.userId || decoded?.id || 'unknown';
          } catch (e) {
            // Ignore decode errors
          }
          trackFailedAuth(userId, req.ip, req.id);
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token',
            requestId: req.id,
          });
        }

        throw jwtError;
      }
    }

    // If neither method works, return unauthorized
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed',
      requestId: req.id,
    });

  } catch (error) {
    // Log error but don't expose details to client
    console.error('[Auth Middleware] Error authenticating request:', error.message);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Authentication failed',
      requestId: req.id,
    });
  }
}

/**
 * Optional middleware - allows requests with or without auth
 * Useful for endpoints that work differently based on auth status
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided - continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (supabaseAuth) {
      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
        };
        return next();
      }
    }

    // If verification fails, continue without user (optional auth)
    req.user = null;
    next();
  } catch (error) {
    // On error, continue without user
    req.user = null;
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};

