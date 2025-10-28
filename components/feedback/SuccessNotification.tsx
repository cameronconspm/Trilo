import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, X } from 'lucide-react-native';
import Button from '@/components/layout/Button';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface SuccessNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  showProgressBar?: boolean;
  progress?: number; // 0-100
}

export default function SuccessNotification({
  visible,
  title,
  message,
  onDismiss,
  showProgressBar = false,
  progress = 100,
}: SuccessNotificationProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header with icon and close button */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.success}15` }]}>
          <CheckCircle size={20} color={colors.success} strokeWidth={2} />
        </View>
        
        <TouchableOpacity
          onPress={onDismiss}
          style={[styles.closeButton, { backgroundColor: colors.cardSecondary }]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      </View>

      {/* Progress bar (optional) */}
      {showProgressBar && (
        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
              },
            ]}
          />
        </View>
      )}

      {/* Dismiss button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Dismiss"
          onPress={onDismiss}
          variant="primary"
          size="medium"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    ...Shadow.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  progressContainer: {
    height: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  buttonContainer: {
    marginTop: Spacing.sm,
  },
});
