import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  variant?: 'default' | 'elevated' | 'subtle';
}

export default function Card({ 
  children, 
  title, 
  style, 
  titleStyle, 
  contentStyle,
  variant = 'default'
}: CardProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const cardStyle = [
    styles.card,
    { backgroundColor: colors.card },
    variant === 'elevated' && [styles.elevated, { backgroundColor: colors.card }],
    variant === 'subtle' && [styles.subtle, { backgroundColor: colors.cardSecondary }],
    style
  ];

  return (
    <View style={cardStyle}>
      {title && <Text style={[styles.title, { color: colors.text }, titleStyle]}>{title}</Text>}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg, // Standard 12px border radius
    padding: Spacing.cardPadding, // Standard 16px padding inside
    marginBottom: Spacing.cardMargin, // Standard 16px margin between cards
    ...Shadow.card, // Standard card shadow
  },
  elevated: {
    ...Shadow.medium,
    borderRadius: BorderRadius.lg,
  },
  subtle: {
    ...Shadow.light,
    borderRadius: BorderRadius.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.md,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  content: {
    width: '100%',
  },
});