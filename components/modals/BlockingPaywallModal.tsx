import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSubscription } from '@/context/SubscriptionContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing } from '@/constants/spacing';
import { useAlert } from '@/hooks/useAlert';

interface BlockingPaywallModalProps {
  visible: boolean;
}

/**
 * Blocking paywall modal that cannot be dismissed
 * Used when trial has expired and user hasn't activated a plan
 */
export function BlockingPaywallModal({ visible }: BlockingPaywallModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { showAlert } = useAlert();
  const { monthlyPackage, annualPackage, purchaseSubscription, restoreSubscription, isLoadingPackages, status } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<'monthly' | 'annual'>('annual');

  const handlePurchase = async () => {
    if (!monthlyPackage || !annualPackage) return;

    try {
      setIsPurchasing(true);
      const pkg = selectedPackage === 'annual' ? annualPackage : monthlyPackage;
      await purchaseSubscription(pkg);
      
      showAlert({
        title: 'Success',
        message: 'Subscription activated! Welcome to premium.',
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      // Modal will auto-close when status changes to 'active'
    } catch (error) {
      console.error('Purchase error:', error);
      showAlert({
        title: 'Purchase Failed',
        message: 'Unable to complete purchase. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await restoreSubscription();
      showAlert({
        title: 'Restored',
        message: 'Your purchases have been restored.',
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      // Modal will auto-close when status changes to 'active'
    } catch (error) {
      console.error('Restore error:', error);
      showAlert({
        title: 'Restore Failed',
        message: 'No purchases found to restore.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatPrice = (pkg: any) => {
    if (!pkg) return '';
    return pkg.product.priceString;
  };

  // Show loading state
  if (isLoadingPackages) {
    return (
      <ModalWrapper visible={visible} onClose={() => {}} animationType="fade" disableBackdropPress>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' }]}>
            Loading subscription plans...
          </Text>
        </View>
      </ModalWrapper>
    );
  }

  // Show error state if packages unavailable but still show UI
  const hasPackages = monthlyPackage && annualPackage;

  // Don't show if user has access (trial or active)
  if (status === 'trial' || status === 'active' || status === 'freeAccess') {
    return null;
  }

  return (
    <ModalWrapper visible={visible} animationType="slide" disableBackdropPress>
      <View style={styles.modalContent}>
        <ScrollView 
            showsVerticalScrollIndicator={false}
            style={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Trial Ended
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Your free trial has ended. Activate a subscription to continue using Trilo.
              </Text>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {[
                '✨ Advanced insights and analytics',
                '🎯 Unlimited goals and challenges',
                '📊 Detailed financial reports',
                '🔔 Smart notifications',
                '☁️ Cloud sync across devices',
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Show error message if packages not available */}
            {!hasPackages && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                  Unable to load subscription plans. Please check your connection and try again.
                </Text>
              </View>
            )}

            {/* Package Selection */}
            {hasPackages && (
              <View style={styles.packageContainer}>
                {/* Annual Package */}
                <TouchableOpacity
                  style={[
                    styles.packageOption,
                    selectedPackage === 'annual' && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '15',
                    },
                  ]}
                  onPress={() => setSelectedPackage('annual')}
                >
                  <View style={styles.packageHeader}>
                    <Text style={[styles.packageLabel, { color: colors.text }]}>
                      Annual
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>Best Value</Text>
                    </View>
                  </View>
                  <Text style={[styles.packagePrice, { color: colors.text }]}>
                    {formatPrice(annualPackage)}
                  </Text>
                  <Text style={[styles.packageDuration, { color: colors.textSecondary }]}>
                    per year • Just ${(annualPackage.product.price / 12).toFixed(2)}/month
                  </Text>
                </TouchableOpacity>

                {/* Monthly Package */}
                <TouchableOpacity
                  style={[
                    styles.packageOption,
                    selectedPackage === 'monthly' && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '15',
                    },
                  ]}
                  onPress={() => setSelectedPackage('monthly')}
                >
                  <View style={styles.packageHeader}>
                    <Text style={[styles.packageLabel, { color: colors.text }]}>
                      Monthly
                    </Text>
                  </View>
                  <Text style={[styles.packagePrice, { color: colors.text }]}>
                    {formatPrice(monthlyPackage)}
                  </Text>
                  <Text style={[styles.packageDuration, { color: colors.textSecondary }]}>
                    per month
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Purchase Button */}
            <TouchableOpacity
              style={[styles.purchaseButton, { backgroundColor: colors.primary }]}
              onPress={handlePurchase}
              disabled={isPurchasing || !monthlyPackage || !annualPackage}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  Activate Subscription
                </Text>
              )}
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
                  Restore Purchases
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    maxWidth: 500,
    padding: Spacing.xl,
    position: 'relative',
  },
  scrollContent: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  features: {
    marginBottom: 24,
  },
  featureItem: {
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
  },
  packageContainer: {
    marginBottom: 20,
    gap: 12,
  },
  packageOption: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    borderColor: '#E0E0E0',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  packageDuration: {
    fontSize: 14,
  },
  purchaseButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    marginVertical: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

