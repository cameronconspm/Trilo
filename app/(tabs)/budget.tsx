import React, { useState, useMemo } from 'react';
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
import { BudgetCarousel } from '@/components/BudgetCarousel';
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
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineIndicator from '@/components/feedback/OfflineIndicator';
import { log } from '@/utils/logger';

function BudgetScreenContent() {
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
  const [incomeFilter, setIncomeFilter] = useState<'closest_date' | 'category' | 'alphabetical'>('closest_date');
  const [givenExpensesFilter, setGivenExpensesFilter] = useState<'closest_date' | 'category' | 'alphabetical'>('closest_date');
  const [recurringExpensesFilter, setRecurringExpensesFilter] = useState<'day_of_month' | 'category' | 'alphabetical'>('day_of_month');
  const [savingsFilter, setSavingsFilter] = useState<'closest_date' | 'category' | 'alphabetical'>('closest_date');
  const [oneTimeExpensesFilter, setOneTimeExpensesFilter] = useState<'closest_date' | 'category' | 'alphabetical'>('closest_date');

  // Dropdown open states
  const [incomeDropdownOpen, setIncomeDropdownOpen] = useState(false);
  const [givenExpensesDropdownOpen, setGivenExpensesDropdownOpen] = useState(false);
  const [recurringExpensesDropdownOpen, setRecurringExpensesDropdownOpen] = useState(false);
  const [savingsDropdownOpen, setSavingsDropdownOpen] = useState(false);
  const [oneTimeExpensesDropdownOpen, setOneTimeExpensesDropdownOpen] = useState(false);

  // Collapse states
  const [recurringExpensesCollapsed, setRecurringExpensesCollapsed] = useState(false);
  const [givenExpensesCollapsed, setGivenExpensesCollapsed] = useState(false);
  const [savingsCollapsed, setSavingsCollapsed] = useState(false);
  const [oneTimeExpensesCollapsed, setOneTimeExpensesCollapsed] = useState(false);

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
  // Generate all occurrences for the current month using paySchedule
  const recurringExpenses = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const baseRecurringExpenses = transactions.filter(
      t => t.type === 'expense' && t.isRecurring && t.category !== 'given_expenses'
    );
    
    const allExpenseOccurrences: Transaction[] = [];
    
    baseRecurringExpenses.forEach(expense => {
      if (expense.paySchedule) {
        // Use paySchedule to generate all occurrences in the current month
        const payDates = getPayDatesInRange(
          expense.paySchedule,
          startOfMonth,
          endOfMonth
        );
        
        // Create an expense entry for each pay date
        payDates.forEach((payDate, index) => {
          allExpenseOccurrences.push({
            ...expense,
            id: `${expense.id}_occurrence_${index}`,
            date: payDate.toISOString(),
          });
        });
      } else {
        // Legacy: For expenses without paySchedule, use the original date
        // Check if it falls in the current month
        const expenseDate = new Date(expense.date);
        if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
          allExpenseOccurrences.push(expense);
        }
      }
    });
    
    // Sort by date (day of month)
    return allExpenseOccurrences.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [transactions]);

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
    log('Budget handleCloseModal called');
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
      message: 'Are you sure you want to delete this savings goal?',
      type: 'warning',
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
  const getFilteredIncome = () => {
    switch (incomeFilter) {
      case 'category':
        return [...incomeTransactions].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...incomeTransactions].sort((a, b) => a.name.localeCompare(b.name));
      default: // closest_date
        return [...incomeTransactions].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });
    }
  };

  const getFilteredGivenExpenses = () => {
    let filteredExpenses = givenExpenses;
    
    // Apply collapse filter if enabled - hide past expenses, show current and upcoming
    if (givenExpensesCollapsed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
      
      filteredExpenses = givenExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        
        // Show expenses that are today or in the future (not past)
        return expenseDate >= today;
      });
    }
    
    // Apply sorting filter
    switch (givenExpensesFilter) {
      case 'category':
        return [...filteredExpenses].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...filteredExpenses].sort((a, b) => a.name.localeCompare(b.name));
      default: // closest_date
        return filteredExpenses; // Already sorted by smart date limits
    }
  };

  const getFilteredRecurringExpenses = () => {
    let filteredExpenses = recurringExpenses;
    
    // Apply collapse filter if enabled - hide past expenses, show current and upcoming
    if (recurringExpensesCollapsed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
      
      filteredExpenses = recurringExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        
        // Show expenses that are today or in the future (not past)
        return expenseDate >= today;
      });
    }
    
    // Apply sorting filter
    switch (recurringExpensesFilter) {
      case 'category':
        return [...filteredExpenses].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...filteredExpenses].sort((a, b) => a.name.localeCompare(b.name));
      case 'day_of_month':
        return filteredExpenses; // Already sorted by date
      default:
        return filteredExpenses; // Fallback to date sorting
    }
  };

  const getFilteredSavings = () => {
    let filteredSavings = savingsTransactions;
    
    // Apply collapse filter if enabled - hide past expenses, show current and upcoming
    if (savingsCollapsed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
      
      filteredSavings = savingsTransactions.filter(saving => {
        const savingDate = new Date(saving.date);
        savingDate.setHours(0, 0, 0, 0);
        
        // Show savings that are today or in the future (not past)
        return savingDate >= today;
      });
    }
    
    // Apply sorting filter
    switch (savingsFilter) {
      case 'category':
        return [...filteredSavings].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...filteredSavings].sort((a, b) => a.name.localeCompare(b.name));
      default: // closest_date
        return filteredSavings; // Already sorted by smart date limits
    }
  };

  const getFilteredOneTimeExpenses = () => {
    let filteredExpenses = oneTimeExpenses;
    
    // Apply collapse filter if enabled - hide past expenses, show current and upcoming
    if (oneTimeExpensesCollapsed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
      
      filteredExpenses = oneTimeExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        
        // Show expenses that are today or in the future (not past)
        return expenseDate >= today;
      });
    }
    
    // Apply sorting filter
    switch (oneTimeExpensesFilter) {
      case 'category':
        return [...filteredExpenses].sort((a, b) => a.category.localeCompare(b.category));
      case 'alphabetical':
        return [...filteredExpenses].sort((a, b) => a.name.localeCompare(b.name));
      default: // closest_date
        return [...filteredExpenses].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });
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
              <View style={styles.headerContent}>
                <Text style={[styles.title, { color: colors.text }]}>Budget</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Monthly planning
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setModalTransactionType('expense');
                  setShowAddModal(true);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Plus size={20} color={colors.primary} />
              </TouchableOpacity>
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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>Budget</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Monthly planning
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setModalTransactionType('expense');
                setShowAddModal(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {/* View Toggle */}
          <Toggle
            options={toggleOptions}
            activeOption={activeView}
            onOptionChange={handleToggleChange}
          />

          {activeView === 'budget' ? (
            <>
              {/* Budget Carousel */}
              <BudgetCarousel
                budget={budget}
                budgetUtilization={budgetUtilization}
                remainingIncome={remainingIncome}
                totalExpenses={totalExpenses}
              />

              {/* Income Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Income
                  </Text>
                  <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                      {getFilteredIncome().length} items
                    </Text>
                    {incomeTransactions.length > 0 && (
                      <FilterDropdown
                        options={filterOptions}
                        selectedValue={incomeFilter}
                        onSelect={(value) => setIncomeFilter(value as 'closest_date' | 'category' | 'alphabetical')}
                        isOpen={incomeDropdownOpen}
                        onToggle={() => setIncomeDropdownOpen(!incomeDropdownOpen)}
                        backgroundColor={colors.card}
                      />
                    )}
                  </View>
                </View>
              </View>
              <Card>
                {incomeTransactions.length > 0 ? (
                  getFilteredIncome().map((income, index) => (
                    <TransactionItem
                      key={income.id}
                      transaction={income}
                      isLast={index === getFilteredIncome().length - 1}
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
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Given Expenses
                    </Text>
                    <View style={styles.sectionInfo}>
                      <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                        {givenExpensesCollapsed ? getFilteredGivenExpenses().length : givenExpenses.length} items
                      </Text>
                      {givenExpenses.length > 0 && (
                        <>
                          <TouchableOpacity
                            onPress={() => setGivenExpensesCollapsed(!givenExpensesCollapsed)}
                            style={[styles.collapseButton, { backgroundColor: colors.card }]}
                            activeOpacity={0.7}
                          >
                            {givenExpensesCollapsed ? (
                              <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
                            ) : (
                              <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                            )}
                          </TouchableOpacity>
                        <FilterDropdown
                          options={filterOptions}
                          selectedValue={givenExpensesFilter}
                          onSelect={(value) => setGivenExpensesFilter(value as 'closest_date' | 'category' | 'alphabetical')}
                          isOpen={givenExpensesDropdownOpen}
                          onToggle={() => setGivenExpensesDropdownOpen(!givenExpensesDropdownOpen)}
                          backgroundColor={colors.card}
                        />
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <Card>
                  {(() => {
                    const filteredExpenses = getFilteredGivenExpenses();
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
                      icon='dollar'
                        title={givenExpensesCollapsed ? 'No upcoming given expenses' : 'No given expenses'}
                        subtitle={givenExpensesCollapsed ? 'All given expenses have passed' : 'Add essential expenses like bills, debt payments, and subscriptions'}
                    />
                    );
                  })()}
                </Card>
              </View>

              {/* Savings Section */}
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Savings
                    </Text>
                    <View style={styles.sectionInfo}>
                      <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                        {savingsCollapsed ? getFilteredSavings().length : savingsTransactions.length} items
                      </Text>
                      {savingsTransactions.length > 0 && (
                        <>
                          <TouchableOpacity
                            onPress={() => setSavingsCollapsed(!savingsCollapsed)}
                            style={[styles.collapseButton, { backgroundColor: colors.card }]}
                            activeOpacity={0.7}
                          >
                            {savingsCollapsed ? (
                              <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
                            ) : (
                              <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                            )}
                          </TouchableOpacity>
                        <FilterDropdown
                          options={filterOptions}
                          selectedValue={savingsFilter}
                          onSelect={(value) => setSavingsFilter(value as 'closest_date' | 'category' | 'alphabetical')}
                          isOpen={savingsDropdownOpen}
                          onToggle={() => setSavingsDropdownOpen(!savingsDropdownOpen)}
                          backgroundColor={colors.card}
                        />
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <Card>
                  {(() => {
                    const filteredSavings = getFilteredSavings();
                    return filteredSavings.length > 0 ? (
                      filteredSavings.map((saving, index) => (
                      <TransactionItem
                        key={saving.id}
                        transaction={saving}
                          isLast={index === filteredSavings.length - 1}
                        onEdit={handleEditTransaction}
                        enableSwipeActions={true}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon='dollar'
                        title={savingsCollapsed ? 'No upcoming savings' : 'No savings'}
                        subtitle={savingsCollapsed ? 'All savings transactions have passed' : 'Add your savings goals and contributions'}
                    />
                    );
                  })()}
                </Card>
              </View>

              {/* Recurring Expenses Section */}
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Recurring Expenses
                    </Text>
                    <View style={styles.sectionInfo}>
                      <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                        {recurringExpensesCollapsed ? getFilteredRecurringExpenses().length : recurringExpenses.length} items
                      </Text>
                      {recurringExpenses.length > 0 && (
                        <>
                          <TouchableOpacity
                            onPress={() => setRecurringExpensesCollapsed(!recurringExpensesCollapsed)}
                            style={[styles.collapseButton, { backgroundColor: colors.card }]}
                            activeOpacity={0.7}
                          >
                            {recurringExpensesCollapsed ? (
                              <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
                            ) : (
                              <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
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
                        </>
                      )}
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
              </View>

              {/* One-Time Expenses Section */}
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      One-Time Expenses
                    </Text>
                    <View style={styles.sectionInfo}>
                      <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                        {oneTimeExpensesCollapsed ? getFilteredOneTimeExpenses().length : oneTimeExpenses.length} items
                      </Text>
                      {oneTimeExpenses.length > 0 && (
                        <>
                          <TouchableOpacity
                            onPress={() => setOneTimeExpensesCollapsed(!oneTimeExpensesCollapsed)}
                            style={[styles.collapseButton, { backgroundColor: colors.card }]}
                            activeOpacity={0.7}
                          >
                            {oneTimeExpensesCollapsed ? (
                              <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
                            ) : (
                              <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                            )}
                          </TouchableOpacity>
                        <FilterDropdown
                          options={filterOptions}
                          selectedValue={oneTimeExpensesFilter}
                          onSelect={(value) => setOneTimeExpensesFilter(value as 'closest_date' | 'category' | 'alphabetical')}
                          isOpen={oneTimeExpensesDropdownOpen}
                          onToggle={() => setOneTimeExpensesDropdownOpen(!oneTimeExpensesDropdownOpen)}
                          backgroundColor={colors.card}
                        />
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <Card>
                  {(() => {
                    const filteredExpenses = getFilteredOneTimeExpenses();
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
                      icon='plus'
                        title={oneTimeExpensesCollapsed ? 'No upcoming one-time expenses' : 'No one-time expenses'}
                        subtitle={oneTimeExpensesCollapsed ? 'All one-time expenses have passed' : 'Track occasional purchases and unexpected costs'}
                    />
                    );
                  })()}
                </Card>
              </View>
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
      <OfflineIndicator />
    </>
  );
}

export default function BudgetScreen() {
  return (
    <ErrorBoundary context="Budget Screen">
      <BudgetScreenContent />
    </ErrorBoundary>
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
    minHeight: '100%',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0, // Remove top margin - spacing handled by carousel pageIndicators marginBottom
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
