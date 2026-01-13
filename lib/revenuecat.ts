import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamic import for RevenueCat - only import if not in Expo Go
let Purchases: any = null;
let PurchasesPackage: any = null;
let CustomerInfo: any = null;

try {
  const RNPurchases = require('react-native-purchases');
  Purchases = RNPurchases.default;
  PurchasesPackage = RNPurchases.PurchasesPackage;
  CustomerInfo = RNPurchases.CustomerInfo;
} catch (e) {
  // If native module not available (Expo Go), Purchases will be null
  Purchases = null;
  if (__DEV__) {
    console.log('⚠️ RevenueCat native module not available (Expo Go)');
  }
}

/**
 * RevenueCat API Keys
 * 
 * IMPORTANT: Replace these with your actual keys from RevenueCat dashboard
 * 1. Go to: https://app.revenuecat.com
 * 2. Select your project
 * 3. Get keys from Settings > API Keys
 * 
 * For development: Use sandbox keys
 * For production: Use production keys (environment-specific)
 */
const REVENUECAT_API_KEY_IOS = 
  Constants.expoConfig?.extra?.revenueCatApiKeyIos ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ||
  'appl_KYJdeAHerYQeEgWWYLlFZVhXQBH';

// Test Store API Key for Expo Go testing
const REVENUECAT_TEST_KEY = 'test_WZofjonjnCbCdEuErpFFSbMGAkZ';

const REVENUECAT_API_KEY_ANDROID = 
  Constants.expoConfig?.extra?.revenueCatApiKeyAndroid ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ||
  'goog_YOUR_ANDROID_KEY_HERE'; // Replace with your actual key

let isRevenueCatInitialized = false;

// Test user emails that should bypass subscription checks
export const FREE_ACCESS_EMAILS = [
  'test@trilo.app', // Existing test account
  // Add more test users here
];

/**
 * Initialize RevenueCat
 * Call this once when the app starts (in _layout.tsx or App.tsx)
 */
export async function initializeRevenueCat(): Promise<void> {
  try {
    // Skip if already initialized
    if (isRevenueCatInitialized) {
      if (__DEV__) {
        console.log('✅ RevenueCat already initialized');
      }
      return;
    }

    // Skip if Purchases module not available (Expo Go)
    if (!Purchases) {
      if (__DEV__) {
        console.log('⚠️ RevenueCat not available in Expo Go');
        console.log('📝 RevenueCat requires a development build to work');
      }
      isRevenueCatInitialized = false;
      return;
    }

    let apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    // Skip initialization if using placeholder keys or empty keys
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_') || apiKey.includes('_HERE')) {
      if (__DEV__) {
        console.log('⚠️ RevenueCat not configured - using Test Store for Expo Go');
      }
      // Use Test Store key for Expo Go
      apiKey = REVENUECAT_TEST_KEY;
    }
    
    if (__DEV__) {
      console.log('🔧 Initializing RevenueCat with API key:', apiKey.substring(0, 10) + '...');
    }
    await Purchases.configure({ apiKey });
    isRevenueCatInitialized = true;
    if (__DEV__) {
      console.log('✅ RevenueCat initialized successfully');
      
      // Verify initialization by checking user ID
      const appUserID = await Purchases.getAppUserID();
      console.log('✅ RevenueCat app user ID:', appUserID);
    }
  } catch (error: any) {
    // Always log errors, even in production
    console.error('❌ RevenueCat initialization failed:', error);
    if (__DEV__) {
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
    }
    isRevenueCatInitialized = false;
    // Don't throw - allow app to continue without subscriptions
  }
}

/**
 * Check if RevenueCat is initialized
 */
export function isRevenueCatReady(): boolean {
  return isRevenueCatInitialized;
}

/**
 * Get available subscription packages
 * Returns monthly and annual packages
 */
export async function getPackages(): Promise<any[]> {
  if (!isRevenueCatInitialized) {
    if (__DEV__) {
      console.log('⚠️ RevenueCat not initialized yet');
    }
    return [];
  }

  if (!Purchases) {
    if (__DEV__) {
      console.error('❌ RevenueCat SDK not available - native module not linked');
    }
    return [];
  }
  
  try {
    if (__DEV__) {
      console.log('📦 Fetching offerings from RevenueCat...');
    }
    const offerings = await Purchases.getOfferings();
    if (__DEV__) {
      console.log('📦 Offerings received:', {
        hasCurrent: !!offerings.current,
        allOfferings: Object.keys(offerings.all).length,
        currentIdentifier: offerings.current?.identifier,
      });
    }
    
    const currentOffering = offerings.current;
    
    if (currentOffering) {
      const packages = currentOffering.availablePackages;
      if (__DEV__) {
        console.log('📦 Available packages:', {
          count: packages.length,
          identifiers: packages.map((pkg: any) => pkg.identifier),
        });
      }
      return packages;
    }
    
    if (__DEV__) {
      console.warn('⚠️ No current offering found. Available offerings:', Object.keys(offerings.all));
      console.warn('⚠️ Check RevenueCat dashboard: Products → Offerings → Set "Current" offering');
    }
    return [];
  } catch (error: any) {
    // Always log errors, even in production
    console.error('❌ Failed to get packages:', error);
    if (__DEV__) {
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        underlyingErrorMessage: error?.underlyingErrorMessage,
      });
    }
    return [];
  }
}

