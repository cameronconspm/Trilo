import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Typography } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import ProgressBar from '@/components/feedback/ProgressBar';
import { Budget } from '@/types/finance';

interface BudgetCarouselProps {
  budget: Budget;
  budgetUtilization: number;
  remainingIncome: number;
  totalExpenses: number;
}

export function BudgetCarousel({
  budget,
  budgetUtilization,
  remainingIncome,
  totalExpenses,
}: BudgetCarouselProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = Spacing.lg; // 16px padding on each side for card content
  const cardSpacing = Spacing.md; // 12px spacing between cards
  // Card width accounts for the padding we added to scrollContainer
  const cardWidth = screenWidth - (2 * horizontalPadding);
  const snapInterval = cardWidth + cardSpacing;
  const totalCards = 3;


  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    setCurrentIndex(index);
  };

  const handleScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    const clampedIndex = Math.max(0, Math.min(index, totalCards - 1));
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: clampedIndex * snapInterval,
        animated: true,
      });
    }
    setCurrentIndex(clampedIndex);
  };

  const scrollToCard = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, totalCards - 1));
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: clampedIndex * snapInterval,
        animated: true,
      });
    }
    setCurrentIndex(clampedIndex);
  };

  // Card 1: Overview (Current design)
  const renderOverviewCard = () => (
    <View style={[styles.cardWrapper, { width: cardWidth }]}>
      <Card style={[styles.budgetCard, { marginBottom: 0 }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Monthly Budget
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Monthly Income
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${budget.income > 0 ? budget.income.toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Expenses
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${totalExpenses.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={budgetUtilization}
            color={
              budgetUtilization > 90
                ? colors.error
                : budgetUtilization > 75
                  ? colors.warning
                  : colors.success
            }
            label="Budget Utilization"
            showPercentage
          />
        </View>

          <View style={styles.remainingContainer}>
            <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>
              Remaining Budget
            </Text>
            <Text
              style={[
                styles.remainingValue,
                {
                  color: remainingIncome < 0 ? colors.error : colors.success,
                },
              ]}
            >
              ${remainingIncome.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.breakdownContainer, { borderTopColor: colors.border || 'rgba(0, 0, 0, 0.1)' }]}>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>
            Expense Breakdown
          </Text>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Given expenses
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              ${budget.expenses.given.toFixed(2)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              One-Time Expenses
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              ${budget.expenses.oneTime.toFixed(2)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Recurring expenses
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              ${budget.expenses.recurring.toFixed(2)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Savings
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              ${budget.expenses.savings.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );

  // Card 2: Category Breakdown
  const renderCategoryCard = () => {
    const categories = [
      { label: 'Given Expenses', value: budget.expenses.given, color: colors.primary },
      { label: 'One-Time', value: budget.expenses.oneTime, color: colors.warning },
      { label: 'Recurring', value: budget.expenses.recurring, color: colors.error },
      { label: 'Savings', value: budget.expenses.savings, color: colors.success },
    ];

    const maxValue = Math.max(...categories.map(c => c.value), budget.income || 1);

    return (
      <View style={[styles.cardWrapper, { width: cardWidth }]}>
        <Card style={[styles.budgetCard, { marginBottom: 0 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Category Breakdown
            </Text>
          </View>

          <View style={styles.categoryContainer}>
            {categories.map((category, index) => {
              const percentage = maxValue > 0 ? (category.value / maxValue) * 100 : 0;
              return (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLabelRow}>
                      <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                      <Text style={[styles.categoryLabel, { color: colors.text }]}>
                        {category.label}
                      </Text>
                    </View>
                    <Text style={[styles.categoryValue, { color: colors.text }]}>
                      ${category.value.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View
                      style={[
                        styles.categoryBar,
                        {
                          width: `${percentage}%`,
                          backgroundColor: category.color,
                          opacity: 0.2,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.totalContainer, { borderTopColor: colors.border || 'rgba(0, 0, 0, 0.1)' }]}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Total Expenses
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${totalExpenses.toFixed(2)}
            </Text>
          </View>
        </Card>
      </View>
    );
  };

  // Card 3: Budget Health
  const renderHealthCard = () => {
    const healthStatus =
      remainingIncome < 0
        ? { label: 'Over Budget', color: colors.error, icon: TrendingDown }
        : remainingIncome > budget.income * 0.3
          ? { label: 'Excellent', color: colors.success, icon: TrendingUp }
          : remainingIncome > budget.income * 0.1
            ? { label: 'Good', color: colors.warning, icon: Target }
            : { label: 'Caution', color: colors.warning, icon: AlertCircle };

    const StatusIcon = healthStatus.icon;

    return (
      <View style={[styles.cardWrapper, { width: cardWidth }]}>
        <Card style={[styles.budgetCard, { marginBottom: 0 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Budget Health
            </Text>
          </View>

          <View style={styles.healthContainer}>
            <View style={[styles.healthIconContainer, { backgroundColor: `${healthStatus.color}20` }]}>
              <StatusIcon size={32} color={healthStatus.color} />
            </View>
            <Text style={[styles.healthStatus, { color: healthStatus.color }]}>
              {healthStatus.label}
            </Text>
            <Text style={[styles.healthSubtitle, { color: colors.textSecondary }]}>
              {remainingIncome < 0
                ? `You're over budget by $${Math.abs(remainingIncome).toFixed(2)}`
                : `You have $${remainingIncome.toFixed(2)} remaining`}
            </Text>
          </View>

          <View style={[styles.healthStats, { borderTopColor: colors.border || 'rgba(0, 0, 0, 0.1)' }]}>
            <View style={styles.healthStat}>
              <Text style={[styles.healthStatLabel, { color: colors.textSecondary }]}>
                Utilization
              </Text>
              <Text style={[styles.healthStatValue, { color: colors.text }]}>
                {budgetUtilization.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.healthStat}>
              <Text style={[styles.healthStatLabel, { color: colors.textSecondary }]}>
                Budgeted
              </Text>
              <Text style={[styles.healthStatValue, { color: colors.text }]}>
                ${budget.income.toFixed(2)}
              </Text>
            </View>
            <View style={styles.healthStat}>
              <Text style={[styles.healthStatLabel, { color: colors.textSecondary }]}>
                Spent
              </Text>
              <Text style={[styles.healthStatValue, { color: colors.text }]}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };


  const scrollViewRefLayout = React.useRef<{ height: number; y: number } | null>(null);
  
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="center"
        pagingEnabled={false}
        bounces={true}
        overScrollMode="auto"
        contentInsetAdjustmentBehavior="never"
        onLayout={(event) => {
          const { height, y } = event.nativeEvent.layout;
          scrollViewRefLayout.current = { height, y };
        }}
      >
        {renderOverviewCard()}
        {renderCategoryCard()}
        {renderHealthCard()}
      </ScrollView>

      {/* Page Indicators */}
      <View 
        style={styles.pageIndicators}
        onLayout={() => {}}
      >
        {[0, 1, 2].map((index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pageIndicator,
              {
                backgroundColor: index === currentIndex ? colors.primary : colors.border,
              },
            ]}
            onPress={() => scrollToCard(index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0, // Reduced to bring Income section closer
    marginHorizontal: -Spacing.lg, // Extend beyond parent padding to prevent clipping
    overflow: 'visible', // Allow shadows to show beyond bounds
  },
  scrollContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md, // Increased from xs (4px) to md (12px) to allow card shadows to render fully (shadowRadius: 8 + shadowOffset: 2 = 10px needed)
    paddingHorizontal: Spacing.lg, // Add padding for shadow space and proper card spacing from screen edges
    alignItems: 'center', // For horizontal scroll view
  },
  cardWrapper: {
    marginRight: Spacing.md,
    overflow: 'visible', // Allow card shadows to render fully
  },
  budgetCard: {
    position: 'relative',
    marginBottom: 0, // Remove bottom margin for consistent spacing
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h3,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    ...Typography.currencyMedium,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  remainingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  remainingLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  remainingValue: {
    ...Typography.currency,
    fontWeight: '700',
  },
  breakdownContainer: {
    marginTop: 0,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  breakdownTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    ...Typography.bodySmall,
  },
  breakdownValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    ...Typography.bodySmall,
  },
  categoryValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  categoryBarContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  totalLabel: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  totalValue: {
    ...Typography.currencyMedium,
    fontWeight: '700',
  },
  healthContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  healthIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  healthStatus: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  healthSubtitle: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  healthStat: {
    alignItems: 'center',
  },
  healthStatLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  healthStatValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8, // More space from cards to allow shadows and match Banking (8px)
    marginBottom: Spacing.sm, // More space below dots (8px) to separate from bottom card
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

