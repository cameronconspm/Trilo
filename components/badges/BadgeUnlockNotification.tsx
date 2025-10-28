import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import { BadgeUnlockAnimation, getBadgeComponent } from './index';
import { UserBadge } from '@/types/finance';
import { Trophy } from 'lucide-react-native';

interface BadgeUnlockNotificationProps {
  badge: UserBadge;
  visible: boolean;
  onComplete?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function BadgeUnlockNotification({ 
  badge, 
  visible, 
  onComplete 
}: BadgeUnlockNotificationProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        dismissNotification();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, slideAnim, scaleAnim, opacityAnim]);

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  };

  if (!visible) return null;

  const BadgeComponent = getBadgeComponent(badge.badge_name);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <Card style={[styles.notificationCard, { backgroundColor: colors.cardBackground }] as any}>
        <View style={styles.content}>
          {/* Badge Animation */}
          <View style={styles.badgeContainer}>
            <BadgeUnlockAnimation
              badgeType={badge.badge_name}
              size={60}
              onAnimationComplete={() => {
                // Optional: Add completion callback
              }}
            />
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <View style={styles.headerRow}>
              <Trophy size={16} color={colors.success} />
              <Text style={[styles.headerText, { color: colors.success }]}>
                Badge Earned!
              </Text>
            </View>
            
            <Text style={[styles.badgeName, { color: colors.text }]}>
              {badge.badge_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            
            <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
              {badge.badge_description}
            </Text>
            
            <View style={styles.pointsRow}>
              <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
                XP Earned:
              </Text>
              <Text style={[styles.pointsValue, { color: colors.primary }]}>
                +{badge.points_earned}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: colors.success },
              {
                width: '100%', // This would be calculated based on progress
              },
            ]}
          />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 1000,
  },
  notificationCard: {
    borderRadius: BorderRadius.lg,
    ...Shadow.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  badgeContainer: {
    marginRight: Spacing.md,
  },
  textContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  badgeDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
