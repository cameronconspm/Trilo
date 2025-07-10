import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/constants/colors';
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
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'subtle' && styles.subtle,
    style
  ];

  return (
    <View style={cardStyle}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
    marginVertical: Spacing.sm,
    ...Shadow.light,
  },
  elevated: {
    ...Shadow.medium,
    backgroundColor: Colors.card,
  },
  subtle: {
    backgroundColor: Colors.cardSecondary,
    ...Shadow.light,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  content: {
    width: '100%',
  },
});