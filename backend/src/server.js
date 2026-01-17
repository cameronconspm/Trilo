const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const plaidRoutes = require('./routes/plaid');
const mfaRoutes = require('./routes/mfa');
const webhookRoutes = require('./webhooks/revenuecat-webhook');
const { requestIdMiddleware } = require('./utils/requestId');
const { generalLimiter } = require('./middleware/rateLimit');
const { apiVersioning } = require('./middleware/apiVersioning');

const app = express();
const PORT = process.env.PORT || 3001;

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Health check first (before heavy middleware) so Railway healthchecks pass quickly
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Security middleware - configure Helmet for financial app
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate limiting - general API rate limit
app.use(generalLimiter);

// CORS configuration - secure CORS for production
const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
};

if (process.env.CORS_ORIGIN) {
  if (process.env.CORS_ORIGIN === '*') {
    // In production, warn about wildcard CORS
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  WARNING: CORS_ORIGIN is set to "*" in production. This is insecure!');
    }
    corsOptions.origin = true; // Allow all origins
  } else {
    // Parse multiple origins if comma-separated
    const origins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    corsOptions.origin = (origin, callback) => {
      if (origins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    };
  }
} else {
  // Default to localhost for development
  corsOptions.origin = 'http://localhost:8081';
}

app.use(cors(corsOptions));

// Body parsing middleware with security limits
// Limit request body size to prevent DoS attacks
app.use(express.json({ 
  limit: process.env.MAX_REQUEST_SIZE || '1mb', // Default 1mb (reduced from 10mb for security)
  strict: true // Only parse arrays and objects
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: process.env.MAX_REQUEST_SIZE || '1mb',
  parameterLimit: 100 // Limit number of parameters
}));

// Request timeout configuration
// Set timeout for all requests (prevents hanging requests)
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000'); // 30 seconds default
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        message: 'The request took too long to process',
        requestId: req.id,
      });
    }
  });
  next();
});

// Plaid redirect handler (must be before API routes)
app.get('/plaid/redirect', async (req, res) => {
  try {
    const { public_token, error } = req.query;
    
    if (error) {
      console.error('Plaid redirect error:', error);
      return res.status(400).send(`
        <html>
          <body>
            <h1>Bank Connection Failed</h1>
            <p>Error: ${error}</p>
            <p>Please return to the Trilo app and try again.</p>
          </body>
        </html>
      `);
    }
    
    if (public_token) {
      console.log('✅ Received public token from Plaid redirect:', public_token);
      
      // Return success page with instructions
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Bank Connection Successful!</h1>
            <p>Your bank account has been connected successfully.</p>
            <p>You can now return to the Trilo app.</p>
            <p><strong>Public Token:</strong> ${public_token}</p>
            <p style="color: #666; font-size: 14px;">
              Copy this token and use the "Manual Success Test" button in the app to complete the connection.
            </p>
          </body>
        </html>
      `);
    }
    
    res.status(400).send(`
      <html>
        <body>
          <h1>Invalid Request</h1>
          <p>No public token received.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling Plaid redirect:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Server Error</h1>
          <p>Something went wrong. Please try again.</p>
        </body>
      </html>
    `);
  }
});

// API versioning middleware (before routes)
app.use('/api', apiVersioning);

// API routes (will work with or without version prefix)
// /api/plaid/* and /api/v1/plaid/* both work (v1 is default)
app.use('/api/plaid', plaidRoutes);
app.use('/api/mfa', mfaRoutes);
// Also register versioned routes for explicit version usage
app.use('/api/v1/plaid', plaidRoutes);
app.use('/api/v1/mfa', mfaRoutes);

// Log registered routes for debugging
console.log('✅ API Routes registered:');
console.log('   - /api/plaid/*');
console.log('   - /api/mfa/*');

// Webhook routes (must be before body parsing middleware to capture raw body if needed)
app.use('/api/webhooks', webhookRoutes);

// Error handling middleware
// Only handle errors if response hasn't been sent yet
app.use((err, req, res, next) => {
  // If response was already sent, don't override it
  if (res.headersSent) {
    return next(err);
  }
  
  const { logger } = require('./utils/logger');
  const { createErrorResponse } = require('./utils/errorHandler');
  
  logger.error('Unhandled server error', {
    error: err.message,
    stack: err.stack,
    code: err?.code,
    requestId: req.id,
    path: req.path,
    method: req.method,
  });
  
  // Check if it's a PGRST116 error (account not found)
  // PGRST116 means "0 rows" - for delete operations, this is success (account already deleted)
  // Check ALL possible locations for PGRST116
  const errorCode = err?.code || err?.error?.code || err?.details?.code || err?.error?.details?.code;
  const errorMessage = err?.message || err?.error?.message || err?.details?.message || err?.error?.details?.message || String(err || '');
  const errorDetails = err?.details || err?.error?.details || err?.details?.details;
  
  // Check for PGRST116 in code, message, and details
  const hasPGRST116 = errorCode === 'PGRST116' || 
                     errorMessage.includes('PGRST116') || 
                     errorMessage.includes('0 rows') ||
                     errorMessage.includes('Cannot coerce') ||
                     errorMessage.includes('The result contains 0 rows') ||
                     (errorDetails && (String(errorDetails).includes('PGRST116') || String(errorDetails).includes('0 rows')));

  if (hasPGRST116) {
    logger.info('PGRST116 detected in error middleware - treating as success', {
      errorCode,
      requestId: req.id,
    });
    // Return success - account doesn't exist = success
    return res.json({ 
      success: true, 
      message: 'Account not found (may have been already deleted)',
      alreadyDeleted: true,
      requestId: req.id,
    });
  }
  
  // Use secure error response
  const errorResponse = createErrorResponse(err, req, 'Internal server error');
  res.status(500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  console.log(`[404] Available routes: /api/plaid/*, /api/mfa/*, /health`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    hint: 'Available routes: /api/plaid/*, /api/mfa/*, /health'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Trilo Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Plaid Environment: ${process.env.PLAID_ENV || 'sandbox'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8081'}`);
  console.log(`🌍 Server accessible from: http://0.0.0.0:${PORT}`);
});

module.exports = app;
