import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, TrendingUp, DollarSign, History } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Typography } from '@/constants/spacing';
import Button from '@/components/layout/Button';

interface EmptyStateProps {
  icon?: 'plus' | 'trending' | 'dollar' | 'history';
  title: string;
  subtitle: string;
  actionButton?: {
    label: string;
    onPress: () => void;
  };
}

export default function EmptyState({
  icon = 'plus',
  title,
  subtitle,
  actionButton,
}: EmptyStateProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  const getIconComponent = () => {
    switch (icon) {
      case 'plus':
        return Plus;
      case 'trending':
        return TrendingUp;
      case 'dollar':
        return DollarSign;
      case 'history':
        return History;
      default:
        return Plus;
    }
  };

  const IconComponent = getIconComponent();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.cardSecondary, borderColor: colors.border },
        ]}
      >
        <IconComponent size={32} color={colors.inactive} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.inactive }]}>
        {subtitle}
      </Text>
      {actionButton && (
        <View style={styles.actionButtonContainer}>
          <Button
            title={actionButton.label}
            onPress={actionButton.onPress}
            variant="primary"
            size="medium"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  title: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySmall, // Using new typography system
    textAlign: 'center',
  },
  actionButtonContainer: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 200,
  },
});
