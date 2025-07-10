import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFinance } from '@/context/FinanceContext';
import Header from '@/components/Header';
import Card from '@/components/Card';
import InsightCard from '@/components/InsightCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';

export default function InsightsScreen() {
  const { monthlyInsights, isLoading } = useFinance();
  const { totalSpent, totalSaved, topSpendingCategory, insights, recentTransactions } = monthlyInsights;
  
  const hasInsights = insights.length > 0;
  const hasRecentTransactions = recentTransactions.length > 0;
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Insights"
          subtitle="This month's highlights"
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
        subtitle="This month's highlights"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.highlightsContainer}>
          <Card variant="elevated" style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Total Spent</Text>
            <Text style={styles.highlightValue}>
              ${totalSpent > 0 ? totalSpent.toFixed(2) : '0.00'}
            </Text>
          </Card>
          
          <Card variant="elevated" style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Total Saved</Text>
            <Text style={[styles.highlightValue, styles.savedValue]}>
              ${totalSaved > 0 ? totalSaved.toFixed(2) : '0.00'}
            </Text>
          </Card>
        </View>
        
        {topSpendingCategory.amount > 0 && (
          <Card variant="elevated" style={styles.topCategoryCard}>
            <Text style={styles.highlightLabel}>Top Spending Category</Text>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: topSpendingCategory.category.color }]} />
              <Text style={styles.topCategoryName}>{topSpendingCategory.category.name}</Text>
            </View>
            <Text style={styles.topCategoryAmount}>${topSpendingCategory.amount.toFixed(2)}</Text>
          </Card>
        )}
        
        <Text style={styles.sectionTitle}>Insights</Text>
        {hasInsights ? (
          insights.map((insight, index) => (
            <InsightCard key={index} text={insight} />
          ))
        ) : (
          <Card variant="subtle">
            <EmptyState 
              icon="trending"
              title="No insights yet"
              subtitle="Add some transactions to get personalized financial insights"
            />
          </Card>
        )}
        
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
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
              title="No recent transactions"
              subtitle="Your transaction history will appear here"
            />
          )}
        </Card>
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
  highlightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  highlightCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  highlightLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  savedValue: {
    color: Colors.success,
  },
  topCategoryCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  topCategoryName: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  topCategoryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
});