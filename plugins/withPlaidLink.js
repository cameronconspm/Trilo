const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

const withPlaidLink = (config) => {
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
    }
    
    return config;
  });

  return config;
};

module.exports = withPlaidLink;
