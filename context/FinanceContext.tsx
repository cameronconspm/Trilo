import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, WeeklyOverview, MonthlyInsights, Budget, CategoryType, Income, SavingsGoal, PaySchedule } from '@/types/finance';
import categories from '@/constants/categories';
import { getPayDatesInRange, getWeeklyIncomeAmount, formatPaySchedule } from '@/utils/payScheduleUtils';
import { getCurrentPayPeriod } from '@/utils/payPeriodUtils';
import NotificationService from '@/services/NotificationService';
import { transactionService, UserTransaction, incomeService, UserIncome, goalService, UserGoal } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';

interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  achievedDate?: string;
  targetValue?: number;
  currentValue?: number;
}

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  weeklyOverview: WeeklyOverview;
  monthlyInsights: MonthlyInsights;
  budget: Budget;
  milestones: Milestone[];
  isLoading: boolean;
  clearAllData: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  reloadData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance_transactions_v2',
  BUDGET_GOALS: 'finance_budget_goals_v2',
  LAST_BACKUP: 'finance_last_backup_v2',
  APP_VERSION: 'finance_app_version',
  MILESTONES: 'finance_milestones_v2',
  PLANNING_STREAK: 'finance_planning_streak_v2',
} as const;

const CURRENT_APP_VERSION = '2.0.0';

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { userId, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverview>({
    weekIncome: 0,
    remainingBalance: 0,
    utilization: 0,
    contributions: {},
    upcomingExpenses: [],
    pastExpenses: [],
    currentPayPeriod: undefined,
  });
  const [monthlyInsights, setMonthlyInsights] = useState<MonthlyInsights>({
    totalSpent: 0,
    totalSaved: 0,
    topSpendingCategory: {
      category: categories[0],
      amount: 0,
    },
    insights: [],
    recentTransactions: [],
  });
  const [budget, setBudget] = useState<Budget>({
    income: 0,
    expenses: {
      given: 0,
      oneTime: 0,
      recurring: 0,
      savings: 0,
    },
  });

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadAllData();
    } else if (!isAuthenticated) {
      // Clear data when user logs out
      setTransactions([]);
      setIncomes([]);
      setSavingsGoals([]);
      setMilestones([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  // Check for external data clearing (like reset data)
  useEffect(() => {
    const checkForDataReset = async () => {
      try {
        const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
        
        // If both are missing and we have transactions in state, data was externally cleared
        if (!storedTransactions && !storedVersion && transactions.length > 0) {
          console.log('FinanceContext: External data reset detected, clearing state');
          setTransactions([]);
          setIncomes([]);
          setSavingsGoals([]);
          setMilestones([]);
        }
      } catch (error) {
        console.error('FinanceContext: Error checking for data reset:', error);
      }
    };

    // Check every 2 seconds when app is active
    const interval = setInterval(checkForDataReset, 2000);
    return () => clearInterval(interval);
  }, [transactions.length]);

  // Calculate insights whenever transactions or incomes change - real-time sync
  useEffect(() => {
    if (!isLoading) {
      // Immediate calculation for real-time updates
      calculateWeeklyOverview();
      calculateMonthlyInsights();
      calculateBudget();
      // Auto-backup every time data changes
      autoBackup();
    }
  }, [transactions, incomes, isLoading]);

  // Additional effect to ensure immediate UI updates when transactions or incomes are modified
  useEffect(() => {
    if (!isLoading && (transactions.length >= 0 || incomes.length >= 0)) {
      // Force recalculation on any data array change
      const timeoutId = setTimeout(() => {
        calculateWeeklyOverview();
        calculateMonthlyInsights();
        calculateBudget();
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [transactions.length, incomes.length, isLoading]);

  const loadAllData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('FinanceContext: Loading data from Supabase...');
      
      // Load transactions from Supabase
      const supabaseTransactions = await transactionService.getTransactions(userId);
      const convertedTransactions = supabaseTransactions.map(convertSupabaseToTransaction);
      
      console.log(`FinanceContext: Loaded ${convertedTransactions.length} transactions from Supabase`);
      setTransactions(convertedTransactions);
      
      // Load incomes from Supabase
      const supabaseIncomes = await incomeService.getIncomes(userId);
      const convertedIncomes = supabaseIncomes.map(convertSupabaseToIncome);
      
      console.log(`FinanceContext: Loaded ${convertedIncomes.length} incomes from Supabase`);
      setIncomes(convertedIncomes);
      
      // Load goals from Supabase
      const supabaseGoals = await goalService.getGoals(userId);
      const convertedGoals = supabaseGoals.map(convertSupabaseToGoal);
      
      console.log(`FinanceContext: Loaded ${convertedGoals.length} goals from Supabase`);
      setSavingsGoals(convertedGoals);
      
      // Also try to load from local storage as backup/migration
      await migrateLocalDataToSupabase();
      
    } catch (error) {
      console.error('FinanceContext: Error loading data from Supabase:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - table or column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Fallback to local storage
      await loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const recoverFromBackup = async () => {
    try {
      console.log('FinanceContext: Attempting to recover from backup...');
      const backupData = await AsyncStorage.getItem('finance_auto_backup');
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        if (parsedBackup.transactions && Array.isArray(parsedBackup.transactions)) {
          const validTransactions = parsedBackup.transactions.filter(validateTransaction);
          console.log(`FinanceContext: Recovered ${validTransactions.length} transactions from backup`);
          setTransactions(validTransactions);
          await saveTransactions(validTransactions);
          return;
        }
      }
      console.log('FinanceContext: No valid backup found, starting with empty data');
      setTransactions([]);
    } catch (error) {
      console.error('FinanceContext: Error recovering from backup:', error);
      setTransactions([]);
    }
  };

  const validateTransaction = (transaction: any): transaction is Transaction => {
    try {
      return (
        transaction &&
        typeof transaction.id === 'string' &&
        typeof transaction.name === 'string' &&
        typeof transaction.amount === 'number' &&
        typeof transaction.date === 'string' &&
        typeof transaction.category === 'string' &&
        typeof transaction.type === 'string' &&
        typeof transaction.isRecurring === 'boolean' &&
        transaction.amount > 0 &&
        ['income', 'expense'].includes(transaction.type) &&
        categories.some(cat => cat.id === transaction.category) &&
        !isNaN(new Date(transaction.date).getTime()) // Valid date
      );
    } catch (error) {
      return false;
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      // Save to local storage as backup
      const dataToSave = JSON.stringify(newTransactions);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, dataToSave);
      console.log(`FinanceContext: Saved ${newTransactions.length} transactions to local storage`);
    } catch (error) {
      console.error('FinanceContext: Error saving transactions to local storage:', error);
    }
  };

  const calculateWeeklyOverview = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current pay period
    const currentPayPeriod = getCurrentPayPeriod(transactions);
    console.log('FinanceContext: Current pay period:', currentPayPeriod);
    
    let periodIncome = 0;
    let periodStartDate: Date;
    let periodEndDate: Date;

    if (currentPayPeriod) {
      periodStartDate = currentPayPeriod.startDate;
      periodEndDate = currentPayPeriod.endDate;
      
      console.log('FinanceContext: Pay period dates:', periodStartDate.toDateString(), 'to', periodEndDate.toDateString());
      
      // Find all income transactions within this pay period
      const incomeTransactions = transactions.filter(t => {
        if (t.type !== 'income') return false;
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);
        const isInPeriod = transactionDate >= periodStartDate && transactionDate <= periodEndDate;
        console.log('FinanceContext: Income transaction', t.name, 'Date:', transactionDate.toDateString(), 'In period:', isInPeriod);
        return isInPeriod;
      });
      
      console.log('FinanceContext: Found', incomeTransactions.length, 'income transactions in current pay period');
      
      // Sum all income transactions in this period
      let transactionIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      console.log('FinanceContext: Total transaction income:', transactionIncome);
      
      // Calculate income from Income entries with pay schedules
      let scheduleIncome = 0;
      incomes.forEach(income => {
        if (!income.isActive || !income.paySchedule) return;
        
        // Get pay dates for this income within the current pay period
        const payDates = getPayDatesInRange(income.paySchedule, periodStartDate, periodEndDate);
        const incomeAmount = payDates.length * income.amount;
        scheduleIncome += incomeAmount;
        
        console.log('FinanceContext: Income', income.name, 'contributes', incomeAmount, 'from', payDates.length, 'pay dates in period');
      });
      
      console.log('FinanceContext: Total schedule income:', scheduleIncome);
      periodIncome = transactionIncome + scheduleIncome;
      console.log('FinanceContext: Total period income:', periodIncome);
    } else {
      // Fallback to weekly calculation if no pay period found
      periodStartDate = new Date(today);
      periodStartDate.setDate(today.getDate() - today.getDay());
      periodEndDate = new Date(periodStartDate);
      periodEndDate.setDate(periodStartDate.getDate() + 6);
      periodEndDate.setHours(23, 59, 59, 999);
      
      // Calculate income for the week from Income entries
      incomes.forEach(income => {
        if (!income.isActive || !income.paySchedule) return;
        
        const payDates = getPayDatesInRange(income.paySchedule, periodStartDate, periodEndDate);
        periodIncome += payDates.length * income.amount;
      });
    }

    // Get all expense transactions and resolve their dates to the current pay period
    const resolvedExpenses = transactions
      .filter(t => t.type === 'expense')
      .map(t => {
        let resolvedDate = new Date(t.date);
        
        // If this is a non-recurring expense, try to resolve it to the current pay period
        if (!t.isRecurring && currentPayPeriod) {
          const originalDate = new Date(t.date);
          const dayOfMonth = originalDate.getDate();
          
          // Try to place this day within the current pay period
          const periodStart = new Date(periodStartDate);
          const periodEnd = new Date(periodEndDate);
          
          // Create candidate dates for this day of month
          const candidates = [];
          
          // Try current pay period's start month
          const startMonth = periodStart.getMonth();
          const startYear = periodStart.getFullYear();
          candidates.push(new Date(startYear, startMonth, dayOfMonth));
          
          // Try next month if pay period spans multiple months
          if (periodEnd.getMonth() !== startMonth) {
            candidates.push(new Date(startYear, startMonth + 1, dayOfMonth));
          }
          
          // Find the best candidate date within the pay period
          const validCandidates = candidates.filter(date => 
            date >= periodStart && date <= periodEnd
          );
          
          if (validCandidates.length > 0) {
            // Use the first valid candidate (closest to pay period start)
            resolvedDate = validCandidates[0];
          }
          // If no valid candidates, keep the original date
        }
        
        return {
          ...t,
          resolvedDate
        };
      })
      .filter(t => {
        // Only include expenses that fall within the current pay period
        return t.resolvedDate >= periodStartDate && t.resolvedDate <= periodEndDate;
      });

    // Calculate upcoming expenses (future transactions in this period)
    const upcomingExpenses = resolvedExpenses
      .filter(t => t.resolvedDate > today)
      .map(t => ({ ...t, date: t.resolvedDate.toISOString() })) // Update the date to resolved date
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate past expenses in this period
    const pastExpenseTransactions = resolvedExpenses
      .filter(t => t.resolvedDate <= today)
      .map(t => ({ ...t, date: t.resolvedDate.toISOString() })) // Update the date to resolved date
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent first
    
    const pastExpenses = pastExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate remaining balance
    const totalUpcomingExpenses = upcomingExpenses.reduce((sum, t) => sum + t.amount, 0);
    const remainingBalance = periodIncome - pastExpenses - totalUpcomingExpenses;

    // Calculate utilization
    const totalPeriodExpenses = pastExpenses + totalUpcomingExpenses;
    const utilization = periodIncome > 0 ? Math.min((totalPeriodExpenses / periodIncome) * 100, 100) : 0;

    // Calculate contributions by category (all expenses in pay period)
    const contributions: Record<CategoryType, { total: number; count: number }> = {} as any;
    
    resolvedExpenses.forEach(t => {
      if (!contributions[t.category]) {
        contributions[t.category] = { total: 0, count: 0 };
      }
      contributions[t.category].total += t.amount;
      contributions[t.category].count += 1;
    });

    setWeeklyOverview({
      weekIncome: periodIncome,
      remainingBalance,
      utilization,
      contributions,
      upcomingExpenses,
      pastExpenses: pastExpenseTransactions,
      currentPayPeriod: currentPayPeriod?.displayText,
    });
  };

  const calculateMonthlyInsights = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Filter transactions for current month
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    // Calculate total spent (excluding income)
    const totalSpent = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate total saved (no longer a separate category, so set to 0)
    const totalSaved = 0;

    // Find top spending category
    const spendingByCategory: Record<CategoryType, number> = {} as any;
    
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!spendingByCategory[t.category]) {
          spendingByCategory[t.category] = 0;
        }
        spendingByCategory[t.category] += t.amount;
      });

    let topCategory = categories.find(c => c.id !== 'income') || categories[0];
    let topAmount = 0;

    Object.entries(spendingByCategory).forEach(([categoryId, amount]) => {
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = categories.find(c => c.id === categoryId) || topCategory;
      }
    });

    // Get recent transactions (last 10)
    const recentTransactions = [...transactions]
      .filter(t => new Date(t.date) <= today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Generate insights based on data
    const insights: string[] = [];
    
    if (totalSpent > 0) {
      insights.push(`You've spent $${totalSpent.toFixed(2)} this month`);
    }
    
    if (topAmount > 0) {
      insights.push(`Your top spending category is ${topCategory.name} at $${topAmount.toFixed(2)}`);
    }

    // Add spending trend insights
    if (monthTransactions.length > 0) {
      const avgDailySpend = totalSpent / new Date().getDate();
      if (avgDailySpend > 50) {
        insights.push(`You're spending an average of $${avgDailySpend.toFixed(2)} per day`);
      }
    }

    // Add pay schedule insights
    const incomeTransactions = transactions.filter(t => t.type === 'income' && t.paySchedule);
    if (incomeTransactions.length > 0) {
      const scheduleDescriptions = incomeTransactions.map(t => 
        formatPaySchedule(t.paySchedule!)
      );
      insights.push(`Income schedules: ${scheduleDescriptions.join(', ')}`);
    }

    setMonthlyInsights({
      totalSpent,
      totalSaved,
      topSpendingCategory: {
        category: topCategory,
        amount: topAmount,
      },
      insights,
      recentTransactions,
    });
  };

  const calculateBudget = () => {
    // Calculate monthly income from pay schedules
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let monthlyIncome = 0;
    
    // Calculate income from transaction-based income entries
    const incomeTransactions = transactions.filter(t => t.type === 'income' && t.isRecurring);
    
    incomeTransactions.forEach(transaction => {
      if (transaction.paySchedule) {
        // Use new pay schedule system
        const payDates = getPayDatesInRange(transaction.paySchedule, startOfMonth, endOfMonth);
        monthlyIncome += payDates.length * transaction.amount;
      } else {
        // Legacy system - assume monthly
        monthlyIncome += transaction.amount;
      }
    });
    
    // Calculate income from Income entries with pay schedules
    incomes.forEach(income => {
      if (!income.isActive || !income.paySchedule) return;
      
      // Get pay dates for this income within the current month
      const payDates = getPayDatesInRange(income.paySchedule, startOfMonth, endOfMonth);
      monthlyIncome += payDates.length * income.amount;
      
      console.log('FinanceContext: Budget - Income', income.name, 'contributes', payDates.length * income.amount, 'from', payDates.length, 'pay dates in month');
    });
    
    console.log('FinanceContext: Total monthly income for budget:', monthlyIncome);

    // Calculate recurring expenses (excluding given expenses which are handled separately)
    const recurringExpenses = transactions
      .filter(t => t.type === 'expense' && t.isRecurring && t.category !== 'given_expenses')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate one-time expenses for current month
    const oneTimeExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && 
               !t.isRecurring && 
               t.category === 'one_time_expense' &&
               transactionDate >= startOfMonth && 
               transactionDate <= endOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate given expenses based on their frequency schedule
    let givenExpenses = 0;
    const givenExpenseTransactions = transactions.filter(t => 
      t.type === 'expense' && t.category === 'given_expenses'
    );
    
    givenExpenseTransactions.forEach(transaction => {
      if (transaction.givenExpenseSchedule) {
        const schedule = transaction.givenExpenseSchedule;
        const startDate = new Date(schedule.startDate);
        
        // Calculate how many times this expense occurs in the current month
        let occurrences = 0;
        
        if (schedule.frequency === 'every_week') {
          // Weekly: approximately 4.33 times per month
          occurrences = 4.33;
        } else if (schedule.frequency === 'every_other_week') {
          // Bi-weekly: approximately 2.17 times per month
          occurrences = 2.17;
        } else if (schedule.frequency === 'once_a_month') {
          // Monthly: once per month
          occurrences = 1;
        }
        
        givenExpenses += transaction.amount * occurrences;
      } else {
        // Legacy given expenses (treat as one-time for current month)
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= startOfMonth && transactionDate <= endOfMonth) {
          givenExpenses += transaction.amount;
        }
      }
    });

    // Savings expenses are no longer a separate category
    const savingsExpenses = 0;

    setBudget({
      income: monthlyIncome,
      expenses: {
        recurring: recurringExpenses,
        oneTime: oneTimeExpenses,
        given: givenExpenses,
        savings: savingsExpenses,
      },
    });
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('FinanceContext: Adding transaction', transaction);
      
      // Convert to Supabase format and save
      const supabaseTransaction = convertTransactionToSupabase(transaction);
      const savedTransaction = await transactionService.addTransaction(userId, supabaseTransaction);
      
      // Convert back to app format
      const newTransaction = convertSupabaseToTransaction(savedTransaction);
      const updatedTransactions = [...transactions, newTransaction];
      
      // Update state immediately for real-time sync
      setTransactions(updatedTransactions);
      
      // Save to local storage as backup
      await saveTransactions(updatedTransactions);
      
      console.log('FinanceContext: Transaction added successfully');
    } catch (error) {
      console.error('FinanceContext: Error adding transaction:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setTransactions(transactions);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Convert updates to Supabase format
      const supabaseUpdates = convertTransactionUpdatesToSupabase(updates);
      const updatedSupabaseTransaction = await transactionService.updateTransaction(id, supabaseUpdates);
      
      // Convert back to app format
      const updatedTransaction = convertSupabaseToTransaction(updatedSupabaseTransaction);
      const updatedTransactions = transactions.map(t => 
        t.id === id ? updatedTransaction : t
      );
      
      // Update state immediately for real-time sync
      setTransactions(updatedTransactions);
      
      // Save to local storage as backup
      await saveTransactions(updatedTransactions);
      console.log('FinanceContext: Transaction updated successfully');
    } catch (error) {
      console.error('FinanceContext: Error updating transaction:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setTransactions(transactions);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      await transactionService.deleteTransaction(id);
      
      const updatedTransactions = transactions.filter(t => t.id !== id);
      
      // Update state immediately for real-time sync
      setTransactions(updatedTransactions);
      
      // Save to local storage as backup
      await saveTransactions(updatedTransactions);
      console.log('FinanceContext: Transaction deleted successfully');
    } catch (error) {
      console.error('FinanceContext: Error deleting transaction:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setTransactions(transactions);
      throw error;
    }
  };

  // Income management functions
  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('FinanceContext: Adding income', income);
      
      // Create a proper PaySchedule based on the frequency and start date
      let paySchedule: PaySchedule | undefined;
      const startDate = new Date(income.startDate);
      
      switch (income.frequency) {
        case 'weekly':
          paySchedule = {
            cadence: 'weekly',
            lastPaidDate: startDate.toISOString()
          };
          break;
        case 'bi_weekly':
          paySchedule = {
            cadence: 'every_2_weeks',
            lastPaidDate: startDate.toISOString()
          };
          break;
        case 'monthly':
          paySchedule = {
            cadence: 'monthly',
            lastPaidDate: startDate.toISOString()
          };
          break;
        case 'yearly':
          // For yearly, we'll treat it as monthly for now
          // Could be enhanced to handle yearly properly
          paySchedule = {
            cadence: 'monthly',
            lastPaidDate: startDate.toISOString()
          };
          break;
      }
      
      // Create the income with the generated pay schedule
      const incomeWithSchedule: Omit<Income, 'id'> = {
        ...income,
        paySchedule
      };
      
      console.log('FinanceContext: Created pay schedule for income:', paySchedule);
      
      // Convert to Supabase format and save
      const supabaseIncome = convertIncomeToSupabase(incomeWithSchedule);
      const savedIncome = await incomeService.addIncome(userId, supabaseIncome);
      
      // Convert back to app format
      const newIncome = convertSupabaseToIncome(savedIncome);
      const updatedIncomes = [...incomes, newIncome];
      
      // Update state immediately for real-time sync
      setIncomes(updatedIncomes);
      
      console.log('FinanceContext: Income added successfully with pay schedule');
    } catch (error) {
      console.error('FinanceContext: Error adding income:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setIncomes(incomes);
      throw error;
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Convert updates to Supabase format
      const supabaseUpdates = convertIncomeUpdatesToSupabase(updates);
      const updatedSupabaseIncome = await incomeService.updateIncome(id, supabaseUpdates);
      
      // Convert back to app format
      const updatedIncome = convertSupabaseToIncome(updatedSupabaseIncome);
      const updatedIncomes = incomes.map(i => 
        i.id === id ? updatedIncome : i
      );
      
      // Update state immediately for real-time sync
      setIncomes(updatedIncomes);
      
      console.log('FinanceContext: Income updated successfully');
    } catch (error) {
      console.error('FinanceContext: Error updating income:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setIncomes(incomes);
      throw error;
    }
  };

  const deleteIncome = async (id: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      await incomeService.deleteIncome(id);
      
      const updatedIncomes = incomes.filter(i => i.id !== id);
      
      // Update state immediately for real-time sync
      setIncomes(updatedIncomes);
      
      console.log('FinanceContext: Income deleted successfully');
    } catch (error) {
      console.error('FinanceContext: Error deleting income:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setIncomes(incomes);
      throw error;
    }
  };

  const clearAllData = async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('FinanceContext: Clearing all data...');
      
      // Clear from Supabase
      await transactionService.clearAllTransactions(userId);
      await incomeService.clearAllIncomes(userId);
      await goalService.clearAllGoals(userId);
      
      // Clear from local storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.BUDGET_GOALS,
        STORAGE_KEYS.LAST_BACKUP,
        STORAGE_KEYS.MILESTONES,
        STORAGE_KEYS.PLANNING_STREAK,
        'finance_auto_backup',
      ]);
      
      setTransactions([]);
      setIncomes([]);
      setSavingsGoals([]);
      setMilestones([]);
      console.log('FinanceContext: All data cleared successfully');
    } catch (error) {
      console.error('FinanceContext: Error clearing financial data:', error);
      throw new Error('Failed to clear data');
    }
  };

  const reloadData = async () => {
    await loadAllData();
  };

  const exportData = async (): Promise<string> => {
    try {
      const exportData = {
        transactions,
        exportDate: new Date().toISOString(),
        version: CURRENT_APP_VERSION,
        appVersion: CURRENT_APP_VERSION,
      };
      console.log(`FinanceContext: Exporting ${transactions.length} transactions`);
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('FinanceContext: Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  };

  const importData = async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
        const validTransactions = parsedData.transactions.filter(validateTransaction);
        console.log(`FinanceContext: Importing ${validTransactions.length} valid transactions`);
        setTransactions(validTransactions);
        await saveTransactions(validTransactions);
      } else {
        throw new Error('Invalid data format - no transactions array found');
      }
    } catch (error) {
      console.error('FinanceContext: Error importing data:', error);
      throw new Error('Failed to import data - invalid format or corrupted data');
    }
  };

  const autoBackup = async () => {
    try {
      const lastBackup = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
      const now = new Date();
      const lastBackupDate = lastBackup ? new Date(lastBackup) : null;
      
      // Auto-backup once per day or if no backup exists
      if (!lastBackupDate || now.getTime() - lastBackupDate.getTime() > 24 * 60 * 60 * 1000) {
        const backupData = await exportData();
        await AsyncStorage.setItem('finance_auto_backup', backupData);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now.toISOString());
        console.log('FinanceContext: Auto-backup completed');
      }
    } catch (error) {
      console.error('FinanceContext: Auto-backup failed:', error);
      // Don't throw error for backup failures - it's not critical
    }
  };

  // Helper functions for data conversion
  const convertSupabaseToTransaction = (supabaseTransaction: UserTransaction): Transaction => {
    return {
      id: supabaseTransaction.id,
      name: supabaseTransaction.name,
      amount: supabaseTransaction.amount,
      date: supabaseTransaction.date,
      category: supabaseTransaction.category as CategoryType,
      type: supabaseTransaction.type,
      isRecurring: supabaseTransaction.is_recurring,
      paySchedule: supabaseTransaction.pay_schedule,
      givenExpenseSchedule: supabaseTransaction.given_expense_schedule,
    };
  };

  const convertTransactionToSupabase = (transaction: Omit<Transaction, 'id'>): Omit<UserTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'> => {
    const baseTransaction = {
      name: transaction.name,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      type: transaction.type,
      is_recurring: transaction.isRecurring,
    };
    
    // Only include schedule fields if they exist and are not null/undefined
    const result: any = { ...baseTransaction };
    if (transaction.paySchedule !== undefined && transaction.paySchedule !== null) {
      result.pay_schedule = transaction.paySchedule;
    }
    if (transaction.givenExpenseSchedule !== undefined && transaction.givenExpenseSchedule !== null) {
      result.given_expense_schedule = transaction.givenExpenseSchedule;
    }
    
    return result;
  };

  const convertTransactionUpdatesToSupabase = (updates: Partial<Transaction>): Partial<Omit<UserTransaction, 'id' | 'user_id' | 'created_at'>> => {
    const supabaseUpdates: any = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.amount !== undefined) supabaseUpdates.amount = updates.amount;
    if (updates.date !== undefined) supabaseUpdates.date = updates.date;
    if (updates.category !== undefined) supabaseUpdates.category = updates.category;
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;
    if (updates.isRecurring !== undefined) supabaseUpdates.is_recurring = updates.isRecurring;
    
    // Only include schedule fields if they exist and are not null/undefined
    if (updates.paySchedule !== undefined && updates.paySchedule !== null) {
      supabaseUpdates.pay_schedule = updates.paySchedule;
    }
    if (updates.givenExpenseSchedule !== undefined && updates.givenExpenseSchedule !== null) {
      supabaseUpdates.given_expense_schedule = updates.givenExpenseSchedule;
    }
    
    return supabaseUpdates;
  };

  // Income conversion helpers
  const convertSupabaseToIncome = (supabaseIncome: UserIncome): Income => {
    return {
      id: supabaseIncome.id,
      name: supabaseIncome.name,
      amount: supabaseIncome.amount,
      frequency: supabaseIncome.frequency,
      startDate: supabaseIncome.start_date,
      endDate: supabaseIncome.end_date,
      isActive: supabaseIncome.is_active,
      paySchedule: supabaseIncome.pay_schedule,
    };
  };

  const convertIncomeToSupabase = (income: Omit<Income, 'id'>): Omit<UserIncome, 'id' | 'user_id' | 'created_at' | 'updated_at'> => {
    const baseIncome = {
      name: income.name,
      amount: income.amount,
      frequency: income.frequency,
      start_date: income.startDate,
      end_date: income.endDate,
      is_active: income.isActive,
    };
    
    // Only include pay_schedule if it exists and is not null/undefined
    const result: any = { ...baseIncome };
    if (income.paySchedule !== undefined && income.paySchedule !== null) {
      result.pay_schedule = income.paySchedule;
    }
    
    return result;
  };

  const convertIncomeUpdatesToSupabase = (updates: Partial<Income>): Partial<Omit<UserIncome, 'id' | 'user_id' | 'created_at'>> => {
    const supabaseUpdates: any = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.amount !== undefined) supabaseUpdates.amount = updates.amount;
    if (updates.frequency !== undefined) supabaseUpdates.frequency = updates.frequency;
    if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) supabaseUpdates.end_date = updates.endDate;
    if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
    
    // Only include pay_schedule if it exists and is not null/undefined
    if (updates.paySchedule !== undefined && updates.paySchedule !== null) {
      supabaseUpdates.pay_schedule = updates.paySchedule;
    }
    
    return supabaseUpdates;
  };

  // Goal management functions
  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('FinanceContext: Adding savings goal', goal);
      
      // Convert to Supabase format and save
      const supabaseGoal = convertGoalToSupabase(goal);
      const savedGoal = await goalService.addGoal(userId, supabaseGoal);
      
      // Convert back to app format
      const newGoal = convertSupabaseToGoal(savedGoal);
      const updatedGoals = [...savingsGoals, newGoal];
      
      // Update state immediately for real-time sync
      setSavingsGoals(updatedGoals);
      
      console.log('FinanceContext: Savings goal added successfully');
    } catch (error) {
      console.error('FinanceContext: Error adding savings goal:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setSavingsGoals(savingsGoals);
      throw error;
    }
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Convert updates to Supabase format
      const supabaseUpdates = convertGoalUpdatesToSupabase(updates);
      const updatedSupabaseGoal = await goalService.updateGoal(id, supabaseUpdates);
      
      // Convert back to app format
      const updatedGoal = convertSupabaseToGoal(updatedSupabaseGoal);
      const updatedGoals = savingsGoals.map(g => 
        g.id === id ? updatedGoal : g
      );
      
      // Update state immediately for real-time sync
      setSavingsGoals(updatedGoals);
      
      console.log('FinanceContext: Savings goal updated successfully');
    } catch (error) {
      console.error('FinanceContext: Error updating savings goal:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setSavingsGoals(savingsGoals);
      throw error;
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      await goalService.deleteGoal(id);
      
      const updatedGoals = savingsGoals.filter(g => g.id !== id);
      
      // Update state immediately for real-time sync
      setSavingsGoals(updatedGoals);
      
      console.log('FinanceContext: Savings goal deleted successfully');
    } catch (error) {
      console.error('FinanceContext: Error deleting savings goal:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Check for specific database schema errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === 'PGRST204' || dbError.code === '42703') {
          console.error('Database schema error - column may not exist:', dbError.message);
          console.error('Please ensure the database schema is up to date');
        }
      }
      
      // Revert state on error
      setSavingsGoals(savingsGoals);
      throw error;
    }
  };

  // Goal conversion helpers
  const convertSupabaseToGoal = (supabaseGoal: UserGoal): SavingsGoal => {
    return {
      id: supabaseGoal.id,
      name: supabaseGoal.name,
      targetAmount: supabaseGoal.target_amount,
      currentAmount: supabaseGoal.current_amount,
      timeToSave: supabaseGoal.time_to_save,
      createdDate: supabaseGoal.created_date,
      targetDate: supabaseGoal.target_date,
    };
  };

  const convertGoalToSupabase = (goal: Omit<SavingsGoal, 'id'>): Omit<UserGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'> => {
    return {
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      time_to_save: goal.timeToSave,
      created_date: goal.createdDate,
      target_date: goal.targetDate,
    };
  };

  const convertGoalUpdatesToSupabase = (updates: Partial<SavingsGoal>): Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at'>> => {
    const supabaseUpdates: any = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.targetAmount !== undefined) supabaseUpdates.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) supabaseUpdates.current_amount = updates.currentAmount;
    if (updates.timeToSave !== undefined) supabaseUpdates.time_to_save = updates.timeToSave;
    if (updates.createdDate !== undefined) supabaseUpdates.created_date = updates.createdDate;
    if (updates.targetDate !== undefined) supabaseUpdates.target_date = updates.targetDate;
    return supabaseUpdates;
  };

  const migrateLocalDataToSupabase = async () => {
    if (!userId) return;
    
    try {
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        if (Array.isArray(parsedTransactions) && parsedTransactions.length > 0) {
          console.log('FinanceContext: Migrating local transactions to Supabase...');
          
          // Check if we already have data in Supabase to avoid duplicates
          const existingTransactions = await transactionService.getTransactions(userId);
          if (existingTransactions.length === 0) {
            // Migrate each transaction
            for (const transaction of parsedTransactions) {
              if (validateTransaction(transaction)) {
                try {
                  const supabaseTransaction = convertTransactionToSupabase(transaction);
                  await transactionService.addTransaction(userId, supabaseTransaction);
                } catch (error) {
                  console.error('FinanceContext: Error migrating transaction:', error);
                }
              }
            }
            console.log('FinanceContext: Migration completed');
            
            // Reload data after migration
            const migratedTransactions = await transactionService.getTransactions(userId);
            const convertedTransactions = migratedTransactions.map(convertSupabaseToTransaction);
            setTransactions(convertedTransactions);
          }
        }
      }
    } catch (error) {
      console.error('FinanceContext: Error during migration:', error);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      console.log('FinanceContext: Loading from local storage as fallback...');
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        if (Array.isArray(parsedTransactions)) {
          const validTransactions = parsedTransactions.filter(validateTransaction);
          console.log(`FinanceContext: Loaded ${validTransactions.length} valid transactions from local storage`);
          setTransactions(validTransactions);
        }
      }
    } catch (error) {
      console.error('FinanceContext: Error loading from local storage:', error);
      setTransactions([]);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        incomes,
        addIncome,
        deleteIncome,
        updateIncome,
        savingsGoals,
        addSavingsGoal,
        deleteSavingsGoal,
        updateSavingsGoal,
        weeklyOverview,
        monthlyInsights,
        budget,
        milestones,
        isLoading,
        clearAllData,
        exportData,
        importData,
        reloadData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}