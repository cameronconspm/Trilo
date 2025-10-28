#!/usr/bin/env node

// Test all Plaid endpoints
const plaidClient = require('./src/config/plaid');

async function testAllEndpoints() {
  console.log('🧪 Testing All Plaid Endpoints...\n');
  
  try {
    // 1. Test Institutions
    console.log('1️⃣ Testing Institutions...');
    const institutions = await plaidClient.institutionsGet({
      count: 5,
      offset: 0,
      country_codes: ['US'],
    });
    console.log(`✅ Found ${institutions.data.institutions.length} institutions\n`);
    
    // 2. Test Link Token Creation
    console.log('2️⃣ Testing Link Token Creation...');
    const linkToken = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'test-user-' + Date.now() },
      client_name: 'Trilo Test',
      products: ['transactions', 'auth'],
      country_codes: ['US'],
      language: 'en',
    });
    console.log(`✅ Link token created: ${linkToken.data.link_token.substring(0, 20)}...\n`);
    
    // 3. Test Exchange Token (simulated)
    console.log('3️⃣ Testing Token Exchange (simulation)...');
    console.log('ℹ️  This would require a real public_token from Link flow\n');
    
    // 4. Test Account Retrieval (simulated)
    console.log('4️⃣ Testing Account Retrieval (simulation)...');
    console.log('ℹ️  This would require a real access_token from token exchange\n');
    
    // 5. Test Transaction Retrieval (simulated)
    console.log('5️⃣ Testing Transaction Retrieval (simulation)...');
    console.log('ℹ️  This would require a real access_token from token exchange\n');
    
    console.log('🎉 All endpoint tests completed!');
    console.log('\n📱 Next: Test the mobile app connection flow');
    console.log('🔗 Use link token in your app to test the full flow');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllEndpoints();
