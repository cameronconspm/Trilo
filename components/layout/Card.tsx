import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'subtle';
}

export default function Card({
  children,
  title,
  style,
  titleStyle,
  contentStyle,
  variant = 'default',
}: CardProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { spacing } = useResponsiveDesign();

  const cardStyle = [
    styles.card,
    { 
      backgroundColor: colors.card,
      padding: spacing.cardPadding,
      marginBottom: spacing.cardMargin,
    },
    variant === 'elevated' && [
      styles.elevated,
      { backgroundColor: colors.card },
    ],
    variant === 'subtle' && [
      styles.subtle,
      { backgroundColor: colors.cardSecondary },
    ],
    style,
  ];

  return (
    <View style={cardStyle}>
      {title && (
        <Text style={[styles.title, { color: colors.text }, titleStyle]}>
          {title}
        </Text>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xxxl, // Apple's 28px corner radius
    ...Shadow.card,
  },
  elevated: {
    ...Shadow.medium,
    borderRadius: BorderRadius.xxxl, // Apple's 28px corner radius
  },
  subtle: {
    ...Shadow.light,
    borderRadius: BorderRadius.xxxl, // Apple's 28px corner radius
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  content: {
    width: '100%',
  },
});
