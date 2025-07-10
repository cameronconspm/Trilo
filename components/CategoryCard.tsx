import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { CategoryType } from '@/types/finance';
import categories from '@/constants/categories';

interface CategoryCardProps {
  category: CategoryType;
  amount: number;
  count?: number;
}

export default function CategoryCard({ category, amount, count }: CategoryCardProps) {
  const categoryInfo = categories.find(c => c.id === category) || categories[0];
  
  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderLeftColor: categoryInfo.color }]}>
        <View style={styles.header}>
          <View style={[styles.colorDot, { backgroundColor: categoryInfo.color }]} />
          <Text style={styles.categoryName} numberOfLines={2}>{categoryInfo.name}</Text>
        </View>
        <Text style={styles.amount}>${amount.toFixed(2)}</Text>
        {count !== undefined && (
          <Text style={styles.count}>{count} {count === 1 ? 'item' : 'items'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 130,
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    ...Shadow.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.4,
  },
  count: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});