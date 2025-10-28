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
  console.log('⚠️ RevenueCat native module not available (Expo Go)');
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
      return;
    }

    // Skip if Purchases module not available (Expo Go)
    if (!Purchases) {
      console.log('⚠️ RevenueCat not available in Expo Go');
      console.log('📝 RevenueCat requires a development build to work');
      isRevenueCatInitialized = false;
      return;
    }

    let apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    // Skip initialization if using placeholder keys
    if (apiKey.includes('YOUR_') || apiKey.includes('_HERE')) {
      console.log('⚠️ RevenueCat not configured - using Test Store for Expo Go');
      // Use Test Store key for Expo Go
      apiKey = REVENUECAT_TEST_KEY;
    }
    
    await Purchases.configure({ apiKey });
    isRevenueCatInitialized = true;
    console.log('✅ RevenueCat initialized successfully');
  } catch (error) {
    console.error('❌ RevenueCat initialization failed:', error);
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
export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!isRevenueCatInitialized) {
    console.log('⚠️ RevenueCat not initialized yet');
    return [];
  }
  
  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;
    
    if (currentOffering) {
      return currentOffering.availablePackages;
    }
    
    console.warn('No current offering found');
    return [];
  } catch (error) {
    console.error('Failed to get packages:', error);
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
    
    const monthlyPackage = packages.find(pkg => 
      pkg.identifier.includes('monthly') || pkg.identifier.includes('month')
    );
    const annualPackage = packages.find(pkg => 
      pkg.identifier.includes('annual') || pkg.identifier.includes('year')
    );
    
    return {
      monthly: monthlyPackage,
      annual: annualPackage,
      all: packages,
    };
  } catch (error) {
    console.error('Failed to get subscription packages:', error);
    return { monthly: null, annual: null, all: [] };
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
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
export async function restorePurchases(): Promise<CustomerInfo> {
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
    console.log('⚠️ RevenueCat not initialized - returning false for premium access');
    return false;
  }
  
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium_access'] !== undefined;
  } catch (error) {
    console.error('Failed to check premium access:', error);
    return false;
  }
}

/**
 * Get customer info (subscription status, entitlements, etc.)
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatInitialized) {
    console.log('⚠️ RevenueCat not initialized');
    return null;
  }
  
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
}

/**
 * Check if user email is in free access list
 */
export function hasFreeAccess(email: string): boolean {
  return FREE_ACCESS_EMAILS.includes(email.toLowerCase());
}

