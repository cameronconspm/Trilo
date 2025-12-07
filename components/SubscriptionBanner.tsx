import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';
import { useSubscription } from '@/context/SubscriptionContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { PaywallModal } from './modals/PaywallModal';
import { Spacing } from '@/constants/spacing';
import { SUBSCRIPTIONS_ENABLED } from '@/constants/features';

const BANNER_DISMISSED_KEY = 'subscription_banner_dismissed';

interface SubscriptionBannerProps {
  onUpgradePress?: () => void;
}

export function SubscriptionBanner({ onUpgradePress }: SubscriptionBannerProps) {
  // Hide banner when subscriptions are disabled
  if (!SUBSCRIPTIONS_ENABLED) {
    return null;
  }

  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { status, trialDaysRemaining } = useSubscription();
  const [showPaywall, setShowPaywall] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  const hasActiveSubscription = status === 'active';

  // Check if banner was dismissed
  React.useEffect(() => {
    const checkDismissed = async () => {
      try {
        // Only respect dismissal if user has active subscription
        // If in trial/expired without subscription, always show banner
        if (hasActiveSubscription) {
          const dismissed = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
          if (dismissed === 'true') {
            setIsDismissed(true);
          }
        } else {
          // Clear dismissal if no active subscription - banner should always show
          await AsyncStorage.removeItem(BANNER_DISMISSED_KEY);
          setIsDismissed(false);
        }
      } catch (error) {
        console.error('Error checking banner dismissal:', error);
      }
    };
    checkDismissed();
  }, [hasActiveSubscription]);

  // Show banner for trial, expired, or active subscriptions
  if (status === 'loading' || status === 'freeAccess') {
    return null;
  }

  // Don't show if dismissed AND user has active subscription
  // For trial/expired without subscription, always show (dismissal cleared above)
  if (isDismissed && hasActiveSubscription) {
    return null;
  }

  const handleDismiss = async () => {
    try {
      // Only allow dismissal if user has active subscription
      if (hasActiveSubscription) {
        await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
        setIsDismissed(true);
      }
      // If no active subscription (trial/expired), dismissal is ignored - banner will show again
    } catch (error) {
      console.error('Error dismissing banner:', error);
    }
  };

  const handlePress = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      setShowPaywall(true);
    }
  };

  const getMessage = () => {
    if (status === 'trial' && trialDaysRemaining !== null) {
      if (trialDaysRemaining === 0) {
        return 'Trial ending today! Upgrade to keep access.';
      }
      return `${trialDaysRemaining} days left in your free trial`;
    }
    if (status === 'expired') {
      return 'Your trial has ended. Upgrade to continue.';
    }
    return 'Subscribe to unlock premium features';
  };

  const getButtonText = () => {
    if (status === 'trial') {
      return 'View Plans';
    }
    if (status === 'expired') {
      return 'Subscribe Now';
    }
    return 'Upgrade';
  };

  return (
    <>
      <View style={[styles.banner, { backgroundColor: colors.primary + '20' }]}>
        <View style={styles.content}>
          <Text style={[styles.message, { color: colors.text }]}>
            {getMessage()}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handlePress}
            >
              <Text style={styles.buttonText}>{getButtonText()}</Text>
            </TouchableOpacity>
            {/* Only show dismiss button if user has active subscription */}
            {hasActiveSubscription && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

