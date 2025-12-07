const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const plaidRoutes = require('./routes/plaid');
const mfaRoutes = require('./routes/mfa');
const webhookRoutes = require('./webhooks/revenuecat-webhook');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || 'http://localhost:8081'),
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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

// API routes
app.use('/api/plaid', plaidRoutes);
app.use('/api/mfa', mfaRoutes);

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
  
  console.error('[Server] Unhandled error:', err);
  console.error('[Server] Error code:', err?.code);
  console.error('[Server] Error message:', err?.message);
  
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
    console.log('[Server] ✅ PGRST116 detected in error middleware - treating as success');
    console.log('[Server] Error code:', errorCode);
    console.log('[Server] Error message:', errorMessage);
    console.log('[Server] Error details:', errorDetails);
    // Return success - account doesn't exist = success
    return res.json({ 
      success: true, 
      message: 'Account not found (may have been already deleted)',
      alreadyDeleted: true
    });
  }
  
  // Preserve detailed error information if available
  const errorResponse = {
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  };
  
  // Include error details if available
  if (err?.code) {
    errorResponse.code = err.code;
  }
  if (err?.details) {
    errorResponse.details = err.details;
  }
  
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
