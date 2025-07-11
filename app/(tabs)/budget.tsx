import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Edit3, Target } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useAlert } from '@/hooks/useAlert';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import AddTransactionModal from '@/components/AddTransactionModal';
import AlertModal from '@/components/AlertModal';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Transaction } from '@/types/finance';

export default function BudgetScreen() {
  const { budget, transactions, isLoading } = useFinance();
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
    t.category !== 'one_time_expense'
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

  const totalExpenses = budget.expenses.given + budget.expenses.oneTime + budget.expenses.recurring;
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
      <View style={styles.container}>
        <Header 
          title="Budget"
          subtitle="Monthly planning"
          showAddButton
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <>
      <View style={styles.container}>
        <Header 
          title="Budget"
          subtitle="Monthly planning"
          showAddButton
        />
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Budget Overview Card */}
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetTitleContainer}>
                <Text style={styles.budgetTitle}>Monthly Budget</Text>
                <TouchableOpacity 
                  onPress={handleSetBudgetGoal}
                  style={styles.editButton}
                  activeOpacity={0.7}
                >
                  <Edit3 size={16} color={Colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Monthly Income</Text>
                <Text style={styles.summaryValue}>
                  ${budget.income > 0 ? budget.income.toFixed(2) : '0.00'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={styles.summaryValue}>
                  ${totalExpenses.toFixed(2)}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={budgetUtilization}
                color={budgetUtilization > 90 ? Colors.error : budgetUtilization > 75 ? Colors.warning : Colors.success}
                label="Budget Utilization"
                showPercentage
              />
            </View>
            
            <View style={styles.remainingContainer}>
              <Text style={styles.remainingLabel}>Remaining Budget</Text>
              <Text style={[
                styles.remainingValue,
                remainingIncome < 0 && styles.negativeValue
              ]}>
                ${remainingIncome.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Expense Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Given expenses</Text>
                <Text style={styles.breakdownValue}>${budget.expenses.given.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>One-time expenses</Text>
                <Text style={styles.breakdownValue}>${budget.expenses.oneTime.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Recurring expenses</Text>
                <Text style={styles.breakdownValue}>${budget.expenses.recurring.toFixed(2)}</Text>
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
            <Text style={styles.sectionTitle}>Income</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
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
            <Text style={styles.sectionTitle}>Given Expenses</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
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
          
          {/* Recurring Expenses Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recurring Expenses</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
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
            <Text style={styles.sectionTitle}>One-Time Expenses</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
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
      </View>
      
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
    color: Colors.text,
    letterSpacing: -0.3,
  },
  editButton: {
    width: Math.max(32, Spacing.minTouchTarget),
    height: Math.max(32, Spacing.minTouchTarget),
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardSecondary,
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
  },
  remainingLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  remainingValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: Colors.success,
  },
  negativeValue: {
    color: Colors.error,
  },
  breakdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
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
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.light,
  },
});