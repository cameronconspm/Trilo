import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Edit3, Target, Trash2 } from 'lucide-react-native';
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
import { Transaction, SavingsGoal } from '@/types/finance';

export default function BudgetScreen() {
  const { budget, transactions, isLoading } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'budget' | 'savings'>('budget');
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | undefined>(undefined);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalTimeToSave, setNewGoalTimeToSave] = useState(6);
  
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

  const handleAddGoal = () => {
    if (!newGoalName.trim() || !newGoalAmount.trim()) {
      showAlert({
        title: 'Missing Information',
        message: 'Please enter both goal name and target amount.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const targetAmount = parseFloat(newGoalAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      showAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid target amount.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const newGoal: SavingsGoal = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newGoalName.trim(),
      targetAmount,
      currentAmount: 0,
      timeToSave: newGoalTimeToSave,
      createdDate: new Date().toISOString(),
    };

    setSavingsGoals(prev => [...prev, newGoal]);
    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalTimeToSave(6);
    setShowAddGoalModal(false);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditGoal(goal);
    setNewGoalName(goal.name);
    setNewGoalAmount(goal.targetAmount.toString());
    setNewGoalTimeToSave(goal.timeToSave);
    setShowAddGoalModal(true);
  };

  const handleUpdateGoal = () => {
    if (!editGoal || !newGoalName.trim() || !newGoalAmount.trim()) return;

    const targetAmount = parseFloat(newGoalAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) return;

    setSavingsGoals(prev => prev.map(goal => 
      goal.id === editGoal.id 
        ? { ...goal, name: newGoalName.trim(), targetAmount, timeToSave: newGoalTimeToSave }
        : goal
    ));
    
    setEditGoal(undefined);
    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalTimeToSave(6);
    setShowAddGoalModal(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    showAlert({
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this savings goal?',
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {} },
        { 
          text: 'Delete', 
          onPress: () => setSavingsGoals(prev => prev.filter(goal => goal.id !== goalId)),
          style: 'destructive'
        }
      ],
    });
  };

  const handleAddToSavings = (goalId: string) => {
    showAlert({
      title: 'Add to Savings',
      message: 'This would open a modal to add money to this specific savings goal.',
      type: 'info',
      actions: [{ text: 'OK', onPress: () => {} }],
    });
  };

  const handleCloseGoalModal = () => {
    setShowAddGoalModal(false);
    setEditGoal(undefined);
    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalTimeToSave(6);
  };

  // Calculate savings summary
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const monthlySavingsTarget = savingsGoals.reduce((sum, goal) => {
    const monthlyAmount = goal.targetAmount / goal.timeToSave;
    return sum + monthlyAmount;
  }, 0);
  const remainingSavingsToReachGoals = totalSavingsTarget - totalSaved;
  
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
        
        {/* Tab Switcher */}
        <View style={[styles.tabSwitcher, { backgroundColor: colors.cardSecondary }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'budget' && { backgroundColor: colors.card },
              activeTab === 'budget' && styles.activeTab
            ]}
            onPress={() => setActiveTab('budget')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'budget' ? colors.text : colors.textSecondary }
            ]}>
              Budget
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'savings' && { backgroundColor: colors.card },
              activeTab === 'savings' && styles.activeTab
            ]}
            onPress={() => setActiveTab('savings')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'savings' ? colors.text : colors.textSecondary }
            ]}>
              Savings
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        >
          {activeTab === 'budget' ? (
            <>
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
                
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryGridItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Monthly Income</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      ${budget.income > 0 ? budget.income.toFixed(2) : '0.00'}
                    </Text>
                  </View>
                  <View style={styles.summaryGridItem}>
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
                
                <View style={styles.remainingBudgetSection}>
                  <View style={styles.remainingBudgetRow}>
                    <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>Remaining Budget</Text>
                    <Text style={[
                      styles.remainingValue,
                      { color: remainingIncome < 0 ? colors.error : colors.success }
                    ]}>
                      ${remainingIncome.toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.breakdownSection}>
                  <Text style={[styles.breakdownTitle, { color: colors.text }]}>Expense Breakdown</Text>
                  <View style={styles.breakdownList}>
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
                </View>
              </Card>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <Button
                  title="Add Expense"
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
            </>
          ) : (
            <>
              {/* Savings Summary Card */}
              <Card variant="elevated" style={styles.summaryCard}>
                <View style={styles.budgetHeader}>
                  <Text style={[styles.budgetTitle, { color: colors.text }]}>Savings Summary</Text>
                </View>
                
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryGridItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Saved</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                      ${totalSaved.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryGridItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Monthly Target</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      ${monthlySavingsTarget.toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.remainingBudgetSection}>
                  <View style={styles.remainingBudgetRow}>
                    <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>Remaining to Goals</Text>
                    <Text style={[styles.remainingValue, { color: colors.primary }]}>
                      ${remainingSavingsToReachGoals.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Savings Goals Section */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Savings Goals</Text>
                <TouchableOpacity 
                  onPress={() => setShowAddGoalModal(true)}
                  style={[styles.addButton, { backgroundColor: colors.card }]}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {savingsGoals.length > 0 ? (
                savingsGoals.map((goal, index) => {
                  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  const monthlyAmount = goal.targetAmount / goal.timeToSave;
                  
                  return (
                    <Card key={goal.id} style={index < savingsGoals.length - 1 ? styles.goalCard : undefined}>
                      <View style={styles.goalHeader}>
                        <View style={styles.goalTitleContainer}>
                          <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.name}</Text>
                          <View style={styles.goalActions}>
                            <TouchableOpacity 
                              onPress={() => handleEditGoal(goal)}
                              style={[styles.goalActionButton, { backgroundColor: colors.cardSecondary }]}
                              activeOpacity={0.7}
                            >
                              <Edit3 size={14} color={colors.primary} strokeWidth={2} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleDeleteGoal(goal.id)}
                              style={[styles.goalActionButton, { backgroundColor: colors.cardSecondary }]}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={14} color={colors.error} strokeWidth={2} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.goalAmounts}>
                        <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                          ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                        </Text>
                        <Text style={[styles.goalMonthly, { color: colors.primary }]}>
                          ${monthlyAmount.toFixed(2)}/month
                        </Text>
                      </View>
                      
                      <View style={styles.progressContainer}>
                        <ProgressBar
                          progress={progress}
                          color={colors.success}
                          showPercentage
                        />
                      </View>
                      
                      <View style={styles.goalFooter}>
                        <Text style={[styles.goalTimeframe, { color: colors.textSecondary }]}>
                          {goal.timeToSave} month{goal.timeToSave !== 1 ? 's' : ''} to save
                        </Text>
                        <Button
                          title="Add to Savings"
                          onPress={() => handleAddToSavings(goal.id)}
                          variant="ghost"
                          size="small"
                        />
                      </View>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <EmptyState 
                    icon="plus"
                    title="No savings goals"
                    subtitle="Create your first savings goal to start building your future"
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
        />

        {/* Add/Edit Goal Modal */}
        <Modal
          visible={showAddGoalModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseGoalModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editGoal ? 'Edit Goal' : 'Add Savings Goal'}
                </Text>
                <TouchableOpacity onPress={handleCloseGoalModal} activeOpacity={0.7}>
                  <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Goal Name</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colors.cardSecondary, 
                      color: colors.text,
                      borderColor: colors.border 
                    }]}
                    value={newGoalName}
                    onChangeText={setNewGoalName}
                    placeholder="e.g., Emergency Fund, Vacation"
                    placeholderTextColor={colors.inactive}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Amount</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colors.cardSecondary, 
                      color: colors.text,
                      borderColor: colors.border 
                    }]}
                    value={newGoalAmount}
                    onChangeText={setNewGoalAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.inactive}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Time to Save: {newGoalTimeToSave} month{newGoalTimeToSave !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.sliderContainer}>
                    <View style={styles.sliderButtons}>
                      {[1, 3, 6, 9, 12].map((months) => (
                        <TouchableOpacity
                          key={months}
                          style={[
                            styles.sliderButton,
                            { 
                              backgroundColor: newGoalTimeToSave === months ? colors.primary : colors.cardSecondary,
                              borderColor: colors.border
                            }
                          ]}
                          onPress={() => setNewGoalTimeToSave(months)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.sliderButtonText,
                            { color: newGoalTimeToSave === months ? colors.background : colors.text }
                          ]}>
                            {months}m
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {newGoalAmount && !isNaN(parseFloat(newGoalAmount)) && (
                    <Text style={[styles.monthlyPreview, { color: colors.primary }]}>
                      Monthly: ${(parseFloat(newGoalAmount) / newGoalTimeToSave).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  title={editGoal ? 'Update Goal' : 'Add Goal'}
                  onPress={editGoal ? handleUpdateGoal : handleAddGoal}
                  variant="primary"
                  size="medium"
                  style={styles.modalActionButton}
                />
              </View>
            </View>
          </View>
        </Modal>
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
    borderRadius: BorderRadius.xl, // Increased border radius for modern look
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
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  editButton: {
    width: Math.max(32, Spacing.minTouchTarget),
    height: Math.max(32, Spacing.minTouchTarget),
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg, // Reduced from xl to lg for tighter spacing
    gap: Spacing.md, // Add gap between grid items
  },
  summaryGridItem: {
    flex: 1,
    alignItems: 'flex-start', // Ensure left alignment
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs, // Reduced from sm to xs for tighter spacing
    fontWeight: '500',
    lineHeight: 18,
  },
  summaryValue: {
    fontSize: 18, // Slightly increased for better hierarchy
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: Spacing.lg, // Reduced from xl to lg
  },
  remainingBudgetSection: {
    marginBottom: Spacing.xl, // Increased spacing before breakdown section
    paddingVertical: Spacing.sm,
  },
  remainingBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: 15, // Slightly increased for consistency
    fontWeight: '500',
    lineHeight: 20,
  },
  remainingValue: {
    fontSize: 20, // Reduced from 24 for better balance
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  breakdownSection: {
    paddingTop: Spacing.md, // Add top padding for separation
  },
  breakdownTitle: {
    fontSize: 18, // Increased to match section titles
    fontWeight: '600',
    marginBottom: Spacing.md, // Increased spacing after title
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  breakdownList: {
    gap: Spacing.xs, // Add consistent gap between breakdown items
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36, // Reduced from 44px for tighter layout
    paddingVertical: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    flexShrink: 1,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 20,
    flexShrink: 0,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: Spacing.sectionSpacing, // Equal margin above buttons
    gap: Spacing.cardMargin, // 16px gap between buttons
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
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screenHorizontal,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    ...Shadow.light,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  goalCard: {
    marginBottom: Spacing.md,
  },
  goalHeader: {
    marginBottom: Spacing.sm,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  goalActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  goalActionButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalAmount: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  goalMonthly: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  goalTimeframe: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  modalContent: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    lineHeight: 20,
  },
  sliderContainer: {
    marginTop: Spacing.xs,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  sliderButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  monthlyPreview: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalActionButton: {
    flex: 1,
  },
});