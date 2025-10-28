const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const plaidRoutes = require('./routes/plaid');

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
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
