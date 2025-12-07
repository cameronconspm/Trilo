const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for Plaid Link SDK
 * 
 * This plugin configures:
 * 1. iOS Info.plist with plaidlink URL scheme
 * 2. Android manifest with INTERNET permission
 * 
 * Note: Native module linking is handled automatically by React Native autolinking
 * (react-native-plaid-link-sdk must be in package.json dependencies)
 */
const withPlaidLink = (config) => {
  // Verify react-native-plaid-link-sdk is in dependencies
  // Read package.json directly since config.dependencies may not be populated during build
  try {
    // Try multiple possible paths for package.json
    const possiblePaths = [
      path.join(config._internal?.projectRoot || '', 'package.json'),
      path.join(process.cwd(), 'package.json'),
      path.resolve('package.json'),
    ];
    
    let packageJson = null;
    for (const packageJsonPath of possiblePaths) {
      try {
        if (fs.existsSync(packageJsonPath)) {
          packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          break;
        }
      } catch (e) {
        // Try next path
        continue;
      }
    }
    
    if (packageJson) {
      const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
      
      if (!dependencies['react-native-plaid-link-sdk']) {
        console.warn(
          '⚠️  react-native-plaid-link-sdk not found in dependencies.\n' +
          '   The native module will not be available. Add it to package.json:\n' +
          '   npm install react-native-plaid-link-sdk'
        );
      } else {
        console.log(`✅ react-native-plaid-link-sdk found in dependencies (version: ${dependencies['react-native-plaid-link-sdk']})`);
      }
    } else {
      // If we can't read package.json, just continue - autolinking will handle it
      console.log('ℹ️  Could not read package.json to verify dependencies (this is OK - autolinking will handle it)');
    }
  } catch (error) {
    // If we can't read package.json, just continue - autolinking will handle it
    console.log('ℹ️  Could not verify react-native-plaid-link-sdk in dependencies (this is OK - autolinking will handle it)');
  }

  // iOS configuration
  config = withInfoPlist(config, (config) => {
    // Add CFBundleURLTypes for Plaid Link
    const existingUrlTypes = config.modResults.CFBundleURLTypes || [];
    
    // Check if plaidlink scheme already exists
    const hasPlaidScheme = existingUrlTypes.some(
      urlType => urlType.CFBundleURLSchemes && urlType.CFBundleURLSchemes.includes('plaidlink')
    );
    
    if (!hasPlaidScheme) {
      config.modResults.CFBundleURLTypes = [
        ...existingUrlTypes,
        {
          CFBundleURLName: 'plaidlink',
          CFBundleURLSchemes: ['plaidlink']
        }
      ];
      console.log('✅ Added plaidlink URL scheme to Info.plist');
    } else {
      console.log('✅ plaidlink URL scheme already configured');
    }
    
    return config;
  });

  // Android configuration
  config = withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    
    // Add internet permission if not already present
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    
    const hasInternetPermission = manifest['uses-permission'].some(
      permission => permission.$['android:name'] === 'android.permission.INTERNET'
    );
    
    if (!hasInternetPermission) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.INTERNET' }
      });
      console.log('✅ Added INTERNET permission to Android manifest');
    } else {
      console.log('✅ INTERNET permission already configured');
    }
    
    return config;
  });

  return config;
};

module.exports = withPlaidLink;
