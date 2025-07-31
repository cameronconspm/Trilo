import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
  const { weekIncome, remainingBalance, utilization, contributions, upcomingExpenses, pastExpenses, currentPayPeriod } = weeklyOverview;
  
  // Get current month and year
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  
  const hasContributions = Object.keys(contributions).length > 0;
  const hasUpcomingExpenses = upcomingExpenses.length > 0;
  const hasPastExpenses = pastExpenses.length > 0;
  
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
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Header 
          title={`${month} ${year}`}
          subtitle={currentPayPeriod || 'No pay period'}
          showAddButton
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
        title={`${month} ${year}`}
        subtitle={currentPayPeriod || 'No pay period'}
        showAddButton
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
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
          {(['bill', 'subscription', 'debt', 'savings', 'given_expenses', 'one_time_expense'] as const).map((categoryId) => {
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
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Past Expenses</Text>
        <Card variant="default">
          {hasPastExpenses ? (
            pastExpenses.map((expense, index) => (
              <TransactionItem 
                key={expense.id} 
                transaction={expense}
                isLast={index === pastExpenses.length - 1}
                onEdit={handleEditTransaction}
                enableSwipeActions={true}
              />
            ))
          ) : (
            <EmptyState 
              icon="history"
              title="No past expenses"
              subtitle="No expenses recorded for this pay period yet."
            />
          )}
        </Card>
      </ScrollView>
      
      <AddTransactionModal 
        visible={showAddModal}
        onClose={handleCloseModal}
        editTransaction={editTransaction}
      />
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
    paddingTop: Spacing.cardMargin, // 16px padding between header and first card
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
    minHeight: 120, // Equal height for all cards
  },
  incomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 120, // Consistent card height
  },
  incomeTextContainer: {
    flex: 1,
  },
  incomeLabel: {
    fontSize: 14, // Standard subheader font
    marginBottom: Spacing.xs,
    fontWeight: '500', // Medium gray
    lineHeight: 18,
  },
  incomeValue: {
    fontSize: 28, // Balanced large currency display
    fontWeight: '700',
    marginBottom: Spacing.lg,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
    fontWeight: '500',
    lineHeight: 18,
  },
  balanceValue: {
    fontSize: 20, // Balanced medium currency display
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20, // Balanced header font
    fontWeight: '600', // Bold
    marginTop: Spacing.sectionSpacing, // 24px between sections
    marginBottom: Spacing.lg, // 16px before cards
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, // Optimized gap for 3-column layout
    justifyContent: 'space-between',
  },
});