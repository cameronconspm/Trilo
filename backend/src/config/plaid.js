const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// Validate Plaid environment variables
const plaidClientId = process.env.PLAID_CLIENT_ID;
const plaidSecret = process.env.PLAID_SECRET;
const plaidEnv = process.env.PLAID_ENV || 'sandbox';

if (!plaidClientId || !plaidSecret) {
  console.error('[Plaid Config] ❌ Missing Plaid credentials!');
  console.error('[Plaid Config]   PLAID_CLIENT_ID:', !!plaidClientId);
  console.error('[Plaid Config]   PLAID_SECRET:', !!plaidSecret);
  console.error('[Plaid Config]   PLAID_ENV:', plaidEnv);
  throw new Error('Missing required Plaid environment variables: PLAID_CLIENT_ID and PLAID_SECRET must be set');
}

// Validate Plaid environment
if (!PlaidEnvironments[plaidEnv]) {
  console.error('[Plaid Config] ❌ Invalid Plaid environment:', plaidEnv);
  console.error('[Plaid Config]   Valid environments:', Object.keys(PlaidEnvironments));
  throw new Error(`Invalid Plaid environment: ${plaidEnv}. Must be one of: ${Object.keys(PlaidEnvironments).join(', ')}`);
}

console.log('[Plaid Config] ✅ Plaid client initialized');
console.log('[Plaid Config]   Environment:', plaidEnv);
console.log('[Plaid Config]   Client ID:', plaidClientId?.substring(0, 10) + '...');
console.log('[Plaid Config]   Secret:', plaidSecret ? '***' + plaidSecret.substring(plaidSecret.length - 4) : 'MISSING');

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': plaidClientId,
      'PLAID-SECRET': plaidSecret,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

module.exports = plaidClient;

