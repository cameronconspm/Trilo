import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getCustomerInfo,
  hasPremiumAccess,
  hasFreeAccess,
  getSubscriptionPackages,
  purchasePackage as purchaseRevenueCatPackage,
  restorePurchases,
} from '@/lib/revenuecat';
import { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { SUBSCRIPTIONS_ENABLED } from '@/constants/features';
import { NETWORK_TIMEOUTS } from '@/constants/timing';

export type SubscriptionStatus = 'loading' | 'trial' | 'active' | 'expired' | 'freeAccess';

interface SubscriptionDetails {
  renewalDate: Date | null;
  price: string | null;
  productId: string | null;
}

interface SubscriptionContextType {
  status: SubscriptionStatus;
  isLoading: boolean;
  trialDaysRemaining: number | null;
  isLoadingPackages: boolean;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  subscriptionDetails: SubscriptionDetails;
  checkAccess: () => Promise<void>;
  purchaseSubscription: (pkg: PurchasesPackage) => Promise<void>;
  restoreSubscription: () => Promise<void>;
  hasAccess: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails>({
    renewalDate: null,
    price: null,
    productId: null,
  });

  // Check if user has access (trial, active, or free access)
  // When subscriptions are disabled, all users have access
  const hasAccess = !SUBSCRIPTIONS_ENABLED || status === 'trial' || status === 'active' || status === 'freeAccess';

  /**
   * Initialize subscription packages for display
   * Waits for RevenueCat initialization to complete before loading packages
   * DISABLED when SUBSCRIPTIONS_ENABLED is false
   */
  useEffect(() => {
    if (!SUBSCRIPTIONS_ENABLED) {
      setIsLoadingPackages(false);
      return;
    }

    const loadPackages = async (retryCount = 0) => {
      try {
        setIsLoadingPackages(true);
        if (__DEV__) {
          console.log('📦 Loading subscription packages from RevenueCat... (attempt ' + (retryCount + 1) + ')');
        }
        
        // Import RevenueCat utilities
        const revenueCat = await import('@/lib/revenuecat');
        
        // Wait for initialization with polling (check every 500ms, up to 10 seconds)
        let attempts = 0;
        const maxAttempts = 20; // 20 * 500ms = 10 seconds
        
        while (!revenueCat.isRevenueCatReady() && attempts < maxAttempts) {
          if (__DEV__) {
            console.warn('⚠️ RevenueCat not initialized yet, waiting... (' + (attempts + 1) + '/' + maxAttempts + ')');
          }
          await new Promise(resolve => setTimeout(resolve, NETWORK_TIMEOUTS.REVENUECAT_RETRY_DELAY));
          attempts++;
        }
        
        if (!revenueCat.isRevenueCatReady()) {
          // Always log errors, even in production
          console.error('❌ RevenueCat not initialized after waiting 10 seconds');
          if (__DEV__) {
            console.error('   This is expected in Expo Go. RevenueCat requires a TestFlight/production build.');
          }
          setIsLoadingPackages(false);
          return;
        }
        
        if (__DEV__) {
          console.log('✅ RevenueCat is ready, loading packages...');
        }
        const packages = await getSubscriptionPackages();
        if (__DEV__) {
          console.log('📦 Packages loaded:', {
            hasMonthly: !!packages.monthly,
            hasAnnual: !!packages.annual,
            monthlyId: packages.monthly?.identifier,
            annualId: packages.annual?.identifier,
            totalPackages: packages.all.length,
          });
        }
        setMonthlyPackage(packages.monthly);
        setAnnualPackage(packages.annual);
        
        if (!packages.monthly && !packages.annual && __DEV__) {
          console.warn('⚠️ No subscription packages found. Possible issues:');
          console.warn('   1. RevenueCat not initialized properly');
          console.warn('   2. No offerings configured in RevenueCat dashboard');
          console.warn('   3. Package identifiers not matching (monthly/annual/year)');
          console.warn('   4. Offerings not set as "Current" in RevenueCat dashboard');
          console.warn('   📋 Check RevenueCat dashboard: Products → Offerings → Ensure one is marked as "Current"');
        }
      } catch (error: any) {
        // Always log errors, even in production
        console.error('❌ Failed to load subscription packages:', error);
        if (__DEV__) {
          console.error('   Error details:', {
            message: error?.message,
            code: error?.code,
          });
        }
        
        // Retry once more after error (only for network/transient errors)
        if (retryCount === 0 && error?.code !== 'REVENUECAT_NOT_INITIALIZED') {
          if (__DEV__) {
            console.log('🔄 Retrying package load after error...');
          }
          setTimeout(() => {
            loadPackages(retryCount + 1);
          }, NETWORK_TIMEOUTS.REVENUECAT_PACKAGE_RETRY_DELAY);
          return;
        }
      } finally {
        setIsLoadingPackages(false);
      }
    };

    // Wait a bit longer for initialization to complete
    const timer = setTimeout(() => {
      loadPackages();
    }, NETWORK_TIMEOUTS.REVENUECAT_LOAD_DELAY);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Check user's subscription status and access
   * DISABLED: When subscriptions are disabled, all users get freeAccess
   */
  const checkAccess = async () => {
    if (!user) {
      setStatus(SUBSCRIPTIONS_ENABLED ? 'expired' : 'freeAccess');
      setIsLoading(false);
      return;
    }

    // If subscriptions are disabled, always grant free access
    if (!SUBSCRIPTIONS_ENABLED) {
      setStatus('freeAccess');
      setTrialDaysRemaining(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Check for free access (test users, etc.)
      if (hasFreeAccess(user.email || '')) {
        setStatus('freeAccess');
        setTrialDaysRemaining(null);
        setIsLoading(false);
        return;
      }

      // Get subscription data from Supabase
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
      }

      // Get RevenueCat customer info
      const customerInfo = await getCustomerInfo();
      
      // Check if user has active RevenueCat entitlement
      const hasPremium = await hasPremiumAccess();

      // Check if user is in trial period (even if they purchased during trial)
      const now = new Date();
      const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;
      const isInTrial = trialEnd && trialEnd > now;

      if (hasPremium && customerInfo) {
        // User has active paid subscription
        // BUT: if they're still in trial period, keep showing trial status
        // Subscription billing starts after trial ends (handled by Apple/Google)
        if (isInTrial) {
          // Still in trial - keep trial status even though they have active entitlement
          const daysRemaining = Math.ceil((trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setStatus('trial');
          setTrialDaysRemaining(daysRemaining);
        } else {
          // Trial ended - show as active subscription
          setStatus('active');
        }
        
        // Extract subscription details from RevenueCat
        const entitlement = customerInfo.entitlements.active['premium_access'];
        if (entitlement) {
          const expirationDate = entitlement.expirationDate 
            ? new Date(entitlement.expirationDate)
            : null;
          const productId = entitlement.productIdentifier || null;
          
          // Get price from active subscription product
          let price: string | null = null;
          
          // Try to get price from active subscriptions in CustomerInfo
          if (customerInfo.activeSubscriptions && customerInfo.activeSubscriptions.length > 0) {
            const activeSubId = customerInfo.activeSubscriptions[0];
            // Get price from packages based on product identifier
            if (productId) {
              const isAnnual = productId.includes('annual') || productId.includes('year');
              price = isAnnual 
                ? (annualPackage?.product.priceString || null)
                : (monthlyPackage?.product.priceString || null);
            }
          }
          
          // Fallback: get price from Supabase subscription_product_id if available
          if (!price && subscription?.subscription_product_id) {
            const isAnnual = subscription.subscription_product_id.includes('annual') || 
                            subscription.subscription_product_id.includes('year');
            price = isAnnual 
              ? (annualPackage?.product.priceString || null)
              : (monthlyPackage?.product.priceString || null);
          }
          
          setSubscriptionDetails({
            renewalDate: expirationDate,
            price,
            productId: productId || subscription?.subscription_product_id || null,
          });
        }
        
        // Update Supabase if needed
        if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trial')) {
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: user.id,
              status: isInTrial ? 'trial' : 'active',
              revenuecat_user_id: customerInfo.originalAppUserId,
              subscription_expires_at: customerInfo.entitlements.active['premium_access']?.expirationDate,
              updated_at: new Date().toISOString(),
            });
        }
      } else if (subscription?.status === 'trial' && !hasPremium) {
        // User is in trial period (no purchase yet)
        const trialEnd = new Date(subscription.trial_end);
        const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        if (daysRemaining > 0) {
          setStatus('trial');
          setTrialDaysRemaining(daysRemaining);
        } else {
          // Trial expired
          setStatus('expired');
          setTrialDaysRemaining(0);
          
          // Update Supabase
          await supabase
            .from('user_subscriptions')
            .update({ status: 'expired' })
            .eq('user_id', user.id);
        }
      } else if (!subscription) {
        // New user - start trial
        const trialStart = new Date();
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 7);

        await supabase.from('user_subscriptions').insert({
          user_id: user.id,
          status: 'trial',
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
        });

        setStatus('trial');
        setTrialDaysRemaining(7);
      } else {
        // Expired or no access
        setStatus('expired');
        setTrialDaysRemaining(0);
        setSubscriptionDetails({
          renewalDate: null,
          price: null,
          productId: null,
        });
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setStatus('expired');
      setSubscriptionDetails({
        renewalDate: null,
        price: null,
        productId: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize subscription check when user changes
   * When subscriptions are disabled, immediately set freeAccess
   */
  useEffect(() => {
    if (!SUBSCRIPTIONS_ENABLED && user) {
      setStatus('freeAccess');
      setTrialDaysRemaining(null);
      setIsLoading(false);
      return;
    }
    checkAccess();
  }, [user]);

  /**
   * Set RevenueCat user ID for tracking
   */
  useEffect(() => {
    if (user && status !== 'loading') {
      // Set RevenueCat app user ID to Supabase user ID
      // This is done automatically by RevenueCat SDK
      // but we sync it to Supabase for backend tracking
    }
  }, [user, status]);

  /**
   * Purchase a subscription package
   * If purchased during trial, subscription starts after trial ends
   * DISABLED when subscriptions are disabled
   */
  const purchaseSubscription = async (pkg: PurchasesPackage) => {
    if (!SUBSCRIPTIONS_ENABLED) {
      throw new Error('Subscriptions are currently disabled');
    }
    if (!user) throw new Error('Not authenticated');

    try {
      setIsLoading(true);
      
      // Purchase via RevenueCat
      const customerInfo = await purchaseRevenueCatPackage(pkg);
      
      // Get current subscription to check if user is in trial
      const { data: currentSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Check if user has active RevenueCat entitlement
      if (customerInfo.entitlements.active['premium_access']) {
        const now = new Date();
        const trialEnd = currentSubscription?.trial_end 
          ? new Date(currentSubscription.trial_end) 
          : null;
        
        // If user is in trial and trial hasn't ended, keep trial status
        // Subscription billing will start after trial ends (handled by Apple/Google)
        const isInTrial = trialEnd && trialEnd > now;
        
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            status: isInTrial ? 'trial' : 'active', // Keep trial status if still in trial
            revenuecat_user_id: customerInfo.originalAppUserId,
            subscription_product_id: pkg.identifier,
            subscription_expires_at: customerInfo.entitlements.active['premium_access'].expirationDate,
            // Preserve trial dates if still in trial
            trial_start: currentSubscription?.trial_start || undefined,
            trial_end: currentSubscription?.trial_end || undefined,
            updated_at: new Date().toISOString(),
          });

        // Keep trial status until trial ends, even though they have active entitlement
        if (isInTrial) {
          const daysRemaining = Math.ceil((trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setStatus('trial');
          setTrialDaysRemaining(daysRemaining);
        } else {
          setStatus('active');
        }
        
        // Refresh subscription details after purchase
        await checkAccess();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Restore previous purchases
   * DISABLED when subscriptions are disabled
   */
  const restoreSubscription = async () => {
    if (!SUBSCRIPTIONS_ENABLED) {
      throw new Error('Subscriptions are currently disabled');
    }
    if (!user) throw new Error('Not authenticated');

    try {
      setIsLoading(true);
      
      // Restore via RevenueCat
      const customerInfo = await restorePurchases();
      
      // Update Supabase
      if (customerInfo.entitlements.active['premium_access']) {
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            status: 'active',
            revenuecat_user_id: customerInfo.originalAppUserId,
            updated_at: new Date().toISOString(),
          });

        setStatus('active');
      } else {
        throw new Error('No active purchases found');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        status,
        isLoading,
        trialDaysRemaining,
        isLoadingPackages,
        monthlyPackage,
        annualPackage,
        subscriptionDetails,
        checkAccess,
        purchaseSubscription,
        restoreSubscription,
        hasAccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}

