import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import Header from '@/components/Header';
import Card from '@/components/Card';
import InsightCard from '@/components/InsightCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

export default function InsightsScreen() {
  const { monthlyInsights, isLoading } = useFinance();
  const { totalSpent, totalSaved, topSpendingCategory, insights, recentTransactions } = monthlyInsights;
  
  const hasInsights = insights.length > 0;
  const hasRecentTransactions = recentTransactions.length > 0;
  const hasData = totalSpent > 0 || totalSaved > 0;
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Insights"
          subtitle="Financial overview"
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Header 
        title="Insights"
        subtitle="Financial overview"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hasData ? (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
              <Card variant="elevated" style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <TrendingDown size={24} color={Colors.error} strokeWidth={2} />
                </View>
                <Text style={styles.metricLabel}>Total Spent</Text>
                <Text style={[styles.metricValue, { color: Colors.error }]}>
                  ${totalSpent.toFixed(2)}
                </Text>
              </Card>
              
              <Card variant="elevated" style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <TrendingUp size={24} color={Colors.success} strokeWidth={2} />
                </View>
                <Text style={styles.metricLabel}>Total Saved</Text>
                <Text style={[styles.metricValue, { color: Colors.success }]}>
                  ${totalSaved.toFixed(2)}
                </Text>
              </Card>
            </View>
            
            {/* Top Spending Category */}
            {topSpendingCategory.amount > 0 && (
              <Card variant="elevated" style={styles.topCategoryCard}>
                <View style={styles.topCategoryHeader}>
                  <View style={styles.topCategoryIcon}>
                    <Target size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={styles.topCategoryTitle}>Top Spending Category</Text>
                </View>
                
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: topSpendingCategory.category.color }]} />
                  <Text style={styles.topCategoryName}>{topSpendingCategory.category.name}</Text>
                </View>
                <Text style={styles.topCategoryAmount}>${topSpendingCategory.amount.toFixed(2)}</Text>
                
                <View style={styles.categoryInsight}>
                  <Text style={styles.categoryInsightText}>
                    This represents your highest spending area this month
                  </Text>
                </View>
              </Card>
            )}
            
            {/* AI Insights */}
            <Text style={styles.sectionTitle}>Smart Insights</Text>
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
            <Text style={styles.sectionTitle}>Recent Activity</Text>
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
                <DollarSign size={48} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.welcomeTitle}>Welcome to Insights!</Text>
              <Text style={styles.welcomeSubtitle}>
                Start tracking your expenses and income to see personalized financial insights and trends.
              </Text>
              
              <View style={styles.welcomeFeatures}>
                <View style={styles.featureItem}>
                  <TrendingUp size={20} color={Colors.success} strokeWidth={2} />
                  <Text style={styles.featureText}>Spending trends</Text>
                </View>
                <View style={styles.featureItem}>
                  <Target size={20} color={Colors.primary} strokeWidth={2} />
                  <Text style={styles.featureText}>Category analysis</Text>
                </View>
                <View style={styles.featureItem}>
                  <DollarSign size={20} color={Colors.warning} strokeWidth={2} />
                  <Text style={styles.featureText}>Savings tracking</Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.inactive,
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
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
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
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  topCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
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
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  topCategoryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  categoryInsight: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  categoryInsightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
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
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  welcomeFeatures: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: Spacing.md,
  },
});