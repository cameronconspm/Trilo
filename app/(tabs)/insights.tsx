import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import Header from '@/components/Header';
import Card from '@/components/Card';
import InsightCard from '@/components/InsightCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

export default function InsightsScreen() {
  const { monthlyInsights, isLoading } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { totalSpent, totalSaved, topSpendingCategory, insights, recentTransactions } = monthlyInsights;
  
  const hasInsights = insights.length > 0;
  const hasRecentTransactions = recentTransactions.length > 0;
  const hasData = totalSpent > 0 || totalSaved > 0;
  
  if (isLoading) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Header 
          title="Insights"
          subtitle="Financial overview"
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.inactive }]}>Loading...</Text>
        </View>
      </SafeAreaView>
      </>
    );
  }
  
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header 
        title="Insights"
        subtitle="Financial overview"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
      >
        {hasData ? (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
              <Card variant="elevated" style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <TrendingDown size={24} color={colors.error} strokeWidth={2} />
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Spent</Text>
                <Text style={[styles.metricValue, { color: colors.error }]}>
                  ${totalSpent.toFixed(2)}
                </Text>
              </Card>
              
              <Card variant="elevated" style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <TrendingUp size={24} color={colors.success} strokeWidth={2} />
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Saved</Text>
                <Text style={[styles.metricValue, { color: colors.success }]}>
                  ${totalSaved.toFixed(2)}
                </Text>
              </Card>
            </View>
            
            {/* Top Spending Category */}
            {topSpendingCategory.amount > 0 && (
              <Card variant="elevated" style={styles.topCategoryCard}>
                <View style={styles.topCategoryHeader}>
                  <View style={styles.topCategoryIcon}>
                    <Target size={20} color={colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={[styles.topCategoryTitle, { color: colors.textSecondary }]}>Top Spending Category</Text>
                </View>
                
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: topSpendingCategory.category.color }]} />
                  <Text style={[styles.topCategoryName, { color: colors.text }]}>{topSpendingCategory.category.name}</Text>
                </View>
                <Text style={[styles.topCategoryAmount, { color: colors.text }]}>${topSpendingCategory.amount.toFixed(2)}</Text>
                
                <View style={styles.categoryInsight}>
                  <Text style={[styles.categoryInsightText, { color: colors.textSecondary }]}>
                    This represents your highest spending area this month
                  </Text>
                </View>
              </Card>
            )}
            
            {/* AI Insights */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Insights</Text>
            {hasInsights ? (
              <View style={styles.insightsContainer}>
                {insights.map((insight, index) => (
                  <InsightCard key={index} text={insight} />
                ))}
              </View>
            ) : (
              <Card variant="subtle">
                <EmptyState 
                  icon="trending"
                  title="Building insights..."
                  subtitle="Add more transactions to get personalized financial insights"
                />
              </Card>
            )}
            
            {/* Recent Transactions */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <Card>
              {hasRecentTransactions ? (
                recentTransactions.map((transaction, index) => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction}
                    isLast={index === recentTransactions.length - 1}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="dollar"
                  title="No recent transactions"
                  subtitle="Your transaction history will appear here"
                />
              )}
            </Card>
          </>
        ) : (
          /* No Data State */
          <View style={styles.noDataContainer}>
            <Card variant="elevated" style={styles.welcomeCard}>
              <View style={styles.welcomeIcon}>
                <DollarSign size={48} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome to Insights!</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Start tracking your expenses and income to see personalized financial insights and trends.
              </Text>
              
              <View style={styles.welcomeFeatures}>
                <View style={styles.featureItem}>
                  <TrendingUp size={20} color={colors.success} strokeWidth={2} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Spending trends</Text>
                </View>
                <View style={styles.featureItem}>
                  <Target size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Category analysis</Text>
                </View>
                <View style={styles.featureItem}>
                  <DollarSign size={20} color={colors.warning} strokeWidth={2} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Savings tracking</Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal, // 16px horizontal padding
    paddingTop: Spacing.lg, // 16px padding between header and first card
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  metricValue: {
    fontSize: 20, // Balanced metric display
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  topCategoryCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  topCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  topCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  topCategoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  topCategoryName: {
    fontSize: 18, // Balanced category name
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  topCategoryAmount: {
    fontSize: 22, // Balanced amount display
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
    lineHeight: 26,
  },
  categoryInsight: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  categoryInsightText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18, // Balanced section header
    fontWeight: '600',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.lg,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  insightsContainer: {
    marginBottom: Spacing.lg,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  welcomeCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: 22, // Balanced welcome title
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  welcomeSubtitle: {
    fontSize: 15, // Balanced subtitle
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    fontWeight: '400',
  },
  welcomeFeatures: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: 15, // Balanced feature text
    fontWeight: '500',
    marginLeft: Spacing.md,
    lineHeight: 20,
  },
});