import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { LucideIcon } from 'lucide-react-native';

interface OnboardingScreenProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  illustration?: React.ReactNode;
}

export function OnboardingScreen({
  icon: Icon,
  title,
  description,
  illustration,
}: OnboardingScreenProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xxl,
      paddingVertical: Spacing.xxxl,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: BorderRadius.xxxl,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xxxl,
      ...Shadow.medium,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    description: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: Spacing.lg,
    },
    illustrationContainer: {
      marginBottom: Spacing.xxxl,
      width: '100%',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {illustration ? (
        <View style={styles.illustrationContainer}>{illustration}</View>
      ) : (
        <View style={styles.iconContainer}>
          <Icon size={56} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

