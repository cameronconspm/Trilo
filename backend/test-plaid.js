#!/usr/bin/env node

// Quick Plaid API test script
const plaidClient = require('./src/config/plaid');

async function testPlaidConnection() {
  try {
    console.log('🔍 Testing Plaid Sandbox Connection...');
    
    // Test 1: Get institutions
    const institutionsResponse = await plaidClient.institutionsGet({
      count: 10,
      offset: 0,
      country_codes: ['US'],
    });
    
    console.log('✅ Institutions retrieved:', institutionsResponse.data.institutions.length);
    console.log('📋 Available test banks:');
    institutionsResponse.data.institutions.slice(0, 5).forEach(inst => {
      console.log(`   - ${inst.name} (${inst.institution_id})`);
    });
    
    // Test 2: Create link token
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: 'test-user-123',
      },
      client_name: 'Trilo Finance App',
      products: ['transactions', 'auth'],
      country_codes: ['US'],
      language: 'en',
    });
    
    console.log('✅ Link token created successfully');
    console.log('🔗 Link token:', linkTokenResponse.data.link_token.substring(0, 20) + '...');
    
    console.log('\n🎉 Plaid sandbox connection is working!');
    console.log('\n📱 Next steps:');
    console.log('   1. Test bank connection in your app');
    console.log('   2. Use test credentials: user_good, pass_good');
    console.log('   3. Verify account and transaction data sync');
    
  } catch (error) {
    console.error('❌ Plaid connection failed:', error.message);
    console.error('🔧 Check your environment variables and network connection');
  }
}

testPlaidConnection();
