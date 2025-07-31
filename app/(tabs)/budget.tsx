import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Target, DollarSign, Edit3, Trash2 } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSavings, SavingsGoal } from '@/context/SavingsContext';
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
import SavingsGoalModal from '@/components/SavingsGoalModal';
import AlertModal from '@/components/AlertModal';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Transaction } from '@/types/finance';

export default function BudgetScreen() {
  const { budget, transactions, isLoading } = useFinance();
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, isLoading: savingsLoading } = useSavings();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);
  const [modalTransactionType, setModalTransactionType] = useState<'income' | 'expense'>('expense');
  const [activeView, setActiveView] = useState<'budget' | 'savings'>('budget');
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [editSavingsGoal, setEditSavingsGoal] = useState<SavingsGoal | undefined>(undefined);
  
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
  
  const handleAddIncome = () => {
    setModalTransactionType('income');
    setShowAddModal(true);
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setModalTransactionType(transaction.type);
    setShowAddModal(true);
  };
  
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditTransaction(undefined);
    setModalTransactionType('expense');
  };
  
  const handleSavingsGoalSave = (goal: SavingsGoal) => {
    if (editSavingsGoal) {
      updateSavingsGoal(goal);
    } else {
      addSavingsGoal(goal);
    }
  };
  
  const handleEditSavingsGoal = (goal: SavingsGoal) => {
    setEditSavingsGoal(goal);
    setShowSavingsModal(true);
  };
  
  const handleDeleteSavingsGoal = (goalId: string) => {
    showAlert({
      title: 'Delete Savings Goal',
      message: 'Are you sure you want to delete this savings goal? This action cannot be undone.',
      type: 'error',
      actions: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: hideAlert,
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSavingsGoal(goalId);
            hideAlert();
          },
        },
      ],
    });
  };
  
  const handleCloseSavingsModal = () => {
    setShowSavingsModal(false);
    setEditSavingsGoal(undefined);
  };
  
  if (isLoading || savingsLoading) {
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
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: activeView === 'budget' ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setActiveView('budget')}
              activeOpacity={0.7}
            >
              <DollarSign 
                size={18} 
                color={activeView === 'budget' ? colors.card : colors.textSecondary} 
                strokeWidth={2}
              />
              <Text style={[
                styles.toggleText,
                { color: activeView === 'budget' ? colors.card : colors.textSecondary }
              ]}>
                Budget
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: activeView === 'savings' ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setActiveView('savings')}
              activeOpacity={0.7}
            >
              <Target 
                size={18} 
                color={activeView === 'savings' ? colors.card : colors.textSecondary} 
                strokeWidth={2}
              />
              <Text style={[
                styles.toggleText,
                { color: activeView === 'savings' ? colors.card : colors.textSecondary }
              ]}>
                Savings
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeView === 'budget' ? (
            <>
              {/* Budget Overview Card */}
              <Card variant="elevated" style={styles.summaryCard}>
                <View style={styles.budgetHeader}>
                  <Text style={[styles.budgetTitle, { color: colors.text }]}>Monthly Budget</Text>
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
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>One-Time Expenses</Text>
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
                  title="Add Expense"
                  onPress={() => {
                    setModalTransactionType('expense');
                    setShowAddModal(true);
                  }}
                  variant="primary"
                  size="medium"
                  style={styles.actionButton}
                />
                <Button
                  title="Add Income"
                  onPress={handleAddIncome}
                  variant="ghost"
                  size="medium"
                  style={styles.actionButton}
                />
              </View>
              
              {/* Income Section */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Income</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setModalTransactionType('income');
                    setShowAddModal(true);
                  }}
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
                  onPress={() => {
                    setModalTransactionType('expense');
                    setShowAddModal(true);
                  }}
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
                  onPress={() => {
                    setModalTransactionType('expense');
                    setShowAddModal(true);
                  }}
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
                  onPress={() => {
                    setModalTransactionType('expense');
                    setShowAddModal(true);
                  }}
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
                  onPress={() => {
                    setModalTransactionType('expense');
                    setShowAddModal(true);
                  }}
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
            </>
          ) : (
            <>
              {/* Savings Goals Section */}
              <View style={styles.savingsHeader}>
                <Text style={[styles.savingsTitle, { color: colors.text }]}>Savings Goals</Text>
                <Button
                  title="New Goal"
                  onPress={() => setShowSavingsModal(true)}
                  variant="primary"
                  size="medium"
                />
              </View>
              
              {savingsGoals.length > 0 ? (
                savingsGoals.map((goal) => {
                  const weeklySavingsRequired = goal.targetAmount / goal.timeframeWeeks;
                  const monthsEquivalent = Math.round((goal.timeframeWeeks / 4.33) * 10) / 10;
                  
                  return (
                    <Card key={goal.id} style={styles.savingsGoalCard}>
                      <View style={styles.goalHeader}>
                        <View style={styles.goalTitleContainer}>
                          <Target size={20} color={colors.primary} strokeWidth={2} />
                          <Text style={[styles.goalTitle, { color: colors.text }]}>
                            {goal.title}
                          </Text>
                        </View>
                        <View style={styles.goalActions}>
                          <TouchableOpacity
                            onPress={() => handleEditSavingsGoal(goal)}
                            style={[styles.goalActionButton, { backgroundColor: colors.background }]}
                            activeOpacity={0.7}
                          >
                            <Edit3 size={16} color={colors.textSecondary} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteSavingsGoal(goal.id)}
                            style={[styles.goalActionButton, { backgroundColor: colors.background }]}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color={colors.error} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.goalDetails}>
                        <View style={styles.goalDetailRow}>
                          <Text style={[styles.goalDetailLabel, { color: colors.textSecondary }]}>Target Amount</Text>
                          <Text style={[styles.goalDetailValue, { color: colors.text }]}>
                            ${goal.targetAmount.toFixed(2)}
                          </Text>
                        </View>
                        
                        <View style={styles.goalDetailRow}>
                          <Text style={[styles.goalDetailLabel, { color: colors.textSecondary }]}>Timeframe</Text>
                          <Text style={[styles.goalDetailValue, { color: colors.text }]}>
                            {goal.timeframeWeeks} weeks (≈ {monthsEquivalent} months)
                          </Text>
                        </View>
                        
                        <View style={[styles.goalDetailRow, styles.weeklyRequiredRow]}>
                          <Text style={[styles.goalDetailLabel, { color: colors.textSecondary }]}>Weekly Required</Text>
                          <Text style={[styles.weeklyRequiredValue, { color: colors.primary }]}>
                            ${weeklySavingsRequired.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })
              ) : (
                <Card style={styles.emptySavingsCard}>
                  <EmptyState 
                    icon="plus"
                    title="No savings goals yet"
                    subtitle="Create your first savings goal to start planning for the future"
                  />
                </Card>
              )}
            </>
          )}
        </ScrollView>
        
        <AddTransactionModal 
          visible={showAddModal}
          onClose={handleCloseModal}
          editTransaction={editTransaction}
          initialTransactionType={modalTransactionType}
        />
        
        <SavingsGoalModal
          visible={showSavingsModal}
          onClose={handleCloseSavingsModal}
          onSave={handleSavingsGoalSave}
          editGoal={editSavingsGoal}
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
  summaryCard: {
    marginBottom: Spacing.md,
  },
  budgetHeader: {
    marginBottom: Spacing.lg,
  },

  budgetTitle: {
    fontSize: 20, // Balanced header font
    fontWeight: '600', // Bold
    letterSpacing: -0.2,
    lineHeight: 24,
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
    fontSize: 14, // Standard subheader font
    marginBottom: Spacing.sm,
    fontWeight: '500', // Medium gray
    lineHeight: 18,
  },
  summaryValue: {
    fontSize: 16, // Balanced currency display
    fontWeight: '600', // Medium weight
    letterSpacing: -0.2,
    textAlign: 'left', // Left-aligned to match labels
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  remainingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  remainingLabel: {
    fontSize: 14, // Standard subheader font
    marginBottom: Spacing.sm,
    fontWeight: '500', // Medium gray
    lineHeight: 18,
  },
  remainingValue: {
    fontSize: 24, // Balanced large display
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  breakdownContainer: {
    borderRadius: BorderRadius.lg,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
    paddingVertical: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: 15, // Balanced body label font
    fontWeight: '400', // Regular weight
    lineHeight: 20,
    flexShrink: 1,
  },
  breakdownValue: {
    fontSize: 15, // Balanced body label font
    fontWeight: '600', // Medium weight
    textAlign: 'right', // Right-aligned
    lineHeight: 20,
    flexShrink: 0,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: Spacing.cardMargin,
  },
  actionButton: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18, // Balanced section header font
    fontWeight: '600', // Bold
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  addButton: {
    width: Math.max(40, Spacing.minTouchTarget),
    height: Math.max(40, Spacing.minTouchTarget),
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.light,
  },
  
  // View Toggle Styles
  viewToggle: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  
  // Savings View Styles
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  savingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  savingsGoalCard: {
    marginBottom: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 22,
    flex: 1,
  },
  goalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  goalActionButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalDetails: {
    gap: Spacing.md,
  },
  goalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  goalDetailLabel: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  goalDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'right',
  },
  weeklyRequiredRow: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: Spacing.sm,
  },
  weeklyRequiredValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  emptySavingsCard: {
    marginTop: Spacing.xl,
  },
});