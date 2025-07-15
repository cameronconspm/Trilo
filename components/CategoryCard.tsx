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
  },
  card: {
    borderRadius: BorderRadius.lg, // Standard 12px border radius
    padding: 12, // Reduced padding for smaller cards
    minHeight: 100, // Reduced height for 3-column layout
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    ...Shadow.card, // Standard card shadow
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8, // Reduced margin for smaller cards
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  categoryName: {
    fontSize: 12, // Smaller font for 3-column layout
    fontWeight: '500', // Medium weight
    flex: 1,
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  amount: {
    fontSize: 16, // Smaller currency display for 3-column layout
    fontWeight: '600', // Medium weight
    marginBottom: 4, // Reduced margin
    letterSpacing: -0.2,
  },
  count: {
    fontSize: 11, // Smaller count text
    fontWeight: '500',
  },
});