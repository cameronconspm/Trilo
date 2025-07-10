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
        <IconComponent size={32} color={Colors.inactive} />
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
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.inactive,
    textAlign: 'center',
    lineHeight: 20,
  },
});