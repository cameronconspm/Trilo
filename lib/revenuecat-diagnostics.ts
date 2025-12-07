import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamic import for RevenueCat
let Purchases: any = null;

try {
  const RNPurchases = require('react-native-purchases');
  Purchases = RNPurchases.default;
} catch (e) {
  Purchases = null;
}

const REVENUECAT_API_KEY_IOS = 
  Constants.expoConfig?.extra?.revenueCatApiKeyIos ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ||
  'appl_KYJdeAHerYQeEgWWYLlFZVhXQBH';

/**
 * Diagnostic function to test RevenueCat configuration
 * Returns detailed information about the setup
 */
export async function diagnoseRevenueCat() {
  const diagnostics: {
    timestamp: string;
    platform: string;
    sdkAvailable: boolean;
    initialized: boolean;
    apiKey: string;
    appUserId: string | null;
    offerings: any;
    packages: any[];
    errors: string[];
    warnings: string[];
  } = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    sdkAvailable: !!Purchases,
    initialized: false,
    apiKey: REVENUECAT_API_KEY_IOS.substring(0, 15) + '...',
    appUserId: null,
    offerings: null,
    packages: [],
    errors: [],
    warnings: [],
  };

  // Check if SDK is available
  if (!Purchases) {
    diagnostics.errors.push('RevenueCat SDK not available - native module not linked');
    return diagnostics;
  }

  // Check if initialized
  try {
    const appUserId = await Purchases.getAppUserID();
    diagnostics.appUserId = appUserId;
    diagnostics.initialized = true;
  } catch (error: any) {
    diagnostics.errors.push(`RevenueCat not initialized: ${error?.message || 'Unknown error'}`);
    return diagnostics;
  }

  // Try to get offerings
  try {
    const offerings = await Purchases.getOfferings();
    diagnostics.offerings = {
      hasCurrent: !!offerings.current,
      currentIdentifier: offerings.current?.identifier || null,
      allOfferings: Object.keys(offerings.all || {}),
      offeringCount: Object.keys(offerings.all || {}).length,
    };

    if (!offerings.current) {
      diagnostics.warnings.push('No "Current" offering found in RevenueCat dashboard');
      diagnostics.warnings.push('Available offerings: ' + Object.keys(offerings.all || {}).join(', '));
    } else {
      const currentOffering = offerings.current;
      const packages = currentOffering.availablePackages || [];
      diagnostics.packages = packages.map((pkg: any) => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        product: {
          identifier: pkg.product.identifier,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
          currencyCode: pkg.product.currencyCode,
        },
      }));

      // Check for monthly/annual packages
      const monthlyPackage = packages.find((pkg: any) => {
        const identifier = (pkg.identifier || '').toLowerCase();
        return identifier.includes('monthly') || 
               identifier.includes('month') || 
               identifier.includes('$rc_monthly') ||
               pkg.packageType === 'MONTHLY';
      });

      const annualPackage = packages.find((pkg: any) => {
        const identifier = (pkg.identifier || '').toLowerCase();
        return identifier.includes('annual') || 
               identifier.includes('year') || 
               identifier.includes('yearly') ||
               identifier.includes('$rc_annual') ||
               pkg.packageType === 'ANNUAL';
      });

      if (!monthlyPackage) {
        diagnostics.warnings.push('Monthly package not found in current offering');
      }
      if (!annualPackage) {
        diagnostics.warnings.push('Annual package not found in current offering');
      }

      if (packages.length === 0) {
        diagnostics.warnings.push('Current offering has no packages attached');
      }
    }
  } catch (error: any) {
    diagnostics.errors.push(`Failed to get offerings: ${error?.message || 'Unknown error'}`);
    diagnostics.errors.push(`Error code: ${error?.code || 'N/A'}`);
  }

  // Try to get customer info
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    diagnostics.customerInfo = {
      hasActiveEntitlement: !!customerInfo.entitlements.active['premium_access'],
      entitlementStatus: customerInfo.entitlements.active['premium_access']?.isActive || false,
      activeSubscriptions: Object.keys(customerInfo.entitlements.active || {}),
      allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers || [],
    };
  } catch (error: any) {
    diagnostics.warnings.push(`Could not get customer info: ${error?.message || 'Unknown error'}`);
  }

  return diagnostics;
}

/**
 * Format diagnostics as a readable string
 */
export function formatDiagnostics(diagnostics: any): string {
  let output = '📊 RevenueCat Diagnostics\n';
  output += '═'.repeat(50) + '\n\n';
  output += `Timestamp: ${diagnostics.timestamp}\n`;
  output += `Platform: ${diagnostics.platform}\n\n`;

  output += 'SDK Status:\n';
  output += `  ✅ SDK Available: ${diagnostics.sdkAvailable ? 'Yes' : 'No'}\n`;
  output += `  ✅ Initialized: ${diagnostics.initialized ? 'Yes' : 'No'}\n`;
  output += `  API Key: ${diagnostics.apiKey}\n`;
  output += `  App User ID: ${diagnostics.appUserId || 'N/A'}\n\n`;

  if (diagnostics.offerings) {
    output += 'Offerings:\n';
    output += `  Current Offering: ${diagnostics.offerings.hasCurrent ? '✅ Yes' : '❌ No'}\n`;
    if (diagnostics.offerings.hasCurrent) {
      output += `  Identifier: ${diagnostics.offerings.currentIdentifier}\n`;
    }
    output += `  Total Offerings: ${diagnostics.offerings.offeringCount}\n`;
    if (diagnostics.offerings.allOfferings.length > 0) {
      output += `  Available: ${diagnostics.offerings.allOfferings.join(', ')}\n`;
    }
    output += '\n';
  }

  if (diagnostics.packages && diagnostics.packages.length > 0) {
    output += `Packages (${diagnostics.packages.length}):\n`;
    diagnostics.packages.forEach((pkg: any, index: number) => {
      output += `  ${index + 1}. ${pkg.identifier}\n`;
      output += `     Type: ${pkg.packageType}\n`;
      output += `     Product: ${pkg.product.identifier}\n`;
      output += `     Price: ${pkg.product.priceString}\n`;
    });
    output += '\n';
  }

  if (diagnostics.customerInfo) {
    output += 'Customer Info:\n';
    output += `  Has Premium: ${diagnostics.customerInfo.hasActiveEntitlement ? '✅ Yes' : '❌ No'}\n`;
    output += `  Active Subscriptions: ${diagnostics.customerInfo.activeSubscriptions.join(', ') || 'None'}\n`;
    output += '\n';
  }

  if (diagnostics.warnings.length > 0) {
    output += '⚠️ Warnings:\n';
    diagnostics.warnings.forEach((warning: string) => {
      output += `  • ${warning}\n`;
    });
    output += '\n';
  }

  if (diagnostics.errors.length > 0) {
    output += '❌ Errors:\n';
    diagnostics.errors.forEach((error: string) => {
      output += `  • ${error}\n`;
    });
    output += '\n';
  }

  if (diagnostics.errors.length === 0 && diagnostics.warnings.length === 0) {
    output += '✅ All checks passed!\n';
  }

  return output;
}

