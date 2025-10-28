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

export type SubscriptionStatus = 'loading' | 'trial' | 'active' | 'expired' | 'freeAccess';

interface SubscriptionContextType {
  status: SubscriptionStatus;
  isLoading: boolean;
  trialDaysRemaining: number | null;
  isLoadingPackages: boolean;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
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

  // Check if user has access (trial, active, or free access)
  const hasAccess = status === 'trial' || status === 'active' || status === 'freeAccess';

  /**
   * Initialize subscription packages for display
   */
  useEffect(() => {
    const loadPackages = async () => {
      try {
        setIsLoadingPackages(true);
        const packages = await getSubscriptionPackages();
        setMonthlyPackage(packages.monthly);
        setAnnualPackage(packages.annual);
      } catch (error) {
        console.error('Failed to load subscription packages:', error);
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadPackages();
  }, []);

  /**
   * Check user's subscription status and access
   */
  const checkAccess = async () => {
    if (!user) {
      setStatus('expired');
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

      if (hasPremium && customerInfo) {
        // User has active paid subscription
        setStatus('active');
        
        // Update Supabase if needed
        if (!subscription || subscription.status !== 'active') {
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: user.id,
              status: 'active',
              revenuecat_user_id: customerInfo.originalAppUserId,
              updated_at: new Date().toISOString(),
            });
        }
      } else if (subscription?.status === 'trial') {
        // User is in trial period
        const now = new Date();
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
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setStatus('expired');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize subscription check when user changes
   */
  useEffect(() => {
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
   */
  const purchaseSubscription = async (pkg: PurchasesPackage) => {
    if (!user) throw new Error('Not authenticated');

    try {
      setIsLoading(true);
      
      // Purchase via RevenueCat
      const customerInfo = await purchaseRevenueCatPackage(pkg);
      
      // Update Supabase
      if (customerInfo.entitlements.active['premium_access']) {
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            status: 'active',
            revenuecat_user_id: customerInfo.originalAppUserId,
            subscription_product_id: pkg.identifier,
            subscription_expires_at: customerInfo.entitlements.active['premium_access'].expirationDate,
            updated_at: new Date().toISOString(),
          });

        setStatus('active');
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
   */
  const restoreSubscription = async () => {
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

