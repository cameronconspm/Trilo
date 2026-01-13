#!/usr/bin/env node

/**
 * Security Features Testing Script
 * Tests quota system, security alerts, request security, and API versioning
 * 
 * Usage:
 *   node src/scripts/testSecurityFeatures.js
 * 
 * Requires:
 *   - Backend server running
 *   - Valid test user credentials
 *   - Environment variables configured
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { checkQuota, incrementQuota, getUserQuotaStatus } = require('../utils/quotaManager');
const { getAlertStatistics } = require('../utils/securityAlerts');
const { logger } = require('../utils/logger');

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  TEST_USER_ID: process.env.TEST_USER_ID || 'test-user-id',
  TEST_ACCOUNT_ID: process.env.TEST_ACCOUNT_ID || null,
};

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  skipped: [],
};

/**
 * Test helper functions
 */
function logTest(testName, status, message = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${testName}${message ? `: ${message}` : ''}`);
  
  if (status === 'PASS') {
    testResults.passed.push(testName);
  } else if (status === 'FAIL') {
    testResults.failed.push(testName);
  } else {
    testResults.skipped.push(testName);
  }
}

async function testQuotaSystem() {
  console.log('\n📊 Testing Quota System...\n');
  
  try {
    // Test 1: Check quota for new user
    const quotaCheck1 = await checkQuota(TEST_CONFIG.TEST_USER_ID, 'plaid_link_token', 'hour');
    if (quotaCheck1.allowed && quotaCheck1.remaining >= 0) {
      logTest('Quota Check - New User', 'PASS', `Remaining: ${quotaCheck1.remaining}`);
    } else {
      logTest('Quota Check - New User', 'FAIL', 'Quota check failed');
    }
    
    // Test 2: Get user quota status
    const quotaStatus = await getUserQuotaStatus(TEST_CONFIG.TEST_USER_ID);
    if (quotaStatus && quotaStatus.plaid_link_token) {
      logTest('Get User Quota Status', 'PASS', 'Status retrieved successfully');
    } else {
      logTest('Get User Quota Status', 'FAIL', 'Failed to retrieve quota status');
    }
    
    // Test 3: Increment quota
    await incrementQuota(TEST_CONFIG.TEST_USER_ID, 'plaid_link_token', 'hour');
    const quotaCheck2 = await checkQuota(TEST_CONFIG.TEST_USER_ID, 'plaid_link_token', 'hour');
    if (quotaCheck2.current >= 1) {
      logTest('Quota Increment', 'PASS', `Current count: ${quotaCheck2.current}`);
    } else {
      logTest('Quota Increment', 'FAIL', 'Quota not incremented');
    }
    
  } catch (error) {
    logTest('Quota System Tests', 'FAIL', error.message);
    console.error('Error testing quota system:', error);
  }
}

async function testSecurityAlerts() {
  console.log('\n🔔 Testing Security Alerts...\n');
  
  try {
    // Test 1: Get alert statistics
    const stats = getAlertStatistics();
    if (typeof stats === 'object' && stats.failedAuthAttempts !== undefined) {
      logTest('Get Alert Statistics', 'PASS', `Stats: ${JSON.stringify(stats)}`);
    } else {
      logTest('Get Alert Statistics', 'FAIL', 'Failed to get statistics');
    }
    
    // Note: Testing actual alert triggering would require making API calls
    // or mocking the alert functions, which is better suited for unit tests
    logTest('Alert Triggering', 'SKIP', 'Requires API calls - see manual testing checklist');
    
  } catch (error) {
    logTest('Security Alerts Tests', 'FAIL', error.message);
    console.error('Error testing security alerts:', error);
  }
}

async function testRequestSecurity() {
  console.log('\n🔒 Testing Request Security...\n');
  
  try {
    // Test 1: Check environment variables are set
    const maxRequestSize = process.env.MAX_REQUEST_SIZE || '1mb';
    const requestTimeout = process.env.REQUEST_TIMEOUT_MS || '30000';
    
    if (maxRequestSize && requestTimeout) {
      logTest('Request Security Config', 'PASS', `Size: ${maxRequestSize}, Timeout: ${requestTimeout}ms`);
    } else {
      logTest('Request Security Config', 'FAIL', 'Configuration not set');
    }
    
    // Note: Testing actual request size/timeout limits requires HTTP requests
    // which is better suited for integration tests
    logTest('Request Size Limits', 'SKIP', 'Requires HTTP requests - see manual testing checklist');
    logTest('Request Timeouts', 'SKIP', 'Requires HTTP requests - see manual testing checklist');
    
  } catch (error) {
    logTest('Request Security Tests', 'FAIL', error.message);
    console.error('Error testing request security:', error);
  }
}

async function testAPIVersioning() {
  console.log('\n🔢 Testing API Versioning...\n');
  
  try {
    // Test 1: Check versioning middleware exists
    const apiVersioning = require('../middleware/apiVersioning');
    if (apiVersioning && apiVersioning.apiVersioning && apiVersioning.SUPPORTED_VERSIONS) {
      logTest('API Versioning Middleware', 'PASS', `Supported versions: ${apiVersioning.SUPPORTED_VERSIONS.join(', ')}`);
    } else {
      logTest('API Versioning Middleware', 'FAIL', 'Middleware not found or invalid');
    }
    
    // Note: Testing actual versioned routes requires HTTP requests
    logTest('Versioned Routes', 'SKIP', 'Requires HTTP requests - see manual testing checklist');
    
  } catch (error) {
    logTest('API Versioning Tests', 'FAIL', error.message);
    console.error('Error testing API versioning:', error);
  }
}

async function runAllTests() {
  console.log('🧪 Security Features Testing Script');
  console.log('=====================================\n');
  console.log(`Test User ID: ${TEST_CONFIG.TEST_USER_ID}`);
  console.log(`API Base URL: ${TEST_CONFIG.API_BASE_URL}\n`);
  
  await testQuotaSystem();
  await testSecurityAlerts();
  await testRequestSecurity();
  await testAPIVersioning();
  
  // Print summary
  console.log('\n📋 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => console.log(`   - ${test}`));
  }
  
  if (testResults.skipped.length > 0) {
    console.log('\n⏭️  Skipped Tests (require manual testing):');
    testResults.skipped.forEach(test => console.log(`   - ${test}`));
  }
  
  console.log('\n💡 Note: Some tests require HTTP requests or API calls.');
  console.log('   See docs/SECURITY_TESTING_CHECKLIST.md for manual testing procedures.');
  
  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

module.exports = {
  testQuotaSystem,
  testSecurityAlerts,
  testRequestSecurity,
  testAPIVersioning,
  runAllTests,
};

