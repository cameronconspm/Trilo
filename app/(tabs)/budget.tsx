import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Target, DollarSign, Edit3, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSavings, SavingsGoal } from '@/context/SavingsContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import { useAlert } from '@/hooks/useAlert';
import Card from '@/components/layout/Card';
import Button from '@/components/layout/Button';
import ProgressBar from '@/components/feedback/ProgressBar';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/feedback/EmptyState';
import AddTransactionModal from '@/components/modals/AddTransactionModal';
import SavingsGoalModal from '@/components/modals/SavingsGoalModal';
import AlertModal from '@/components/modals/AlertModal';
import Toggle, { ToggleOption } from '@/components/shared/Toggle';
import { FilterDropdown, FilterOption } from '@/components/shared/FilterDropdown';
import { filterAndSortBySmartDateLimits } from '@/utils/dateUtils';
import { getPayDatesInRange } from '@/utils/payScheduleUtils';
import { calculateNextGivenExpenseDate } from '@/utils/givenExpenseUtils';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';
import { Transaction } from '@/types/finance';

export default function BudgetScreen() {
  const { budget, transactions, isLoading } = useFinance();
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    isLoading: savingsLoading,
  } = useSavings();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<
    Transaction | undefined
  >(undefined);
  const [modalTransactionType, setModalTransactionType] = useState<
    'income' | 'expense'
  >('expense');
  const [activeView, setActiveView] = useState<'budget' | 'savings'>('budget');
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [editSavingsGoal, setEditSavingsGoal] = useState<
    SavingsGoal | undefined
  >(undefined);

  // Filter options for each section
  const [givenExpensesFilter, setGivenExpensesFilter] = useState<'closest_date' | 'category' | 'alphabetical'>('closest_date');
  const [recurringExpensesFilter, setRecurringExpensesFilter] = useState<'day_of_month' | 'category' | 'alphabetical'>('day_of_month');
  const [savingsFilter, setSavingsFilter] = useState<'closest_date' | 'category' | 'alphabetical'>('closest_date');

  // Dropdown open states
  const [givenExpensesDropdownOpen, setGivenExpensesDropdownOpen] = useState(false);
  const [recurringExpensesDropdownOpen, setRecurringExpensesDropdownOpen] = useState(false);
  const [savingsDropdownOpen, setSavingsDropdownOpen] = useState(false);

  // Collapse states
  const [recurringExpensesCollapsed, setRecurringExpensesCollapsed] = useState(false);

  // Filter options configuration
  const filterOptions: FilterOption[] = [
    { value: 'closest_date', label: 'Closest Date' },
    { value: 'category', label: 'Category' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  // Filter options for recurring expenses (different default)
  const recurringFilterOptions: FilterOption[] = [
    { value: 'day_of_month', label: 'Day of Month' },
    { value: 'category', label: 'Category' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  // Toggle options for Budget/Savings
  const toggleOptions: ToggleOption[] = [
    {
      id: 'budget',
      label: 'Budget',
    },
    {
      id: 'savings',
      label: 'Savings',
    },
  ];

  const handleToggleChange = (optionId: string) => {
    setActiveView(optionId as 'budget' | 'savings');
  };

  // Get current month transactions
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const incomeTransactions = transactions.filter(t => {
    if (t.type !== 'income') return false;

    // For recurring income with pay schedule, check if there are any pay dates in the current month
    if (t.isRecurring && t.paySchedule) {
      const payDates = getPayDatesInRange(t.paySchedule, startOfMonth, endOfMonth);
      // Include if there are any pay dates in the current month
      return payDates.length > 0;
    }

    // For non-recurring income or income without pay schedule, check the transaction date
    const transactionDate = new Date(t.date);
    return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
  });



  const savingsTransactions = transactions.filter(
    t => t.type === 'expense' && t.category === 'savings'
  );

  const oneTimeExpenses = transactions.filter(
    t =>
      t.type === 'expense' &&
      !t.isRecurring &&
      t.category === 'one_time_expense'
  );

  // Given expenses (including recurring ones) - these are essential expenses
  // Recalculate dates for given expenses based on their schedule
  const givenExpensesWithUpdatedDates = transactions
    .filter(t => t.type === 'expense' && t.category === 'given_expenses')
    .map(t => {
      if (t.givenExpenseSchedule) {
        // Calculate next occurrence date based on schedule
        const nextDate = calculateNextGivenExpenseDate(t.givenExpenseSchedule);
        return { ...t, date: nextDate.toISOString() };
      }
      return t;
    });
  
  const givenExpenses = filterAndSortBySmartDateLimits(givenExpensesWithUpdatedDates);

  // Recurring expenses (excluding given expenses which have their own section)
  const recurringExpenses = transactions
    .filter(t => t.type === 'expense' && t.isRecurring && t.category !== 'given_expenses')
    .sort((a, b) => {
      // Sort by day of the month (1st through 31st)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const dayA = dateA.getDate();
      const dayB = dateB.getDate();
      
      // Sort by day of month (1, 2, 3, ..., 31)
      return dayA - dayB;
    });

  const totalExpenses =
    budget.expenses.given +
    budget.expenses.oneTime +
    budget.expenses.recurring +
    budget.expenses.savings;
  const remainingIncome = budget.income - totalExpenses;
  const budgetUtilization =
    budget.income > 0 ? (totalExpenses / budget.income) * 100 : 0;

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
    console.log('Budget handleCloseModal called'); // Debug log
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
      message:
        'Are you sure you want to delete this savings goal? This action cannot be undone.',
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

  // Filter functions for each section
  const getFilteredGivenExpenses = () => {
    switch (givenExpensesFilter) {
      case 'category':
        return [...givenExpenses].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...givenExpenses].sort((a, b) => a.name.localeCompare(b.name));
      default: // closest_date
        return givenExpenses; // Already sorted by smart date limits
    }
  };

  const getFilteredRecurringExpenses = () => {
    let filteredExpenses = recurringExpenses;
    
    // Apply collapse filter if enabled
    if (recurringExpensesCollapsed) {
      const today = new Date();
      const currentDay = today.getDate();
      
      console.log('Collapse filter enabled. Current day:', currentDay);
      console.log('Total recurring expenses:', recurringExpenses.length);
      
      filteredExpenses = recurringExpenses.filter(expense => {
        // For recurring expenses, we only care about the day of the month
        // The date field contains the original creation date, but we want to know
        // if this day of the month has already passed this month
        const expenseDate = new Date(expense.date);
        const expenseDay = expenseDate.getDate();
        
        // If the expense day is today or in the future this month, show it
        // If the expense day has already passed this month, hide it
        const isFutureOrToday = expenseDay >= currentDay;
        
        console.log(`Expense: ${expense.name}, Day of month: ${expenseDay}, Current day: ${currentDay}, Is Future/Today: ${isFutureOrToday}`);
        
        return isFutureOrToday;
      });
      
      console.log('Filtered expenses count:', filteredExpenses.length);
    }
    
    // Apply sorting filter
    switch (recurringExpensesFilter) {
      case 'category':
        return [...filteredExpenses].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...filteredExpenses].sort((a, b) => a.name.localeCompare(b.name));
      case 'day_of_month':
        return filteredExpenses; // Already sorted by day of month (1-31)
      default:
        return filteredExpenses; // Fallback to day of month sorting
    }
  };

  const getFilteredSavings = () => {
    switch (savingsFilter) {
      case 'category':
        return [...savingsTransactions].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...savingsTransactions].sort((a, b) => a.name.localeCompare(b.name));
      default: // closest_date
        return savingsTransactions; // Already sorted by smart date limits
    }
  };

  if (isLoading || savingsLoading) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Budget</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Monthly planning
              </Text>
            </View>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.inactive }]}>
                Loading...
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Budget</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Monthly planning
            </Text>
          </View>
          {/* View Toggle */}
          <Toggle
            options={toggleOptions}
            activeOption={activeView}
            onOptionChange={handleToggleChange}
          />

          {activeView === 'budget' ? (
            <>
              {/* Budget Overview Card */}
              <Card variant='elevated' style={styles.summaryCard}>
                <View style={styles.budgetHeader}>
                  <Text style={[styles.budgetTitle, { color: colors.text }]}>
                    Monthly Budget
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Monthly Income
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      ${budget.income > 0 ? budget.income.toFixed(2) : '0.00'}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Total Expenses
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      ${totalExpenses.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={budgetUtilization}
                    color={
                      budgetUtilization > 90
                        ? colors.error
                        : budgetUtilization > 75
                          ? colors.warning
                          : colors.success
                    }
                    label='Budget Utilization'
                    showPercentage
                  />
                </View>

                <View style={styles.remainingContainer}>
                  <Text
                    style={[
                      styles.remainingLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Remaining Budget
                  </Text>
                  <Text
                    style={[
                      styles.remainingValue,
                      {
                        color:
                          remainingIncome < 0 ? colors.error : colors.success,
                      },
                    ]}
                  >
                    ${remainingIncome.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.breakdownContainer}>
                  <Text style={[styles.breakdownTitle, { color: colors.text }]}>
                    Expense Breakdown
                  </Text>
                  <View style={styles.breakdownRow}>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Given expenses
                    </Text>
                    <Text
                      style={[styles.breakdownValue, { color: colors.text }]}
                    >
                      ${budget.expenses.given.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      One-Time Expenses
                    </Text>
                    <Text
                      style={[styles.breakdownValue, { color: colors.text }]}
                    >
                      ${budget.expenses.oneTime.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Recurring expenses
                    </Text>
                    <Text
                      style={[styles.breakdownValue, { color: colors.text }]}
                    >
                      ${budget.expenses.recurring.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Savings
                    </Text>
                    <Text
                      style={[styles.breakdownValue, { color: colors.text }]}
                    >
                      ${budget.expenses.savings.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <Button
                  title='Add Expense'
                  onPress={() => {
                    setModalTransactionType('expense');
                    setShowAddModal(true);
                  }}
                  variant='primary'
                  size='medium'
                  style={styles.actionButton}
                />
                <Button
                  title='Add Income'
                  onPress={handleAddIncome}
                  variant='outline'
                  size='medium'
                  style={styles.actionButton}
                />
              </View>

              {/* Income Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Income
                  </Text>
                  <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                      {incomeTransactions.length} items
                    </Text>
                  </View>
                </View>
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
                    icon='dollar'
                    title='No income this month'
                    subtitle='Add your salary, freelance work, or other income sources'
                  />
                )}
              </Card>

              {/* Given Expenses Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Given Expenses
                  </Text>
                  <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                      {givenExpenses.length} items
                    </Text>
                    <FilterDropdown
                      options={filterOptions}
                      selectedValue={givenExpensesFilter}
                      onSelect={(value) => setGivenExpensesFilter(value as 'closest_date' | 'category' | 'alphabetical')}
                      isOpen={givenExpensesDropdownOpen}
                      onToggle={() => setGivenExpensesDropdownOpen(!givenExpensesDropdownOpen)}
                      backgroundColor={colors.card}
                    />
                  </View>
                </View>
              </View>
              <Card>
                {givenExpenses.length > 0 ? (
                  getFilteredGivenExpenses().map((expense, index) => (
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
                    icon='dollar'
                    title='No given expenses'
                    subtitle='Add essential expenses like bills, debt payments, and subscriptions'
                  />
                )}
              </Card>

              {/* Savings Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Savings
                  </Text>
                  <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                      {savingsTransactions.length} items
                    </Text>
                    <FilterDropdown
                      options={filterOptions}
                      selectedValue={savingsFilter}
                      onSelect={(value) => setSavingsFilter(value as 'closest_date' | 'category' | 'alphabetical')}
                      isOpen={savingsDropdownOpen}
                      onToggle={() => setSavingsDropdownOpen(!savingsDropdownOpen)}
                      backgroundColor={colors.card}
                    />
                  </View>
                </View>
              </View>
              <Card>
                {savingsTransactions.length > 0 ? (
                  getFilteredSavings().map((saving, index) => (
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
                    icon='dollar'
                    title='No savings'
                    subtitle='Add your savings goals and contributions'
                  />
                )}
              </Card>

              {/* Recurring Expenses Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Recurring Expenses
                  </Text>
                  <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                      {recurringExpensesCollapsed ? getFilteredRecurringExpenses().length : recurringExpenses.length} items
                    </Text>
                    <TouchableOpacity
                      onPress={() => setRecurringExpensesCollapsed(!recurringExpensesCollapsed)}
                      style={[styles.collapseButton, { backgroundColor: colors.card }]}
                      activeOpacity={0.7}
                    >
                      {recurringExpensesCollapsed ? (
                        <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                      ) : (
                        <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                    <FilterDropdown
                      options={recurringFilterOptions}
                      selectedValue={recurringExpensesFilter}
                      onSelect={(value) => setRecurringExpensesFilter(value as 'day_of_month' | 'category' | 'alphabetical')}
                      isOpen={recurringExpensesDropdownOpen}
                      onToggle={() => setRecurringExpensesDropdownOpen(!recurringExpensesDropdownOpen)}
                      backgroundColor={colors.card}
                    />
                  </View>
                </View>
              </View>
              <Card>
                {(() => {
                  const filteredExpenses = getFilteredRecurringExpenses();
                  return filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense, index) => (
                      <TransactionItem
                        key={expense.id}
                        transaction={expense}
                        isLast={index === filteredExpenses.length - 1}
                        onEdit={handleEditTransaction}
                        enableSwipeActions={true}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon='trending'
                      title={recurringExpensesCollapsed ? 'No upcoming recurring expenses' : 'No recurring expenses'}
                      subtitle={recurringExpensesCollapsed ? 'All recurring expenses for this month have passed' : 'Add monthly subscriptions, bills, and regular payments'}
                    />
                  );
                })()}
              </Card>

              {/* One-Time Expenses Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    One-Time Expenses
                  </Text>
                  <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                      {oneTimeExpenses.length} items
                    </Text>
                  </View>
                </View>
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
                    icon='plus'
                    title='No one-time expenses'
                    subtitle='Track occasional purchases and unexpected costs'
                  />
                )}
              </Card>
            </>
          ) : (
            <>
              {/* Savings Goals Section */}
              <View style={styles.savingsHeader}>
                <Text style={[styles.savingsTitle, { color: colors.text }]}>
                  Savings Goals
                </Text>
              </View>

              {savingsGoals.length > 0 ? (
                savingsGoals.map(goal => {
                  const weeklySavingsRequired =
                    goal.targetAmount / goal.timeframeWeeks;
                  const monthsEquivalent =
                    Math.round((goal.timeframeWeeks / 4.33) * 10) / 10;

                  return (
                    <Card key={goal.id} style={styles.savingsGoalCard}>
                      <View style={styles.goalHeader}>
                        <View style={styles.goalTitleContainer}>
                          <Target
                            size={20}
                            color={colors.primary}
                            strokeWidth={2}
                          />
                          <Text
                            style={[styles.goalTitle, { color: colors.text }]}
                          >
                            {goal.title}
                          </Text>
                        </View>
                        <View style={styles.goalActions}>
                          <TouchableOpacity
                            onPress={() => handleEditSavingsGoal(goal)}
                            style={[
                              styles.goalActionButton,
                              { backgroundColor: colors.background },
                            ]}
                            activeOpacity={0.7}
                          >
                            <Edit3
                              size={16}
                              color={colors.textSecondary}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteSavingsGoal(goal.id)}
                            style={[
                              styles.goalActionButton,
                              { backgroundColor: colors.background },
                            ]}
                            activeOpacity={0.7}
                          >
                            <Trash2
                              size={16}
                              color={colors.error}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.goalDetails}>
                        <View style={styles.goalDetailRow}>
                          <Text
                            style={[
                              styles.goalDetailLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Target Amount
                          </Text>
                          <Text
                            style={[
                              styles.goalDetailValue,
                              { color: colors.text },
                            ]}
                          >
                            ${goal.targetAmount.toFixed(2)}
                          </Text>
                        </View>

                        <View style={styles.goalDetailRow}>
                          <Text
                            style={[
                              styles.goalDetailLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Timeframe
                          </Text>
                          <Text
                            style={[
                              styles.goalDetailValue,
                              { color: colors.text },
                            ]}
                          >
                            {goal.timeframeWeeks} weeks (≈ {monthsEquivalent}{' '}
                            months)
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.goalDetailRow,
                            styles.weeklyRequiredRow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.goalDetailLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Weekly Required
                          </Text>
                          <Text
                            style={[
                              styles.weeklyRequiredValue,
                              { color: colors.primary },
                            ]}
                          >
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
                    icon='plus'
                    title='No savings goals yet'
                    subtitle='Create your first savings goal to start planning for the future'
                  />
                </Card>
              )}

              {/* New Goal Button - Centered below savings goals */}
              <View style={styles.newGoalButtonContainer}>
                <Button
                  title='New Goal'
                  onPress={() => setShowSavingsModal(true)}
                  variant='primary'
                  size='medium'
                  style={styles.newGoalButton}
                />
              </View>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    paddingVertical: Spacing.lg,
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
    ...Typography.h3, // Using new typography system
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
    ...Typography.label, // Using new typography system
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    ...Typography.currencySmall, // Using new typography system
    textAlign: 'left', // Left-aligned to match labels
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
    ...Typography.label, // Using new typography system
    marginBottom: Spacing.sm,
  },
  remainingValue: {
    ...Typography.currencyMedium, // Using new typography system
  },
  breakdownContainer: {
    borderRadius: BorderRadius.lg,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  breakdownTitle: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40, // Increased from 36px for better touch targets
    paddingVertical: Spacing.xs,
  },
  breakdownLabel: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '400', // Regular weight
    flexShrink: 1,
  },
  breakdownValue: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '600', // Medium weight
    textAlign: 'right', // Right-aligned
    flexShrink: 0,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: SpacingValues.cardMargin,
  },
  actionButton: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg, // Reduced from xl
    marginBottom: Spacing.sm, // Reduced from md
  },
  sectionTitle: {
    ...Typography.h3, // Using new typography system
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionCount: {
    ...Typography.caption, // Using new typography system
    fontSize: 12,
  },
  collapseButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },

  addButton: {
    width: Math.max(40, SpacingValues.minTouchTarget),
    height: Math.max(40, SpacingValues.minTouchTarget),
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.light,
  },

  // Savings View Styles
  savingsHeader: {
    marginBottom: Spacing.lg,
  },
  savingsTitle: {
    ...Typography.h2, // Using new typography system
  },
  newGoalButtonContainer: {
    alignItems: 'center',
    marginTop: 24, // ENFORCED: 24pt spacing from card above
    marginBottom: 24, // ENFORCED: 24pt spacing to next element
    marginHorizontal: -SpacingValues.screenHorizontal, // Break out of ScrollView padding
    paddingHorizontal: SpacingValues.screenHorizontal, // Add back padding for button content
  },
  newGoalButton: {
    width: '100%', // Force full width
    marginHorizontal: 0, // Remove any margins
  },
  savingsGoalCard: {
    marginBottom: Spacing.md, // Reduced from lg
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
    ...Typography.h3, // Using new typography system
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
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '500',
  },
  goalDetailValue: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '600',
    textAlign: 'right',
  },
  weeklyRequiredRow: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: Spacing.sm,
  },
  weeklyRequiredValue: {
    ...Typography.currencySmall, // Using new typography system
    fontWeight: '700',
  },
  emptySavingsCard: {
    marginTop: Spacing.xl,
  },
});
