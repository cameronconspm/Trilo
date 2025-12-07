# Trilo Backend - Plaid Integration

This backend provides secure Plaid integration for the Trilo finance app, handling bank account connections, transaction syncing, and data storage.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Copy the example environment file and configure your credentials:
```bash
cp env.example .env
```

Update `.env` with your actual values:
```env
# Plaid Configuration
PLAID_CLIENT_ID=687bd346551e1a0025da2915
PLAID_SECRET=1d09cc06a8c066444d370f53bd62e2
PLAID_ENV=sandbox

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:8081
```

### 3. Database Setup
Run the SQL schema in your Supabase database:
```bash
# Execute the contents of database/schema.sql in your Supabase SQL editor
```

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📊 API Endpoints

### Plaid Integration
- `POST /api/plaid/link/token` - Create link token for frontend
- `POST /api/plaid/link/exchange` - Exchange public token for access token
- `GET /api/plaid/accounts/:userId` - Get user's bank accounts
- `GET /api/plaid/accounts/:accountId/balance` - Get account balance
- `GET /api/plaid/accounts/:accountId/transactions` - Get account transactions
- `GET /api/plaid/transactions/:userId` - Get all user transactions
- `POST /api/plaid/accounts/:accountId/sync` - Sync transactions
- `DELETE /api/plaid/accounts/:accountId` - Remove bank account

### MFA (SMS) Integration
- `POST /api/mfa/send-code` - Send SMS verification code to phone number
- `POST /api/mfa/verify-code` - Verify SMS code

### Health Check
- `GET /health` - Server health status

## 🏗️ Architecture

### Database Schema
- **bank_accounts**: Stores connected bank account information
- **transactions**: Stores transaction data from Plaid

### Security Features
- Row Level Security (RLS) enabled on all tables
- JWT-based authentication (ready for implementation)
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers

### Plaid Integration Flow
1. Frontend requests link token
2. User completes Plaid Link flow
3. Public token exchanged for access token
4. Account and transaction data synced
5. Data stored securely in Supabase

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Plaid and Supabase configuration
│   ├── models/          # Database models and operations
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (Plaid service)
│   └── server.js        # Main server file
├── database/
│   └── schema.sql       # Database schema
├── package.json
└── env.example
```

### Environment Variables
- **PLAID_CLIENT_ID**: Your Plaid client ID
- **PLAID_SECRET**: Your Plaid secret key
- **PLAID_ENV**: Plaid environment (sandbox/development/production)
- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase service role key
- **PORT**: Server port (default: 3001)
- **JWT_SECRET**: Secret for JWT tokens
- **CORS_ORIGIN**: Allowed CORS origin
- **TWILIO_ACCOUNT_SID**: (Optional) Twilio Account SID for SMS MFA
- **TWILIO_AUTH_TOKEN**: (Optional) Twilio Auth Token for SMS MFA
- **TWILIO_PHONE_NUMBER**: (Optional) Twilio phone number for sending SMS

## 🚨 Security Notes

- Never commit `.env` file to version control
- Use service role key only on backend
- Implement proper user authentication before production
- Rotate JWT secrets regularly
- Monitor API usage and implement additional rate limiting if needed

## 📱 Frontend Integration

The frontend is ready to integrate with this backend. Update the API_BASE_URL in your React Native app to point to this server.

## 🐛 Troubleshooting

### Common Issues
1. **CORS errors**: Ensure CORS_ORIGIN matches your frontend URL
2. **Plaid errors**: Verify your Plaid credentials and environment
3. **Database errors**: Check Supabase connection and RLS policies
4. **Port conflicts**: Change PORT in .env if 3001 is occupied

### Logs
The server logs all Plaid API calls and errors. Check the console for detailed error messages.

## 🔄 Next Steps

1. Set up Supabase project and run schema
2. Configure environment variables
3. Test API endpoints with Postman/curl
4. Integrate frontend Plaid SDK
5. Implement user authentication
6. Add webhook handling for real-time updates

