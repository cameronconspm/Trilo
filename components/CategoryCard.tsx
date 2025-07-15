import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { CategoryType } from '@/types/finance';
import categories from '@/constants/categories';

interface CategoryCardProps {
  category: CategoryType;
  amount: number;
  count?: number;
}

export default function CategoryCard({ category, amount, count }: CategoryCardProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const categoryInfo = categories.find(c => c.id === category) || categories[0];
  
  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: categoryInfo.color }]}>
        <View style={styles.header}>
          <View style={[styles.colorDot, { backgroundColor: categoryInfo.color }]} />
          <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>{categoryInfo.name}</Text>
        </View>
        <Text style={[styles.amount, { color: colors.text }]}>${amount.toFixed(2)}</Text>
        {count !== undefined && (
          <Text style={[styles.count, { color: colors.textSecondary }]}>{count} {count === 1 ? 'item' : 'items'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexBasis: '31%', // 3 columns with gap
    maxWidth: '31%',
    minWidth: 0, // Allow shrinking
  },
  card: {
    borderRadius: BorderRadius.lg, // Standard 12px border radius
    padding: 10, // Optimized padding for 3-column layout
    minHeight: 90, // Optimized height for 3-column layout
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    ...Shadow.card, // Standard card shadow
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6, // Optimized margin for smaller cards
    minHeight: 0,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginRight: 6,
    marginTop: 3,
    flexShrink: 0,
  },
  categoryName: {
    fontSize: 11, // Optimized font for 3-column layout
    fontWeight: '500', // Medium weight
    flex: 1,
    lineHeight: 14,
    letterSpacing: -0.05,
    minHeight: 0,
  },
  amount: {
    fontSize: 14, // Optimized currency display for 3-column layout
    fontWeight: '600', // Medium weight
    marginBottom: 2, // Minimal margin
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  count: {
    fontSize: 10, // Optimized count text
    fontWeight: '500',
    lineHeight: 12,
  },
});