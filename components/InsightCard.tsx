import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface InsightCardProps {
  text: string;
}

export default function InsightCard({ text }: InsightCardProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.cardSecondary }]}>
        <TrendingUp size={18} color={colors.primary} strokeWidth={2.5} />
      </View>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    ...Shadow.medium,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});