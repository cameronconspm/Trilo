import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Plus, TrendingUp, DollarSign } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';

interface EmptyStateProps {
  icon?: 'plus' | 'trending' | 'dollar';
  title: string;
  subtitle: string;
}

export default function EmptyState({ 
  icon = 'plus', 
  title, 
  subtitle 
}: EmptyStateProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const IconComponent = {
    plus: Plus,
    trending: TrendingUp,
    dollar: DollarSign,
  }[icon];

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
        <IconComponent size={36} color={colors.inactive} strokeWidth={2} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.inactive }]}>{subtitle}</Text>
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});