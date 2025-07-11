import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Edit3, Target } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import { useAlert } from '@/hooks/useAlert';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import AddTransactionModal from '@/components/AddTransactionModal';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Transaction } from '@/types/finance';

export default function BudgetScreen() {
  const { budget, transactions, isLoading } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);
  
  // Get current month transactions
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const incomeTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.type === 'income' && 
           transactionDate >= startOfMonth && 
           transactionDate <= endOfMonth;
  });
  
  const givenExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    !t.isRecurring && 
    t.category === 'given_expenses'
  );
  
  const savingsTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    t.category === 'savings'
  );
  
  const oneTimeExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    !t.isRecurring && 
    t.category === 'one_time_expense'
  );
  
  const recurringExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    t.isRecurring
  );

  const totalExpenses = budget.expenses.given + budget.expenses.oneTime + budget.expenses.recurring + budget.expenses.savings;
  const remainingIncome = budget.income - totalExpenses;
  const budgetUtilization = budget.income > 0 ? (totalExpenses / budget.income) * 100 : 0;
  
  const handleSetBudgetGoal = () => {
    showAlert({
      title: 'Set Budget Goal',
      message: 'Budget goal setting would open here with input fields for monthly income and savings targets.',
      type: 'info',
      actions: [{ text: 'OK', onPress: () => {} }],
    });
  };
  
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
          title="Budget"
          subtitle="Monthly planning"
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
          title="Budget"
          subtitle="Monthly planning"
          showAddButton
        />
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        >
          {/* Budget Overview Card */}
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetTitleContainer}>
                <Text style={[styles.budgetTitle, { color: colors.text }]}>Monthly Budget</Text>
                <TouchableOpacity 
                  onPress={handleSetBudgetGoal}
                  style={[styles.editButton, { backgroundColor: colors.cardSecondary }]}
                  activeOpacity={0.7}
                >
                  <Edit3 size={16} color={colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Monthly Income</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ${budget.income > 0 ? budget.income.toFixed(2) : '0.00'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ${totalExpenses.toFixed(2)}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={budgetUtilization}
                color={budgetUtilization > 90 ? colors.error : budgetUtilization > 75 ? colors.warning : colors.success}
                label="Budget Utilization"
                showPercentage
              />
            </View>
            
            <View style={styles.remainingContainer}>
              <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>Remaining Budget</Text>
              <Text style={[
                styles.remainingValue,
                { color: remainingIncome < 0 ? colors.error : colors.success }
              ]}>
                ${remainingIncome.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.breakdownContainer}>
              <Text style={[styles.breakdownTitle, { color: colors.text }]}>Expense Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Given expenses</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>${budget.expenses.given.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>One-time expenses</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>${budget.expenses.oneTime.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Recurring expenses</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>${budget.expenses.recurring.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Savings</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>${budget.expenses.savings.toFixed(2)}</Text>
              </View>
            </View>
          </Card>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Button
              title="Add Transaction"
              onPress={() => setShowAddModal(true)}
              variant="primary"
              size="medium"
              style={styles.actionButton}
            />
            <Button
              title="Set Goals"
              onPress={handleSetBudgetGoal}
              variant="ghost"
              size="medium"
              style={styles.actionButton}
            />
          </View>
          
          {/* Income Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Income</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={[styles.addButton, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Card>
            {incomeTransactions.length > 0 ? (
              incomeTransactions.map((income, index) => (
                <TransactionItem 
                  key={income.id} 
                  transaction={income}
                  isLast={index === incomeTransactions.length - 1}
                  onEdit={handleEditTransaction}
                  enableSwipeActions={true}
                />
              ))
            ) : (
              <EmptyState 
                icon="dollar"
                title="No income this month"
                subtitle="Add your salary, freelance work, or other income sources"
              />
            )}
          </Card>
          
          {/* Given Expenses Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Given Expenses</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={[styles.addButton, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Card>
            {givenExpenses.length > 0 ? (
              givenExpenses.map((expense, index) => (
                <TransactionItem 
                  key={expense.id} 
                  transaction={expense}
                  isLast={index === givenExpenses.length - 1}
                  onEdit={handleEditTransaction}
                  enableSwipeActions={true}
                />
              ))
            ) : (
              <EmptyState 
                icon="dollar"
                title="No given expenses"
                subtitle="Add essential expenses like bills, debt payments, and subscriptions"
              />
            )}
          </Card>
          
          {/* Savings Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Savings</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={[styles.addButton, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Card>
            {savingsTransactions.length > 0 ? (
              savingsTransactions.map((saving, index) => (
                <TransactionItem 
                  key={saving.id} 
                  transaction={saving}
                  isLast={index === savingsTransactions.length - 1}
                  onEdit={handleEditTransaction}
                  enableSwipeActions={true}
                />
              ))
            ) : (
              <EmptyState 
                icon="dollar"
                title="No savings"
                subtitle="Add your savings goals and contributions"
              />
            )}
          </Card>
          
          {/* Recurring Expenses Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recurring Expenses</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={[styles.addButton, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Card>
            {recurringExpenses.length > 0 ? (
              recurringExpenses.map((expense, index) => (
                <TransactionItem 
                  key={expense.id} 
                  transaction={expense}
                  isLast={index === recurringExpenses.length - 1}
                  onEdit={handleEditTransaction}
                  enableSwipeActions={true}
                />
              ))
            ) : (
              <EmptyState 
                icon="trending"
                title="No recurring expenses"
                subtitle="Add monthly subscriptions, bills, and regular payments"
              />
            )}
          </Card>
          
          {/* One-Time Expenses Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>One-Time Expenses</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={[styles.addButton, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Card>
            {oneTimeExpenses.length > 0 ? (
              oneTimeExpenses.map((expense, index) => (
                <TransactionItem 
                  key={expense.id} 
                  transaction={expense}
                  isLast={index === oneTimeExpenses.length - 1}
                  onEdit={handleEditTransaction}
                  enableSwipeActions={true}
                />
              ))
            ) : (
              <EmptyState 
                icon="plus"
                title="No one-time expenses"
                subtitle="Track occasional purchases and unexpected costs"
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
      
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        actions={alertState.actions}
        onClose={hideAlert}
      />
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
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  budgetHeader: {
    marginBottom: Spacing.lg,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  editButton: {
    width: Math.max(32, Spacing.minTouchTarget),
    height: Math.max(32, Spacing.minTouchTarget),
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 15,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  remainingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  remainingLabel: {
    fontSize: 15,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  remainingValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  breakdownContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  addButton: {
    width: Math.max(40, Spacing.minTouchTarget),
    height: Math.max(40, Spacing.minTouchTarget),
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.light,
  },
});