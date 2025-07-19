import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Edit3, Target, Trash2, ChevronDown, DollarSign, Repeat } from 'lucide-react-native';
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
import DatePicker from '@/components/DatePicker';
import PieChart from '@/components/PieChart';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Transaction, SavingsGoal, SavingsContribution } from '@/types/finance';

// Define spending categories for the budget view
const SPENDING_CATEGORIES = [
  { id: 'shopping', name: 'Shopping', color: '#FF6B6B' },
  { id: 'food_drinks', name: 'Food & Drinks', color: '#4ECDC4' },
  { id: 'services', name: 'Services', color: '#45B7D1' },
  { id: 'transportation', name: 'Transportation', color: '#96CEB4' },
  { id: 'entertainment', name: 'Entertainment', color: '#FFEAA7' },
  { id: 'other', name: 'Other', color: '#DDA0DD' },
] as const;

export default function BudgetScreen() {
  const { budget, transactions, isLoading, addTransaction } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'budget' | 'savings'>('budget');
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // Load savings goals from storage
  useEffect(() => {
    loadSavingsGoals();
  }, []);

  // Save savings goals when they change
  useEffect(() => {
    if (savingsGoals.length >= 0) {
      saveSavingsGoals();
    }
  }, [savingsGoals]);

  const loadSavingsGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem('savings_goals_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Ensure all goals have contributions array
          const goalsWithContributions = parsed.map(goal => ({
            ...goal,
            contributions: goal.contributions || []
          }));
          setSavingsGoals(goalsWithContributions);
        }
      }
    } catch (error) {
      console.error('Error loading savings goals:', error);
    }
  };

  const saveSavingsGoals = async () => {
    try {
      await AsyncStorage.setItem('savings_goals_v1', JSON.stringify(savingsGoals));
    } catch (error) {
      console.error('Error saving savings goals:', error);
    }
  };
  const [editGoal, setEditGoal] = useState<SavingsGoal | undefined>(undefined);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalTimeToSave, setNewGoalTimeToSave] = useState(6);
  
  // Add to Savings Modal State
  const [showAddToSavingsModal, setShowAddToSavingsModal] = useState(false);
  const [selectedGoalForSavings, setSelectedGoalForSavings] = useState<SavingsGoal | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsDate, setSavingsDate] = useState(new Date());
  const [fundingSource, setFundingSource] = useState<'budget' | 'extra_income' | 'unused_funds'>('budget');
  const [repeatEveryPayPeriod, setRepeatEveryPayPeriod] = useState(false);
  const [payPeriodDay, setPayPeriodDay] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'>('friday');
  
  // Goal Details Modal State
  const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
  const [selectedGoalForDetails, setSelectedGoalForDetails] = useState<SavingsGoal | null>(null);
  
  // Edit Contribution Modal State
  const [showEditContributionModal, setShowEditContributionModal] = useState(false);
  const [editingContribution, setEditingContribution] = useState<SavingsContribution | null>(null);
  const [editContributionAmount, setEditContributionAmount] = useState('');
  const [editContributionDate, setEditContributionDate] = useState(new Date());
  
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
  
  // Remove savings transactions from budget view since they're now in savings contribution history
  const savingsTransactions: Transaction[] = [];
  
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

  // Calculate spending by category for current month
  const spendingByCategory = useMemo(() => {
    const today = new Date();
    const currentMonthTransactions = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === today.getMonth() && 
             transactionDate.getFullYear() === today.getFullYear();
    });

    // Map existing categories to spending categories
    const categoryMapping: Record<string, string> = {
      'bill': 'services',
      'subscription': 'services', 
      'debt': 'other',
      'one_time_expense': 'shopping',
      'given_expenses': 'other',
      'savings': 'other',
    };

    const spending: Record<string, number> = {};
    SPENDING_CATEGORIES.forEach(cat => {
      spending[cat.id] = 0;
    });

    currentMonthTransactions.forEach(transaction => {
      const mappedCategory = categoryMapping[transaction.category] || 'other';
      spending[mappedCategory] += transaction.amount;
    });

    return spending;
  }, [transactions]);

  // Calculate total spent and most spent category
  const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
  const mostSpentCategory = SPENDING_CATEGORIES.reduce((max, category) => {
    return spendingByCategory[category.id] > spendingByCategory[max.id] ? category : max;
  }, SPENDING_CATEGORIES[0]);

  // Prepare pie chart data
  const pieChartData = SPENDING_CATEGORIES
    .map(category => ({
      value: spendingByCategory[category.id],
      color: category.color,
      label: category.name,
    }))
    .filter(item => item.value > 0);
  
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
      contributions: [],
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
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoalForSavings(goal);
      setSavingsAmount('');
      setSavingsDate(new Date());
      setFundingSource('budget');
      setRepeatEveryPayPeriod(false);
      setPayPeriodDay('friday');
      setShowAddToSavingsModal(true);
    }
  };

  const handleCloseGoalModal = () => {
    setShowAddGoalModal(false);
    setEditGoal(undefined);
    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalTimeToSave(6);
  };

  const handleCloseSavingsModal = () => {
    setShowAddToSavingsModal(false);
    setSelectedGoalForSavings(null);
    setSavingsAmount('');
    setSavingsDate(new Date());
    setFundingSource('budget');
    setRepeatEveryPayPeriod(false);
    setPayPeriodDay('friday');
  };

  const handleSavingsContribution = async () => {
    if (!selectedGoalForSavings || !savingsAmount.trim()) {
      showAlert({
        title: 'Missing Information',
        message: 'Please enter an amount to save.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const amount = parseFloat(savingsAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    try {
      // Create new contribution
      const newContribution: SavingsContribution = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        goalId: selectedGoalForSavings.id,
        amount,
        date: savingsDate.toISOString(),
        fundingSource,
        isRecurring: repeatEveryPayPeriod,
        payPeriodDay: repeatEveryPayPeriod ? payPeriodDay : undefined,
      };

      // Update the savings goal with new contribution
      setSavingsGoals(prev => prev.map(goal => 
        goal.id === selectedGoalForSavings.id 
          ? { 
              ...goal, 
              currentAmount: goal.currentAmount + amount,
              contributions: [...(goal.contributions || []), newContribution]
            }
          : goal
      ));

      // Add a savings transaction
      await addTransaction({
        name: `Savings: ${selectedGoalForSavings.name}`,
        amount,
        date: savingsDate.toISOString(),
        category: 'savings',
        type: 'expense',
        isRecurring: repeatEveryPayPeriod,
      });

      handleCloseSavingsModal();
      
      showAlert({
        title: 'Savings Added',
        message: `Successfully added ${amount.toFixed(2)} to ${selectedGoalForSavings.name}!`,
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to add savings contribution. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };



  const getFundingSourceLabel = (source: typeof fundingSource) => {
    switch (source) {
      case 'budget': return 'From Budget';
      case 'extra_income': return 'From Extra Income';
      case 'unused_funds': return 'From Unused Funds';
      default: return 'From Budget';
    }
  };

  const getPayPeriodDayLabel = (day: typeof payPeriodDay) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Goal Details Modal Handlers
  const handleGoalCardPress = (goal: SavingsGoal) => {
    setSelectedGoalForDetails(goal);
    setShowGoalDetailsModal(true);
  };

  const handleCloseGoalDetailsModal = () => {
    setShowGoalDetailsModal(false);
    setSelectedGoalForDetails(null);
  };

  // Contribution Management Handlers
  const handleEditContribution = (contribution: SavingsContribution) => {
    setEditingContribution(contribution);
    setEditContributionAmount(contribution.amount.toString());
    setEditContributionDate(new Date(contribution.date));
    setShowEditContributionModal(true);
  };

  const handleCloseEditContributionModal = () => {
    setShowEditContributionModal(false);
    setEditingContribution(null);
    setEditContributionAmount('');
    setEditContributionDate(new Date());
  };

  const handleUpdateContribution = () => {
    if (!editingContribution || !editContributionAmount.trim()) {
      showAlert({
        title: 'Missing Information',
        message: 'Please enter a valid amount.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const newAmount = parseFloat(editContributionAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      showAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    const oldAmount = editingContribution.amount;
    const amountDifference = newAmount - oldAmount;

    // Update the contribution and goal
    setSavingsGoals(prev => prev.map(goal => {
      if (goal.id === editingContribution.goalId) {
        const updatedContributions = (goal.contributions || []).map(contrib => 
          contrib.id === editingContribution.id 
            ? { ...contrib, amount: newAmount, date: editContributionDate.toISOString() }
            : contrib
        );
        return {
          ...goal,
          currentAmount: Math.max(0, goal.currentAmount + amountDifference),
          contributions: updatedContributions,
        };
      }
      return goal;
    }));

    // Update selected goal for details modal if it exists
    if (selectedGoalForDetails && selectedGoalForDetails.id === editingContribution.goalId) {
      setSelectedGoalForDetails(prev => {
        if (!prev) return prev;
        const updatedContributions = (prev.contributions || []).map(contrib => 
          contrib.id === editingContribution.id 
            ? { ...contrib, amount: newAmount, date: editContributionDate.toISOString() }
            : contrib
        );
        return {
          ...prev,
          currentAmount: Math.max(0, prev.currentAmount + amountDifference),
          contributions: updatedContributions,
        };
      });
    }

    handleCloseEditContributionModal();
    
    showAlert({
      title: 'Contribution Updated',
      message: 'Successfully updated the contribution!',
      type: 'success',
      actions: [{ text: 'OK', onPress: () => {} }],
    });
  };

  const handleDeleteContribution = (contributionId: string) => {
    // Find the contribution across all goals
    let contribution: SavingsContribution | undefined;
    let goalId: string | undefined;
    
    for (const goal of savingsGoals) {
      const found = goal.contributions?.find(c => c.id === contributionId);
      if (found) {
        contribution = found;
        goalId = goal.id;
        break;
      }
    }

    if (!contribution || !goalId) return;

    showAlert({
      title: 'Delete Contribution',
      message: `Are you sure you want to delete this ${contribution.amount.toFixed(2)} contribution?`,
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {} },
        { 
          text: 'Delete', 
          onPress: () => {
            // Update the goal by removing the contribution
            setSavingsGoals(prev => prev.map(goal => {
              if (goal.id === goalId) {
                const updatedContributions = (goal.contributions || []).filter(c => c.id !== contributionId);
                return {
                  ...goal,
                  currentAmount: Math.max(0, goal.currentAmount - contribution!.amount),
                  contributions: updatedContributions,
                };
              }
              return goal;
            }));

            // Update selected goal for details modal if it exists
            if (selectedGoalForDetails && selectedGoalForDetails.id === goalId) {
              setSelectedGoalForDetails(prev => {
                if (!prev) return prev;
                const updatedContributions = (prev.contributions || []).filter(c => c.id !== contributionId);
                return {
                  ...prev,
                  currentAmount: Math.max(0, prev.currentAmount - contribution!.amount),
                  contributions: updatedContributions,
                };
              });
            }

            showAlert({
              title: 'Contribution Deleted',
              message: 'Successfully deleted the contribution!',
              type: 'success',
              actions: [{ text: 'OK', onPress: () => {} }],
            });
          },
          style: 'destructive'
        }
      ],
    });
  };

  const getFundingSourceDisplayName = (source: 'budget' | 'extra_income' | 'unused_funds') => {
    switch (source) {
      case 'budget': return 'Budget';
      case 'extra_income': return 'Extra Income';
      case 'unused_funds': return 'Unused Funds';
      default: return 'Budget';
    }
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

              {/* Spending Overview Card */}
              <Card variant="elevated" style={styles.summaryCard}>
                <View style={styles.budgetHeader}>
                  <Text style={[styles.budgetTitle, { color: colors.text }]}>Spending Overview</Text>
                </View>
                
                <View style={styles.spendingOverviewContainer}>
                  <View style={styles.spendingOverviewLeft}>
                    <View style={styles.spendingOverviewItem}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Spent</Text>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        ${totalSpent.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.spendingOverviewItem}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Most Spent Category</Text>
                      <View style={styles.mostSpentContainer}>
                        <View style={[styles.categoryColorDot, { backgroundColor: mostSpentCategory.color }]} />
                        <Text style={[styles.mostSpentCategory, { color: colors.text }]}>
                          {mostSpentCategory.name}
                        </Text>
                      </View>
                      <Text style={[styles.mostSpentAmount, { color: colors.textSecondary }]}>
                        ${spendingByCategory[mostSpentCategory.id]?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.spendingOverviewRight}>
                    {pieChartData.length > 0 ? (
                      <PieChart 
                        data={pieChartData}
                        size={100}
                      />
                    ) : (
                      <View style={[styles.emptyPieChart, { backgroundColor: colors.cardSecondary }]}>
                        <Text style={[styles.emptyPieChartText, { color: colors.textSecondary }]}>
                          No spending data
                        </Text>
                      </View>
                    )}
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
                  title="Add Income"
                  onPress={() => setShowAddModal(true)}
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
                    <TouchableOpacity
                      key={goal.id}
                      onPress={() => handleGoalCardPress(goal)}
                      activeOpacity={0.7}
                    >
                      <Card style={index < savingsGoals.length - 1 ? styles.goalCard : undefined}>
                        <View style={styles.goalHeader}>
                          <View style={styles.goalTitleContainer}>
                            <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.name}</Text>
                            <View style={styles.goalActions}>
                              <TouchableOpacity 
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleEditGoal(goal);
                                }}
                                style={[styles.goalActionButton, { backgroundColor: colors.cardSecondary }]}
                                activeOpacity={0.7}
                              >
                                <Edit3 size={14} color={colors.primary} strokeWidth={2} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGoal(goal.id);
                                }}
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
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAddToSavings(goal.id);
                            }}
                            style={styles.addToSavingsButton}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.addToSavingsButtonText, { color: colors.primary }]}>
                              Add to Savings
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </Card>
                    </TouchableOpacity>
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

              {/* Savings Contribution History Section */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.contributionSectionTitle, { color: colors.text }]}>Savings Contribution History</Text>
              </View>
              <Card>
                {savingsGoals.some(goal => goal.contributions && goal.contributions.length > 0) ? (
                  savingsGoals
                    .filter(goal => goal.contributions && goal.contributions.length > 0)
                    .flatMap(goal => 
                      goal.contributions!.map(contribution => ({
                        ...contribution,
                        goalName: goal.name
                      }))
                    )
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((contribution, index, allContributions) => (
                      <View key={contribution.id} style={[
                        styles.contributionItemRow,
                        index < allContributions.length - 1 && [
                          styles.contributionItemBorder,
                          { borderBottomColor: colors.border }
                        ]
                      ]}>
                        <View style={styles.contributionItemContent}>
                          <View style={styles.contributionItemLeft}>
                            <Text style={[styles.contributionAmount, { color: colors.text }]}>
                              ${contribution.amount.toFixed(2)}
                            </Text>
                            <Text style={[styles.contributionGoalName, { color: colors.primary }]}>
                              {contribution.goalName}
                            </Text>
                            <Text style={[styles.contributionDate, { color: colors.textSecondary }]}>
                              {new Date(contribution.date).toLocaleDateString()}
                            </Text>
                            <Text style={[styles.contributionSource, { color: colors.textSecondary }]}>
                              {getFundingSourceDisplayName(contribution.fundingSource)}
                            </Text>
                          </View>
                          <View style={styles.contributionItemActions}>
                            <TouchableOpacity 
                              onPress={() => {
                                const goal = savingsGoals.find(g => g.id === contribution.goalId);
                                if (goal) {
                                  setSelectedGoalForDetails(goal);
                                  handleEditContribution(contribution);
                                }
                              }}
                              style={[styles.contributionActionButton, { backgroundColor: colors.cardSecondary }]}
                              activeOpacity={0.7}
                            >
                              <Edit3 size={16} color={colors.primary} strokeWidth={2} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => {
                                const goal = savingsGoals.find(g => g.id === contribution.goalId);
                                if (goal) {
                                  setSelectedGoalForDetails(goal);
                                  handleDeleteContribution(contribution.id);
                                }
                              }}
                              style={[styles.contributionActionButton, { backgroundColor: colors.cardSecondary }]}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={16} color={colors.error} strokeWidth={2} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))
                ) : (
                  <EmptyState 
                    icon="plus"
                    title="No contributions yet"
                    subtitle="Add your first contribution to get started!"
                  />
                )}
              </Card>
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

        {/* Add to Savings Modal */}
        <Modal
          visible={showAddToSavingsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseSavingsModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Add to Savings
                </Text>
                <TouchableOpacity onPress={handleCloseSavingsModal} activeOpacity={0.7}>
                  <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
              
              {selectedGoalForSavings && (
                <View style={styles.modalContent}>
                  <View style={styles.goalInfoContainer}>
                    <Text style={[styles.goalInfoTitle, { color: colors.text }]}>
                      {selectedGoalForSavings.name}
                    </Text>
                    <Text style={[styles.goalInfoSubtitle, { color: colors.textSecondary }]}>
                      ${selectedGoalForSavings.currentAmount.toFixed(2)} of ${selectedGoalForSavings.targetAmount.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount to Save *</Text>
                    <View style={[styles.amountInputContainer, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                      <View style={styles.amountIconContainer}>
                        <DollarSign size={18} color={colors.textSecondary} strokeWidth={2} />
                      </View>
                      <TextInput
                        style={[styles.amountInput, { color: colors.text }]}
                        value={savingsAmount}
                        onChangeText={setSavingsAmount}
                        placeholder="0.00"
                        placeholderTextColor={colors.inactive}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <DatePicker
                    selectedDate={savingsDate}
                    onDateSelect={setSavingsDate}
                    label="Date of Contribution"
                    minimumDate={new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
                    maximumDate={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                    variant="default"
                  />
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Funding Source</Text>
                    <View style={styles.fundingSourceContainer}>
                      {(['budget', 'extra_income', 'unused_funds'] as const).map((source) => (
                        <TouchableOpacity
                          key={source}
                          style={[
                            styles.fundingSourceButton,
                            { 
                              backgroundColor: fundingSource === source ? colors.primary : colors.cardSecondary,
                              borderColor: colors.border
                            }
                          ]}
                          onPress={() => setFundingSource(source)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.fundingSourceText,
                            { color: fundingSource === source ? colors.background : colors.text }
                          ]}>
                            {getFundingSourceLabel(source)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <View style={styles.switchContainer}>
                      <View style={styles.switchLabelContainer}>
                        <Repeat size={18} color={colors.textSecondary} strokeWidth={2} />
                        <Text style={[styles.switchLabel, { color: colors.text }]}>
                          Repeat Every Pay Period
                        </Text>
                      </View>
                      <Switch
                        value={repeatEveryPayPeriod}
                        onValueChange={setRepeatEveryPayPeriod}
                        trackColor={{ false: colors.cardSecondary, true: colors.primary }}
                        thumbColor={colors.background}
                      />
                    </View>
                    
                    {repeatEveryPayPeriod && (
                      <View style={styles.payPeriodContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Day of Pay Period</Text>
                        <View style={styles.payPeriodDaysContainer}>
                          {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.payPeriodDayButton,
                                { 
                                  backgroundColor: payPeriodDay === day ? colors.primary : colors.cardSecondary,
                                  borderColor: colors.border
                                }
                              ]}
                              onPress={() => setPayPeriodDay(day)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.payPeriodDayText,
                                { color: payPeriodDay === day ? colors.background : colors.text }
                              ]}>
                                {getPayPeriodDayLabel(day)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        
                        {savingsAmount && !isNaN(parseFloat(savingsAmount)) && (
                          <Text style={[styles.payPeriodPreview, { color: colors.primary }]}>
                            Per Period: ${(parseFloat(savingsAmount)).toFixed(2)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              <View style={styles.modalActions}>
                <Button
                  title="Add to Savings"
                  onPress={handleSavingsContribution}
                  variant="primary"
                  size="medium"
                  style={styles.modalActionButton}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Goal Details Modal */}
        <Modal
          visible={showGoalDetailsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseGoalDetailsModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card, maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedGoalForDetails?.name || 'Goal Details'}
                </Text>
                <TouchableOpacity onPress={handleCloseGoalDetailsModal} activeOpacity={0.7}>
                  <Text style={[styles.modalClose, { color: colors.primary }]}>Close</Text>
                </TouchableOpacity>
              </View>
              
              {selectedGoalForDetails && (
                <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.goalDetailsContainer}>
                    <View style={styles.goalDetailsSummary}>
                      <Text style={[styles.goalDetailsAmount, { color: colors.text }]}>
                        ${selectedGoalForDetails.currentAmount.toFixed(2)} of ${selectedGoalForDetails.targetAmount.toFixed(2)}
                      </Text>
                      <View style={styles.progressContainer}>
                        <ProgressBar
                          progress={selectedGoalForDetails.targetAmount > 0 ? (selectedGoalForDetails.currentAmount / selectedGoalForDetails.targetAmount) * 100 : 0}
                          color={colors.success}
                          showPercentage
                        />
                      </View>
                    </View>

                    <View style={styles.contributionsSection}>
                      <View style={styles.contributionsSectionHeader}>
                        <TouchableOpacity
                          onPress={() => {
                            handleCloseGoalDetailsModal();
                            handleAddToSavings(selectedGoalForDetails.id);
                          }}
                          style={styles.addToSavingsButton}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.addToSavingsButtonText, { color: colors.primary }]}>
                            Add to Savings
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Edit Contribution Modal */}
        <Modal
          visible={showEditContributionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseEditContributionModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Edit Contribution
                </Text>
                <TouchableOpacity onPress={handleCloseEditContributionModal} activeOpacity={0.7}>
                  <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount *</Text>
                  <View style={[styles.amountInputContainer, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                    <View style={styles.amountIconContainer}>
                      <DollarSign size={18} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                    <TextInput
                      style={[styles.amountInput, { color: colors.text }]}
                      value={editContributionAmount}
                      onChangeText={setEditContributionAmount}
                      placeholder="0.00"
                      placeholderTextColor={colors.inactive}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <DatePicker
                  selectedDate={editContributionDate}
                  onDateSelect={setEditContributionDate}
                  label="Date of Contribution"
                  minimumDate={new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
                  maximumDate={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                  variant="default"
                />
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  title="Update Contribution"
                  onPress={handleUpdateContribution}
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
  goalInfoContainer: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: BorderRadius.md,
  },
  goalInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  goalInfoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  amountIconContainer: {
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
  },

  fundingSourceContainer: {
    gap: Spacing.xs,
  },
  fundingSourceButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundingSourceText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    marginLeft: Spacing.sm,
  },
  payPeriodContainer: {
    marginTop: Spacing.sm,
  },
  payPeriodDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  payPeriodDayButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payPeriodDayText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  payPeriodPreview: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  modalScrollContent: {
    maxHeight: '100%',
  },
  goalDetailsContainer: {
    paddingBottom: Spacing.lg,
  },
  goalDetailsSummary: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: BorderRadius.md,
  },
  goalDetailsAmount: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  contributionsSection: {
    flex: 1,
  },
  contributionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  contributionSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.lg,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  contributionItemRow: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  contributionItemBorder: {
    borderBottomWidth: 1,
  },
  contributionItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contributionItemLeft: {
    flex: 1,
  },
  contributionAmount: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  contributionDate: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 2,
  },
  contributionSource: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 16,
  },
  contributionGoalName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 2,
  },
  contributionItemActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  contributionActionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addToSavingsButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToSavingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  spendingOverviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 120,
  },
  spendingOverviewLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  spendingOverviewRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spendingOverviewItem: {
    marginBottom: Spacing.md,
  },
  mostSpentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  mostSpentCategory: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  mostSpentAmount: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  emptyPieChart: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPieChartText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});