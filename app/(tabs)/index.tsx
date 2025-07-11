import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import Header from '@/components/Header';
import Card from '@/components/Card';
import CircularProgress from '@/components/CircularProgress';
import CategoryCard from '@/components/CategoryCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import AddTransactionModal from '@/components/AddTransactionModal';
import { Spacing } from '@/constants/spacing';
import { Transaction } from '@/types/finance';

export default function OverviewScreen() {
  const { weeklyOverview, isLoading } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);
  const { weekIncome, remainingBalance, utilization, contributions, upcomingExpenses, currentPayPeriod } = weeklyOverview;
  
  // Get current month and year
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  
  const hasContributions = Object.keys(contributions).length > 0;
  const hasUpcomingExpenses = upcomingExpenses.length > 0;
  
  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowAddModal(true);
  };
  
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditTransaction(undefined);
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title={`${month} ${year}`}
          subtitle={currentPayPeriod || 'No pay period'}
          showAddButton
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.inactive }]}>Loading...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`${month} ${year}`}
        subtitle={currentPayPeriod || 'No pay period'}
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
              <Text style={[styles.incomeLabel, { color: colors.textSecondary }]}>Pay period income</Text>
              <Text style={[styles.incomeValue, { color: colors.text }]}>
                ${weekIncome > 0 ? weekIncome.toFixed(2) : '0.00'}
              </Text>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Remaining balance</Text>
              <Text style={[
                styles.balanceValue,
                { color: colors.text },
                remainingBalance < 0 && { color: colors.error }
              ]}>
                ${remainingBalance.toFixed(2)}
              </Text>
            </View>
            <CircularProgress 
              percentage={utilization} 
              size={100} 
              color={utilization > 90 ? colors.warning : colors.primary}
            />
          </View>
        </Card>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pay Period Contributions</Text>
        <View style={styles.categoryGrid}>
          {(['bill', 'subscription', 'debt', 'savings'] as const).map((categoryId) => {
            const data = contributions[categoryId] || { total: 0, count: 0 };
            return (
              <CategoryCard 
                key={categoryId}
                category={categoryId} 
                amount={data.total}
                count={data.count}
              />
            );
          })}
        </View>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Expenses</Text>
        <Card variant="default">
          {hasUpcomingExpenses ? (
            upcomingExpenses.map((expense, index) => (
              <TransactionItem 
                key={expense.id} 
                transaction={expense}
                isLast={index === upcomingExpenses.length - 1}
                onEdit={handleEditTransaction}
                enableSwipeActions={true}
              />
            ))
          ) : (
            <EmptyState 
              icon="trending"
              title="No upcoming expenses"
              subtitle="You're all caught up for this pay period!"
            />
          )}
        </Card>
      </ScrollView>
      
      <AddTransactionModal 
        visible={showAddModal}
        onClose={handleCloseModal}
        editTransaction={editTransaction}
      />
    </View>
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
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
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