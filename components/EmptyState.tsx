import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Plus, TrendingUp, DollarSign } from 'lucide-react-native';
import Colors from '@/constants/colors';
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
  const IconComponent = {
    plus: Plus,
    trending: TrendingUp,
    dollar: DollarSign,
  }[icon];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <IconComponent size={36} color={Colors.inactive} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
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
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.inactive,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});