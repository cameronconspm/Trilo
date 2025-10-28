const { getDefaultConfig } = require('expo/metro-config');

module.exports = {
  expo: {
    name: 'Trilo',
    slug: 'trilo',
    owner: 'cameroncons',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
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
      bundleIdentifier: 'com.trilo.app',
      buildNumber: '1',
      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#4E91F9'
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to access your photos',
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
        NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone'
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
          photosPermission: 'The app accesses your photos to let you share them with your friends.'
        }
      ],
      [
        'expo-notifications',
        {
          defaultChannel: 'default',
          enableBackgroundRemoteNotifications: false
        }
      ]
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
      }
    },
    
    // Platform support
    platforms: ['ios', 'android', 'web'],
    
    // Privacy setting
    privacy: 'public',
    
    // Metro configuration
    metro: getDefaultConfig(__dirname),
  },
};
