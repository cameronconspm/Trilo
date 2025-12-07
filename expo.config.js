const { getDefaultConfig } = require('expo/metro-config');
const withPlaidLink = require('./plugins/withPlaidLink');

module.exports = {
  expo: {
    name: 'Trilo',
    slug: 'trilo',
    owner: 'cameroncons',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'trilo',
    userInterfaceStyle: 'automatic',
    // New Architecture enabled - react-native-plaid-link-sdk v12.5.1+ supports new arch
    // If native module linking issues persist, try disabling with: newArchEnabled: false
    newArchEnabled: true,
    jsEngine: 'hermes',
    
    // Splash screen configuration
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#4E91F9'
    },
    
    // iOS configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'org.name.Trilo',
      buildNumber: '2',
      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#4E91F9'
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to access your photos',
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
        NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone',
        UIViewControllerBasedStatusBarAppearance: false,
        UIStatusBarHidden: false,
        CFBundleURLTypes: [
          {
            CFBundleURLName: 'plaidlink',
            CFBundleURLSchemes: ['plaidlink']
          }
        ]
      },
      usesIcloudStorage: true
    },
    
    // Android configuration
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.trilo.app',
      versionCode: 1,
      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#4E91F9'
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.SCHEDULE_EXACT_ALARM'
      ]
    },
    
    // Web configuration
    web: {
      favicon: './assets/images/favicon.png'
    },
    
    // Plugins
    plugins: [
      [
        'expo-router',
        {
          origin: 'https://rork.com/'
        }
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Trilo needs access to your photos to select profile pictures.',
          cameraPermission: 'Trilo needs access to your camera to take profile pictures.'
        }
      ],
      [
        'expo-notifications',
        {
          defaultChannel: 'default',
          enableBackgroundRemoteNotifications: false
        }
      ],
      'expo-font',
      'expo-web-browser',
      // Plaid Link plugin - conditionally applied
      // Note: Plaid will gracefully handle missing native module in Expo Go
      withPlaidLink
    ],
    
    // Experiments
    experiments: {
      typedRoutes: true
    },
    
    // Extra configuration
    extra: {
      router: {
        origin: 'https://rork.com/'
      },
      eas: {
        projectId: '75bef967-5779-49d0-bc57-ae4f0621a7d4'
      },
      supabaseUrl: 'https://raictkrsnejvfvpgqzcq.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaWN0a3JzbmVqdmZ2cGdxemNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTI4NDYsImV4cCI6MjA3NzA2ODg0Nn0.VGIKiPi03R_FgaXvYppCwvDkNXQMSu9xJ1H51Z2Eulw',
      plaidApiUrl: 'https://trilo-production.up.railway.app/api/plaid',
      revenueCatApiKeyIos: 'appl_KYJdeAHerYQeEgWWYLlFZVhXQBH',
      revenueCatApiKeyAndroid: 'goog_YOUR_ANDROID_KEY_HERE'
    },
    
    // Platform support
    platforms: ['ios', 'android', 'web'],
    
    // Privacy setting
    privacy: 'public',
    
    // Metro configuration
    metro: getDefaultConfig(__dirname),
  },
};
