import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import { Spacing } from '@/constants/spacing';
import Header from '@/components/layout/Header';
import Card from '@/components/layout/Card';
import CircularProgress from '@/components/feedback/CircularProgress';
import CategoryCard from '@/components/CategoryCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/feedback/EmptyState';
import AddTransactionModal from '@/components/modals/AddTransactionModal';
import { ReminderManagementModal } from '@/components/modals';
import { Transaction } from '@/types/finance';
import { SubscriptionBanner } from '@/components';

export default function OverviewScreen() {
  const { weeklyOverview, isLoading } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { spacing, typography } = useResponsiveDesign();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);
  const { weekIncome, remainingBalance, utilization, contributions, upcomingExpenses, pastExpenses, currentPayPeriod } = weeklyOverview;

  // Get current month and year
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  
  const hasContributions = Object.keys(contributions).length > 0;
  const hasUpcomingExpenses = upcomingExpenses.length > 0;
  const hasPastExpenses = pastExpenses.length > 0;
  
  // Calculate total for upcoming expenses
  const upcomingExpensesTotal = upcomingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate total for past expenses
  const pastExpensesTotal = pastExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate total for expense breakdown (all expenses within pay period)
  const expenseBreakdownTotal = Object.values(contributions).reduce((sum, category) => sum + category.total, 0);
  
  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowAddModal(true);
  };
  
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditTransaction(undefined);
  };

  // Styles with responsive values
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400',
    },
    reminderButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    loadingText: {
      ...typography.bodyMedium,
    },
    incomeCard: {
      minHeight: 120,
    },
    incomeContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      minHeight: 120,
    },
    incomeTextContainer: {
      flex: 1,
    },
    incomeLabel: {
      ...typography.label,
      marginBottom: 4, // Using fixed value to maintain exact appearance
    },
    incomeValue: {
      ...typography.currency,
      marginBottom: 16, // Using fixed value to maintain exact appearance
    },
    balanceLabel: {
      ...typography.label,
      marginBottom: 4, // Using fixed value to maintain exact appearance
    },
    balanceValue: {
      ...typography.currencyMedium,
    },
    sectionTitle: {
      ...typography.h2,
      marginTop: spacing.sectionSpacing,
      marginBottom: 16, // Using fixed value to maintain exact appearance
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginTop: spacing.sectionSpacing,
      marginBottom: 16,
    },
    sectionTitleInHeader: {
      ...typography.h2,
      textAlign: 'left' as const,
      flex: 1,
    },
    expensesTotal: {
      ...typography.bodyMedium,
      fontWeight: '600' as const,
      textAlign: 'right' as const,
    },
    categoryGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: Spacing.lg, // 16px horizontal spacing between cards
      justifyContent: 'space-between' as const,
      marginBottom: spacing.sectionSpacing,
    },
  });
  
  if (isLoading) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView 
            style={[styles.scrollView, { backgroundColor: colors.background }]} 
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>Overview</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {currentPayPeriod || 'No pay period set'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => setShowReminderModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={20} color={colors.primary} />
            </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.inactive }]}>Loading...</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }
  
  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>Overview</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {currentPayPeriod || 'No pay period set'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => setShowReminderModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Subscription Banner */}
          <SubscriptionBanner />
          
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
          
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleInHeader, { color: colors.text }]}>Expense Breakdown</Text>
            <Text style={[styles.expensesTotal, { color: colors.textSecondary }]}>
              Total: ${expenseBreakdownTotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.categoryGrid}>
            {(['bill', 'subscription', 'debt', 'savings', 'given_expenses', 'one_time_expense'] as const).map(
              (categoryId) => {
                const data = contributions[categoryId] || { total: 0, count: 0 };
                return (
                  <CategoryCard 
                    key={categoryId}
                    category={categoryId} 
                    amount={data.total}
                    count={data.count}
                  />
                );
              }
            )}
          </View>
          
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleInHeader, { color: colors.text }]}>Upcoming Expenses</Text>
            <Text style={[styles.expensesTotal, { color: colors.textSecondary }]}>
              Total: ${upcomingExpensesTotal.toFixed(2)}
            </Text>
          </View>
          <Card variant="default">
            {hasUpcomingExpenses ? (
              upcomingExpenses.map((expense, index) => (
                <TransactionItem 
                  key={expense.id} 
                  transaction={expense}
                  isLast={index === upcomingExpenses.length - 1}
                  onEdit={handleEditTransaction}
                  enableSwipeActions={true}
                  enableLeftSwipe={true}
                  dateFormat="overview"
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

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleInHeader, { color: colors.text }]}>Past Expenses</Text>
            <Text style={[styles.expensesTotal, { color: colors.textSecondary }]}>
              Total: ${pastExpensesTotal.toFixed(2)}
            </Text>
          </View>
          <Card variant="default">
            {hasPastExpenses ? (
              pastExpenses.map((expense, index) => (
                <TransactionItem 
                  key={expense.id} 
                  transaction={expense}
                  isLast={index === pastExpenses.length - 1}
                  onEdit={handleEditTransaction}
                  enableSwipeActions={true}
                  enableLeftSwipe={true}
                  dateFormat="overview"
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

        <ReminderManagementModal
          visible={showReminderModal}
          onClose={() => setShowReminderModal(false)}
        />
      </SafeAreaView>
    </>
  );
}
