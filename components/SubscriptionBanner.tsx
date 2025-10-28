import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSubscription } from '@/context/SubscriptionContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { PaywallModal } from './modals/PaywallModal';

interface SubscriptionBannerProps {
  onUpgradePress?: () => void;
}

export function SubscriptionBanner({ onUpgradePress }: SubscriptionBannerProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { status, trialDaysRemaining, hasAccess } = useSubscription();
  const [showPaywall, setShowPaywall] = React.useState(false);

  if (!hasAccess || status === 'loading' || status === 'freeAccess') {
    return null;
  }

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
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handlePress}
          >
            <Text style={styles.buttonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
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
    marginRight: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

