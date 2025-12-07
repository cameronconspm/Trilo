import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSubscription } from '@/context/SubscriptionContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing } from '@/constants/spacing';
import { useAlert } from '@/hooks/useAlert';

interface PaywallModalProps {
  visible: boolean;
  onClose?: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { showAlert } = useAlert();
  const { monthlyPackage, annualPackage, purchaseSubscription, restoreSubscription, isLoadingPackages, status } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<'monthly' | 'annual'>('annual');

  // Always show packages if available, even during loading
  // Only show fallback message if packages truly unavailable (not just loading)

  const handlePurchase = async () => {
    if (!monthlyPackage || !annualPackage) return;

    try {
      setIsPurchasing(true);
      const pkg = selectedPackage === 'annual' ? annualPackage : monthlyPackage;
      await purchaseSubscription(pkg);
      
      // Show appropriate message based on trial status
      const isInTrial = status === 'trial';
      showAlert({
        title: 'Success',
        message: isInTrial 
          ? 'Subscription activated! Your subscription will begin after your trial ends. Enjoy full access until then!'
          : 'Subscription activated! Welcome to premium.',
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      onClose?.();
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
      onClose?.();
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

  const getSelectedPackage = () => {
    if (selectedPackage === 'annual') return annualPackage;
    return monthlyPackage;
  };

  // Show loading state
  if (isLoadingPackages) {
    return (
      <ModalWrapper visible={visible} onClose={onClose} animationType="fade">
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

  return (
    <ModalWrapper visible={visible} onClose={onClose} animationType="slide">
      <View style={styles.modalContent}>
        <ScrollView 
            showsVerticalScrollIndicator={false}
            style={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Unlock Premium
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {status === 'trial' 
                  ? 'Your subscription will start after your trial ends. Enjoy full access until then!'
                  : 'Get unlimited access to all premium features'
                }
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
                  {status === 'trial' ? 'Activate Subscription' : 'Subscribe Now'}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Trial Info Message */}
            {status === 'trial' && (
              <Text style={[styles.trialInfo, { color: colors.textSecondary }]}>
                Your subscription will begin automatically after your trial ends. You'll continue to have full access during your trial period.
              </Text>
            )}

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

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    maxWidth: 500, // Standard modal max width
    padding: Spacing.xl, // Standard modal padding (24px)
    position: 'relative',
  },
  scrollContent: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    marginBottom: Spacing.lg, // Standard spacing (16px)
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
  closeButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
  },
  trialInfo: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 18,
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