/**
 * Get subscription packages for display
 * Returns formatted data for the paywall UI
 */
export async function getSubscriptionPackages() {
  try {
    const packages = await getPackages();
    
    if (packages.length === 0) {
      if (__DEV__) {
        console.warn('⚠️ No packages available from RevenueCat');
      }
      return { monthly: null, annual: null, all: [] };
    }
    
    // Try multiple identifier patterns to find packages
    const monthlyPackage = packages.find(pkg => {
      const identifier = pkg.identifier?.toLowerCase() || '';
      return identifier.includes('monthly') || 
             identifier.includes('month') || 
             identifier.includes('$rc_monthly') ||
             pkg.packageType === 'MONTHLY';
    });
    
    const annualPackage = packages.find(pkg => {
      const identifier = pkg.identifier?.toLowerCase() || '';
      return identifier.includes('annual') || 
             identifier.includes('year') || 
             identifier.includes('yearly') ||
             identifier.includes('$rc_annual') ||
             pkg.packageType === 'ANNUAL';
    });
    
    if (__DEV__) {
      console.log('📦 Package matching results:', {
        totalPackages: packages.length,
        foundMonthly: !!monthlyPackage,
        foundAnnual: !!annualPackage,
        monthlyIdentifier: monthlyPackage?.identifier,
        annualIdentifier: annualPackage?.identifier,
        allIdentifiers: packages.map(p => p.identifier),
      });
      
      if (!monthlyPackage || !annualPackage) {
        console.warn('⚠️ Could not find monthly or annual packages. Package identifiers:', 
          packages.map(p => ({ id: p.identifier, type: p.packageType }))
        );
      }
    }
    
    return {
      monthly: monthlyPackage,
      annual: annualPackage,
      all: packages,
    };
  } catch (error: any) {
    // Always log errors, even in production
    console.error('❌ Failed to get subscription packages:', error);
    if (__DEV__) {
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
      });
    }
    return { monthly: null, annual: null, all: [] };
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(pkg: any): Promise<any> {
  if (!isRevenueCatInitialized) {
    throw new Error('RevenueCat not initialized');
  }
  
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 * Required for App Store guidelines
 */
export async function restorePurchases(): Promise<any> {
  if (!isRevenueCatInitialized) {
    throw new Error('RevenueCat not initialized');
  }
  
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Restore purchases failed:', error);
    throw error;
  }
}

/**
 * Check if user has active premium subscription
 */
export async function hasPremiumAccess(): Promise<boolean> {
  if (!isRevenueCatInitialized) {
    if (__DEV__) {
      console.log('⚠️ RevenueCat not initialized - returning false for premium access');
    }
    return false;
  }
  
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium_access'] !== undefined;
  } catch (error) {
    // Always log errors, even in production
    console.error('Failed to check premium access:', error);
    return false;
  }
}

/**
 * Get customer info (subscription status, entitlements, etc.)
 */
export async function getCustomerInfo(): Promise<any | null> {
  if (!isRevenueCatInitialized) {
    if (__DEV__) {
      console.log('⚠️ RevenueCat not initialized');
    }
    return null;
  }
  
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    // Always log errors, even in production
    console.error('Failed to get customer info:', error);
    return null;
  }
}

/**
 * Show native subscription management UI
 * Opens iOS Settings > Subscriptions or Android Play Store subscriptions
 */
export async function showManageSubscriptions(): Promise<void> {
  if (!isRevenueCatInitialized) {
    throw new Error('RevenueCat not initialized');
  }
  
  if (!Purchases) {
    throw new Error('RevenueCat SDK not available');
  }
  
  try {
    await Purchases.showManageSubscriptions();
  } catch (error) {
    console.error('Failed to show manage subscriptions:', error);
    throw error;
  }
}

/**
 * Check if user email is in free access list
 */
export function hasFreeAccess(email: string): boolean {
  return FREE_ACCESS_EMAILS.includes(email.toLowerCase());
}

