import React, { useState } from 'react';
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
import { Card } from '@/components/layout/Card';
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

  // Show message instead of paywall if RevenueCat not available
  if (!monthlyPackage && !annualPackage && !isLoadingPackages) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)' }]}>
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        >
          <View />
        </TouchableOpacity>
        <View 
          style={[
            styles.modal, 
            { 
              backgroundColor: colors.card,
              ...Platform.select({
                ios: {
                  shadowColor: theme === 'dark' ? '#FFFFFF' : '#000000',
                  shadowOffset: { width: 0, height: 24 },
                  shadowOpacity: theme === 'dark' ? 0.15 : 0.2,
                  shadowRadius: 48,
                },
                android: {
                  elevation: 24,
                },
              }),
            }
          ]} 
          pointerEvents="box-none"
        >
          {/* Outline with subtle light highlight */}
          <View style={[
            styles.modalOutline,
            {
              borderWidth: 1,
              borderColor: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.06)',
              ...Platform.select({
                ios: theme === 'dark' && {
                  shadowColor: '#FFFFFF',
                  shadowOffset: { width: -1, height: -1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 8,
                },
              }),
            }
          ]} />
            <Text style={[styles.title, { color: colors.text }]}>
              Unlock Premium
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 24 }]}>
              Premium subscriptions are coming soon! 
              {'\n\n'}
              In the meantime, enjoy your free trial with full access to all features.
            </Text>
            <TouchableOpacity
              style={[styles.purchaseButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.purchaseButtonText}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const handlePurchase = async () => {
    if (!monthlyPackage || !annualPackage) return;

    try {
      setIsPurchasing(true);
      const pkg = selectedPackage === 'annual' ? annualPackage : monthlyPackage;
      await purchaseSubscription(pkg);
      
      showAlert('Success', 'Subscription activated! Welcome to premium.');
      onClose?.();
    } catch (error) {
      console.error('Purchase error:', error);
      showAlert('Purchase Failed', 'Unable to complete purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await restoreSubscription();
      showAlert('Restored', 'Your purchases have been restored.');
      onClose?.();
    } catch (error) {
      console.error('Restore error:', error);
      showAlert('Restore Failed', 'No purchases found to restore.');
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

  if (isLoadingPackages) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)' }]}>
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        >
          <View />
        </TouchableOpacity>
        <View 
          style={[
            styles.modal, 
            { 
              backgroundColor: colors.card,
              ...Platform.select({
                ios: {
                  shadowColor: theme === 'dark' ? '#FFFFFF' : '#000000',
                  shadowOffset: { width: 0, height: 24 },
                  shadowOpacity: theme === 'dark' ? 0.15 : 0.2,
                  shadowRadius: 48,
                },
                android: {
                  elevation: 24,
                },
              }),
            }
          ]} 
          pointerEvents="box-none"
        >
          {/* Outline with subtle light highlight */}
          <View style={[
            styles.modalOutline,
            {
              borderWidth: 1,
              borderColor: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.06)',
              ...Platform.select({
                ios: theme === 'dark' && {
                  shadowColor: '#FFFFFF',
                  shadowOffset: { width: -1, height: -1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 8,
                },
              }),
            }
          ]} />
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
                Get unlimited access to all premium features
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

            {/* Package Selection */}
            {monthlyPackage && annualPackage && (
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
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  Subscribe Now
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalOutline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    pointerEvents: 'none',
  },
  scrollContent: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    marginBottom: 24,
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
});

