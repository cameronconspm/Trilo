import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFinance } from '@/context/FinanceContext';
import Header from '@/components/Header';
import Card from '@/components/Card';
import CircularProgress from '@/components/CircularProgress';
import CategoryCard from '@/components/CategoryCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

export default function OverviewScreen() {
  const { weeklyOverview, isLoading } = useFinance();
  const { weekIncome, remainingBalance, utilization, contributions, upcomingExpenses } = weeklyOverview;
  
  // Get current month and week
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  
  // Calculate week number (simplified)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekNumber = Math.ceil((today.getDate() + startOfMonth.getDay()) / 7);
  
  const hasContributions = Object.keys(contributions).length > 0;
  const hasUpcomingExpenses = upcomingExpenses.length > 0;
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title={`${month} ${year}`}
          subtitle={`Week ${weekNumber} view`}
          showAddButton
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
        title={`${month} ${year}`}
        subtitle={`Week ${weekNumber} view`}
        showAddButton
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Card variant="elevated" style={styles.incomeCard}>
          <View style={styles.incomeContainer}>
            <View style={styles.incomeTextContainer}>
              <Text style={styles.incomeLabel}>This week's income</Text>
              <Text style={styles.incomeValue}>
                ${weekIncome > 0 ? weekIncome.toFixed(2) : '0.00'}
              </Text>
              <Text style={styles.balanceLabel}>Remaining balance</Text>
              <Text style={[
                styles.balanceValue,
                remainingBalance < 0 && styles.negativeBalance
              ]}>
                ${remainingBalance.toFixed(2)}
              </Text>
            </View>
            <CircularProgress 
              percentage={utilization} 
              size={100} 
              color={utilization > 90 ? Colors.warning : Colors.primary}
            />
          </View>
        </Card>
        
        <Text style={styles.sectionTitle}>Week of Contributions</Text>
        {hasContributions ? (
          <View style={styles.categoryGrid}>
            {Object.entries(contributions).map(([categoryId, data]) => (
              <CategoryCard 
                key={categoryId}
                category={categoryId as any} 
                amount={data.total}
                count={data.count}
              />
            ))}
          </View>
        ) : (
          <Card variant="subtle">
            <EmptyState 
              icon="dollar"
              title="No contributions yet"
              subtitle="Add your first expense to see weekly contributions by category"
            />
          </Card>
        )}
        
        <Text style={styles.sectionTitle}>Upcoming Expenses</Text>
        <Card variant="default">
          {hasUpcomingExpenses ? (
            upcomingExpenses.map((expense, index) => (
              <TransactionItem 
                key={expense.id} 
                transaction={expense}
                isLast={index === upcomingExpenses.length - 1}
              />
            ))
          ) : (
            <EmptyState 
              icon="trending"
              title="No upcoming expenses"
              subtitle="You're all caught up for this week!"
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
  incomeCard: {
    marginBottom: Spacing.md,
  },
  incomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeTextContainer: {
    flex: 1,
  },
  incomeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  incomeValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  negativeBalance: {
    color: Colors.error,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
});