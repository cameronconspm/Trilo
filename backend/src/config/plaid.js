const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// Validate Plaid environment variables (do not throw at load so /health can respond)
const plaidClientId = process.env.PLAID_CLIENT_ID;
const plaidSecret = process.env.PLAID_SECRET;
const plaidEnv = process.env.PLAID_ENV || 'sandbox';

if (!plaidClientId || !plaidSecret) {
  console.error('[Plaid Config] ❌ Missing Plaid credentials - Plaid API will be unavailable. Set PLAID_CLIENT_ID and PLAID_SECRET.');
  console.error('[Plaid Config]   PLAID_CLIENT_ID:', !!plaidClientId);
  console.error('[Plaid Config]   PLAID_SECRET:', !!plaidSecret);
  console.error('[Plaid Config]   PLAID_ENV:', plaidEnv);
  module.exports = null;
  return;
}

if (!PlaidEnvironments[plaidEnv]) {
  console.error('[Plaid Config] ❌ Invalid Plaid environment:', plaidEnv);
  console.error('[Plaid Config]   Valid environments:', Object.keys(PlaidEnvironments));
  module.exports = null;
  return;
}

console.log('[Plaid Config] ✅ Plaid client initialized');
console.log('[Plaid Config]   Environment:', plaidEnv);
console.log('[Plaid Config]   Client ID:', plaidClientId?.substring(0, 10) + '...');
console.log('[Plaid Config]   Secret:', plaidSecret ? '***' + plaidSecret.substring(plaidSecret.length - 4) : 'MISSING');

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

