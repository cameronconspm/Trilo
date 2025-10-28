import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { CategoryType } from '@/types/finance';
import categories from '@/constants/categories';

interface CategoryCardProps {
  category: CategoryType;
  amount: number;
  count?: number;
  onPress?: () => void;
}

export default function CategoryCard({
  category,
  amount,
  count,
  onPress,
}: CategoryCardProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const categoryInfo = categories.find(c => c.id === category) || categories[0];

  const CardContent = () => (
    <View
      style={[
        styles.card,
        { 
          backgroundColor: colors.card,
          borderTopColor: categoryInfo.color, // 4px colored top border
        },
      ]}
    >
      {/* Category name (top): semi-bold, small size (Footnote) */}
      <Text
        style={[
          styles.categoryName, 
          { color: colors.text }
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {categoryInfo.name}
      </Text>
      
      {/* Amount (middle): bold, prominent (Title 3) */}
      <Text style={[
        styles.amount, 
        { color: colors.text }
      ]}>
        ${amount.toFixed(2)}
      </Text>
      
      {/* Item count (bottom): muted gray, small (Caption) */}
      {count !== undefined && (
        <Text style={[
          styles.count, 
          { color: colors.textSecondary }
        ]}>
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={`${categoryInfo.name} category with ${amount.toFixed(2)} total`}
        accessibilityRole='button'
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <CardContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexBasis: '48%', // 2-column layout with gap
    maxWidth: '48%', // Responsive: adapts to screen size
    minWidth: 0, // Allow shrinking
    marginBottom: Spacing.md, // Vertical spacing between rows
  },
  card: {
    borderRadius: 16, // Apple's modern 16px corner radius
    justifyContent: 'space-between',
    borderTopWidth: 4, // 4px colored top border
    paddingHorizontal: Spacing.lg, // 16px horizontal padding
    paddingVertical: Spacing.md, // 12px vertical padding
    minHeight: 100, // Consistent card height
    ...Shadow.card,
  },
  categoryName: {
    ...Typography.footnote, // Apple's Footnote style (13pt)
    fontWeight: '600', // Semi-bold
    textAlign: 'left', // Left alignment for better scanability
    marginBottom: Spacing.xs, // Small spacing after category name
  },
  amount: {
    ...Typography.h3, // Apple's Title 3 style (20pt)
    fontWeight: '700', // Bold
    textAlign: 'left', // Left alignment
    marginBottom: Spacing.xs, // Small spacing after amount
    flex: 1, // Take up remaining space
  },
  count: {
    ...Typography.caption, // Apple's Caption style (12pt)
    fontWeight: '400', // Regular weight
    textAlign: 'left', // Left alignment
    opacity: 0.8, // Muted appearance
  },
});
