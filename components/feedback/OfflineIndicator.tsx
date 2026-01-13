import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useNetworkStatus, getNetworkStatusMessage } from '@/hooks/useNetworkStatus';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, Typography } from '@/constants/spacing';

interface OfflineIndicatorProps {
  /**
   * Whether to show the indicator when offline
   * @default true
   */
  showWhenOffline?: boolean;
  
  /**
   * Custom message to display
   */
  customMessage?: string;
  
  /**
   * Style for the container
   */
  style?: any;
}

/**
 * OfflineIndicator Component
 * 
 * Displays a banner when the device is offline or has connection issues.
 * Automatically shows/hides based on network status.
 * 
 * @example
 * ```tsx
 * <OfflineIndicator />
 * ```
 */
export default function OfflineIndicator({
  showWhenOffline = true,
  customMessage,
  style,
}: OfflineIndicatorProps) {
  const networkStatus = useNetworkStatus();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [slideAnim] = React.useState(new Animated.Value(-100));

  React.useEffect(() => {
    if (networkStatus.isOffline && showWhenOffline) {
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [networkStatus.isOffline, showWhenOffline, slideAnim]);

  if (!networkStatus.isOffline || !showWhenOffline) {
    return null;
  }

  const message = customMessage || getNetworkStatusMessage(networkStatus);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.error || '#FF3B30',
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <WifiOff size={16} color="#FFFFFF" strokeWidth={2} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  message: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
});

