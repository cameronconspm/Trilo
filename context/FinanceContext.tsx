import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  WeeklyOverview,
  MonthlyInsights,
  Budget,
  CategoryType,
} from '@/types/finance';
import categories from '@/constants/categories';
import {
  getPayDatesInRange,
  getWeeklyIncomeAmount,
  formatPaySchedule,
} from '@/utils/payScheduleUtils';
import { getCurrentPayPeriod } from '@/utils/payPeriodUtils';
import { sortByClosestDateWithFuturePriority, filterAndSortBySmartDateLimits } from '@/utils/dateUtils';
import { getGivenExpenseDateForPayPeriod, calculateNextGivenExpenseDate } from '@/utils/givenExpenseUtils';
import NotificationService from '@/services/NotificationService';
import { useAuth } from './AuthContext';
import { SyncService } from '@/services/SyncService';
import { WidgetSyncService } from '@/services/WidgetSyncService';
import { log, warn, error as logError } from '@/utils/logger';
import { generateUUID } from '@/utils/uuidUtils';

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
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>
  ) => Promise<void>;
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

const DEFAULT_CONTEXT_VALUE: FinanceContextType = {
  transactions: [],
  addTransaction: async () => {},
  deleteTransaction: async () => {},
  updateTransaction: async () => {},
  weeklyOverview: {
    weekIncome: 0,
    remainingBalance: 0,
    utilization: 0,
    contributions: {},
    upcomingExpenses: [],
    pastExpenses: [],
    currentPayPeriod: undefined,
  },
  monthlyInsights: {
    totalSpent: 0,
    totalSaved: 0,
    topSpendingCategory: {
      category: {
        id: 'bill',
        name: 'Bills & Utilities',
        color: '#4E91F9',
      },
      amount: 0,
    },
    insights: [],
    recentTransactions: [],
  },
  budget: {
    income: 0,
    expenses: {
      given: 0,
      oneTime: 0,
      recurring: 0,
      savings: 0,
    },
  },
  milestones: [],
  isLoading: true,
  clearAllData: async () => {},
  exportData: async () => '',
  importData: async () => {},
  reloadData: async () => {},
};

const FinanceContext = createContext<FinanceContextType>(DEFAULT_CONTEXT_VALUE);

const CURRENT_APP_VERSION = '2.0.0';

// Helper to get user-specific storage keys
const getStorageKeys = (userId: string) => ({
  TRANSACTIONS: `finance_transactions_v2_${userId}`,
  BUDGET_GOALS: `finance_budget_goals_v2_${userId}`,
  LAST_BACKUP: `finance_last_backup_v2_${userId}`,
  APP_VERSION: `finance_app_version_${userId}`,
  MILESTONES: `finance_milestones_v2_${userId}`,
  PLANNING_STREAK: `finance_planning_streak_v2_${userId}`,
});

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const STORAGE_KEYS = getStorageKeys(userId);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  // Load data from AsyncStorage on mount and when user changes
  useEffect(() => {
    log(`FinanceContext: Loading data for user: ${userId}`);
    loadAllData();
  }, [userId]);

  // Also reload when user object changes (handles test account case)
  useEffect(() => {
    if (user?.id) {
      log(`FinanceContext: User changed, reloading data for: ${user.id}`);
      loadAllData();
    }
  }, [user?.id]);

  // Check for external data clearing (like reset data)
  useEffect(() => {
    const checkForDataReset = async () => {
      try {
        const storedTransactions = await AsyncStorage.getItem(
          STORAGE_KEYS.TRANSACTIONS
        );
        const storedVersion = await AsyncStorage.getItem(
          STORAGE_KEYS.APP_VERSION
        );

        // If both are missing and we have transactions in state, data was externally cleared
        if (!storedTransactions && !storedVersion && transactions.length > 0) {
          log(
            'FinanceContext: External data reset detected, clearing state'
          );
          setTransactions([]);
          setMilestones([]);
        }
      } catch (error) {
        logError('FinanceContext: Error checking for data reset:', error);
      }
    };

    // Check every 2 seconds when app is active
    const interval = setInterval(checkForDataReset, 2000);
    return () => clearInterval(interval);
  }, [transactions.length]);

  // Calculate insights whenever transactions change - real-time sync
  useEffect(() => {
    if (!isLoading && transactions.length >= 0) {
      // Immediate calculation for real-time updates
      log(`FinanceContext: Recalculating insights for ${transactions.length} transactions`);
      // Use a small delay to ensure state is stable
      const timeoutId = setTimeout(() => {
        calculateWeeklyOverview();
        calculateMonthlyInsights();
        calculateBudget();
        // Auto-backup every time data changes
        autoBackup();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [transactions.length, isLoading]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const syncWidget = async () => {
      try {
        if (weeklyOverview.upcomingExpenses.length === 0) {
          await WidgetSyncService.clearUpcomingExpenses();
        } else {
          await WidgetSyncService.updateUpcomingExpenses(
            weeklyOverview.upcomingExpenses
          );
        }
      } catch (syncError) {
        logError('FinanceContext: Failed to sync widget data:', syncError);
      }
    };

    syncWidget();
  }, [isLoading, weeklyOverview.upcomingExpenses]);

  // Additional effect to ensure immediate UI updates when transactions are modified
  useEffect(() => {
    if (!isLoading && transactions.length >= 0) {
      // Force recalculation on any transaction array change
      const timeoutId = setTimeout(() => {
        calculateWeeklyOverview();
        calculateMonthlyInsights();
        calculateBudget();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [transactions.length, isLoading]);

  // Ensure calculations run when loading completes (initial load fix)
  // This effect ensures the UI updates on initial app load when data finishes loading
  useEffect(() => {
    if (!isLoading && transactions.length >= 0) {
      // Run calculations immediately when loading completes
      // The transactions.length >= 0 check ensures this runs even with empty transactions
      calculateWeeklyOverview();
      calculateMonthlyInsights();
      calculateBudget();
    }
  }, [isLoading, transactions.length]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      log('FinanceContext: Loading data from cloud...');
      
      // Initialize sync service
      const syncService = new SyncService(userId);
      
      // Try to load from cloud first (only for UUID users)
      // For test accounts, this will return empty array and we'll load from local
      try {
        const cloudTransactions = await syncService.loadFromCloud();
        if (cloudTransactions && cloudTransactions.length > 0) {
          log(`FinanceContext: Loaded ${cloudTransactions.length} transactions from cloud`);
          setTransactions(cloudTransactions);
          // Calculate immediately after setting transactions, then mark as loaded
          // Use setTimeout to ensure state has updated before calculations
          setTimeout(() => {
            calculateWeeklyOverview();
            calculateMonthlyInsights();
            calculateBudget();
            setIsLoading(false);
            log('FinanceContext: Cloud data calculations completed');
          }, 100);
          return;
        } else {
          log('FinanceContext: No cloud data (or test account), loading from local storage');
        }
      } catch (error) {
        log('FinanceContext: Error loading from cloud, falling back to local storage:', error);
      }
      
      log('FinanceContext: Loading data from local storage...');

      // Check app version for migration if needed
      const storedVersion = await AsyncStorage.getItem(
        STORAGE_KEYS.APP_VERSION
      );
      if (!storedVersion) {
        // First time app launch, set version
        await AsyncStorage.setItem(
          STORAGE_KEYS.APP_VERSION,
          CURRENT_APP_VERSION
        );
        log(
          'FinanceContext: First app launch, version set to',
          CURRENT_APP_VERSION
        );
      }

      // Load transactions with error recovery
      const storedTransactions = await AsyncStorage.getItem(
        STORAGE_KEYS.TRANSACTIONS
      );
      log(`FinanceContext: Loading from storage key: ${STORAGE_KEYS.TRANSACTIONS}`);
      log(`FinanceContext: Storage key exists: ${!!storedTransactions}`);
      
      if (storedTransactions) {
        try {
          const parsedTransactions = JSON.parse(storedTransactions);
          log(`FinanceContext: Parsed ${parsedTransactions.length} transactions from storage`);
          
          if (Array.isArray(parsedTransactions)) {
            // Validate and clean data
            const validTransactions =
              parsedTransactions.filter(validateTransaction);
            log(
              `FinanceContext: Loaded ${validTransactions.length} valid transactions (${parsedTransactions.length - validTransactions.length} invalid filtered out)`
            );
            
            // Log transaction details for debugging
            if (validTransactions.length > 0) {
              log('FinanceContext: Sample transactions:', validTransactions.slice(0, 3).map(t => ({
                name: t.name,
                type: t.type,
                amount: t.amount,
                date: t.date
              })));
            }
            
            setTransactions(validTransactions);

            // If some transactions were invalid, save the cleaned data
            if (validTransactions.length !== parsedTransactions.length) {
              log(
                'FinanceContext: Cleaned invalid transactions, saving updated data'
              );
              await saveTransactions(validTransactions);
            }
          } else {
            warn(
              'FinanceContext: Stored transactions is not an array, resetting to empty'
            );
            setTransactions([]);
          }
        } catch (parseError) {
          logError(
            'FinanceContext: Error parsing stored transactions:',
            parseError
          );
          // Try to recover from backup
          await recoverFromBackup();
        }
      } else {
        log(
          `FinanceContext: No stored transactions found at key ${STORAGE_KEYS.TRANSACTIONS}, starting fresh`
        );
        setTransactions([]);
      }
      
      // Get the current transaction count from state for logging
      // We'll use transactions.length in the calculations which reads from state
      const transactionCount = transactions.length;
      
      // Ensure calculations run before marking as loaded
      // Use setTimeout to ensure state has updated
      setTimeout(() => {
        // Use transactions from state (via closure) - it will have the updated value
        log(`FinanceContext: Running calculations for transactions`);
        calculateWeeklyOverview();
        calculateMonthlyInsights();
        calculateBudget();
        setIsLoading(false);
        log('FinanceContext: Calculations completed, loading state cleared');
      }, 100); // Increased delay to ensure state is fully updated
    } catch (error) {
      logError('FinanceContext: Error loading financial data:', error);
      // Try to recover from backup
      await recoverFromBackup();
      // Even on error, ensure loading state is cleared
      setTimeout(() => {
        calculateWeeklyOverview();
        calculateMonthlyInsights();
        calculateBudget();
        setIsLoading(false);
      }, 0);
    }
  };

  const recoverFromBackup = async () => {
    try {
      log('FinanceContext: Attempting to recover from backup...');
      const backupData = await AsyncStorage.getItem('finance_auto_backup');
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        if (
          parsedBackup.transactions &&
          Array.isArray(parsedBackup.transactions)
        ) {
          const validTransactions =
            parsedBackup.transactions.filter(validateTransaction);
          log(
            `FinanceContext: Recovered ${validTransactions.length} transactions from backup`
          );
          setTransactions(validTransactions);
          await saveTransactions(validTransactions);
          return;
        }
      }
      log(
        'FinanceContext: No valid backup found, starting with empty data'
      );
      setTransactions([]);
    } catch (error) {
      logError('FinanceContext: Error recovering from backup:', error);
      setTransactions([]);
    }
  };

  const validateTransaction = (
    transaction: any
  ): transaction is Transaction => {
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
      console.log(`[SETUP DEBUG] saveTransactions called with ${newTransactions.length} transactions`);
      console.log(`[SETUP DEBUG] Using storage key: ${STORAGE_KEYS.TRANSACTIONS}`);
      console.log(`[SETUP DEBUG] UserId in context: ${userId}`);
      log(`FinanceContext: saveTransactions called with ${newTransactions.length} transactions`);
      log(`FinanceContext: Using storage key: ${STORAGE_KEYS.TRANSACTIONS}`);
      
      if (!newTransactions || newTransactions.length === 0) {
        console.warn('[SETUP DEBUG] Warning - Attempting to save empty transactions array');
        log('FinanceContext: Warning - Attempting to save empty transactions array');
      }
      
      const dataToSave = JSON.stringify(newTransactions);
      console.log(`[SETUP DEBUG] Data to save size: ${dataToSave.length} bytes`);
      log(`FinanceContext: Data to save size: ${dataToSave.length} bytes`);
      
      // Save to storage
      console.log(`[SETUP DEBUG] Calling AsyncStorage.setItem with key: ${STORAGE_KEYS.TRANSACTIONS}`);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, dataToSave);
      console.log('[SETUP DEBUG] AsyncStorage.setItem completed');
      log('FinanceContext: AsyncStorage.setItem completed');
      
      // Immediately verify the save
      console.log(`[SETUP DEBUG] Verifying save with key: ${STORAGE_KEYS.TRANSACTIONS}`);
      const verification = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      console.log(`[SETUP DEBUG] Verification result: ${verification ? 'Found data' : 'NO DATA FOUND'}`);
      
      if (!verification) {
        const error = new Error('Save verification failed - data not found in storage after save');
        console.error(`[SETUP DEBUG] Save verification FAILED - no data found`);
        console.error(`[SETUP DEBUG] Storage key used: ${STORAGE_KEYS.TRANSACTIONS}`);
        // Debug: List all keys to see what's in storage
        const allKeys = await AsyncStorage.getAllKeys();
        console.log(`[SETUP DEBUG] All storage keys:`, allKeys.filter(k => k.includes('finance') || k.includes('transaction')));
        logError('FinanceContext: Save verification failed', error);
        logError(`FinanceContext: Storage key: ${STORAGE_KEYS.TRANSACTIONS}`);
        throw error;
      }
      
      const parsed = JSON.parse(verification);
      console.log(`[SETUP DEBUG] Parsed ${parsed.length} transactions from verification`);
      
      if (!Array.isArray(parsed)) {
        const error = new Error('Save verification failed - data is not an array');
        console.error('[SETUP DEBUG] Save verification FAILED - data is not an array');
        logError('FinanceContext: Save verification failed', error);
        throw error;
      }
      
      if (parsed.length !== newTransactions.length) {
        const error = new Error(`Save verification failed - expected ${newTransactions.length} transactions, found ${parsed.length}`);
        console.error(`[SETUP DEBUG] Save verification FAILED - count mismatch: expected ${newTransactions.length}, found ${parsed.length}`);
        logError('FinanceContext: Save verification failed', error);
        logError(`FinanceContext: Expected: ${newTransactions.length}, Found: ${parsed.length}`);
        throw error;
      }
      
      console.log(`[SETUP DEBUG] Successfully saved and verified ${newTransactions.length} transactions`);
      log(
        `FinanceContext: Successfully saved and verified ${newTransactions.length} transactions to storage`
      );
    } catch (error) {
      logError('FinanceContext: Error saving transactions:', error);
      logError(`FinanceContext: Storage key: ${STORAGE_KEYS.TRANSACTIONS}`);
      logError(`FinanceContext: Transaction count: ${newTransactions.length}`);
      // Re-throw the error so callers know the save failed
      throw error;
    }
  };

  const calculateWeeklyOverview = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    log(`FinanceContext: calculateWeeklyOverview called with ${transactions.length} transactions`);
    
    // Debug: Log all income transactions (dev only)
    const allIncomeTransactions = transactions.filter(t => t.type === 'income');
    log(`FinanceContext: Found ${allIncomeTransactions.length} income transactions:`, allIncomeTransactions.map(t => ({
      name: t.name,
      amount: t.amount,
      date: t.date,
      isRecurring: t.isRecurring,
      hasPaySchedule: !!t.paySchedule
    })));

    // Get current pay period
    const currentPayPeriod = getCurrentPayPeriod(transactions);
    log('FinanceContext: Current pay period:', currentPayPeriod ? {
      startDate: currentPayPeriod.startDate.toISOString(),
      endDate: currentPayPeriod.endDate.toISOString(),
      isActive: currentPayPeriod.isActive
    } : 'null');

    let periodIncome = 0;
    let periodStartDate: Date;
    let periodEndDate: Date;

    if (currentPayPeriod) {
      periodStartDate = currentPayPeriod.startDate;
      periodEndDate = currentPayPeriod.endDate;

      log(
        'FinanceContext: Pay period dates:',
        periodStartDate.toDateString(),
        'to',
        periodEndDate.toDateString()
      );

      // Calculate income for the pay period using actual pay dates from pay schedules
      const allIncomeTransactions = transactions.filter(t => t.type === 'income');
      
      log('FinanceContext: Calculating pay period income for period:', periodStartDate.toDateString(), 'to', periodEndDate.toDateString());
      
      periodIncome = allIncomeTransactions.reduce((sum, income) => {
        // For recurring income with pay schedules, calculate actual pay dates in the period
        if (income.isRecurring && income.paySchedule) {
          const payDates = getPayDatesInRange(
            income.paySchedule,
            periodStartDate,
            periodEndDate
          );
          const incomeAmount = payDates.length * income.amount;
          log(
            `FinanceContext: Recurring income ${income.name}: ${payDates.length} occurrence(s) in period × $${income.amount} = $${incomeAmount.toFixed(2)}`
          );
          return sum + incomeAmount;
        } else if (income.isRecurring && !income.paySchedule) {
          // Legacy recurring income without pay schedule - check if transaction date falls within period
          const transactionDate = new Date(income.date);
          transactionDate.setHours(0, 0, 0, 0);
          const isInPeriod =
            transactionDate >= periodStartDate &&
            transactionDate <= periodEndDate;
          
          if (isInPeriod) {
            log(
              `FinanceContext: Legacy recurring income ${income.name}: $${income.amount} (date: ${transactionDate.toDateString()})`
            );
            return sum + income.amount;
          }
        } else {
          // For non-recurring income, check if the transaction date falls within the pay period
          const transactionDate = new Date(income.date);
          transactionDate.setHours(0, 0, 0, 0);
          const isInPeriod =
            transactionDate >= periodStartDate &&
            transactionDate <= periodEndDate;
          
          if (isInPeriod) {
            log(
              `FinanceContext: Non-recurring income ${income.name}: $${income.amount} (date: ${transactionDate.toDateString()})`
            );
            return sum + income.amount;
          }
        }
        return sum;
      }, 0);
      
      log('FinanceContext: Total pay period income calculated:', periodIncome.toFixed(2));
    } else {
      // Fallback to weekly calculation if no pay period found
      periodStartDate = new Date(today);
      periodStartDate.setDate(today.getDate() - today.getDay());
      periodEndDate = new Date(periodStartDate);
      periodEndDate.setDate(periodStartDate.getDate() + 6);
      periodEndDate.setHours(23, 59, 59, 999);
      
      // Calculate income for the weekly fallback period
      const weeklyIncomeTransactions = transactions.filter(t => t.type === 'income');
      periodIncome = weeklyIncomeTransactions.reduce((sum, income) => {
        // For recurring income with pay schedules, calculate actual pay dates in the period
        if (income.isRecurring && income.paySchedule) {
          const payDates = getPayDatesInRange(
            income.paySchedule,
            periodStartDate,
            periodEndDate
          );
          return sum + (payDates.length * income.amount);
        } else if (income.isRecurring && !income.paySchedule) {
          // Legacy recurring income without pay schedule - check if transaction date falls within period
          const transactionDate = new Date(income.date);
          transactionDate.setHours(0, 0, 0, 0);
          const isInPeriod =
            transactionDate >= periodStartDate &&
            transactionDate <= periodEndDate;
          
          if (isInPeriod) {
            return sum + income.amount;
          }
        } else {
          // For non-recurring income, check if the transaction date falls within the pay period
          const transactionDate = new Date(income.date);
          transactionDate.setHours(0, 0, 0, 0);
          const isInPeriod =
            transactionDate >= periodStartDate &&
            transactionDate <= periodEndDate;
          
          if (isInPeriod) {
            return sum + income.amount;
          }
        }
        return sum;
      }, 0);
      
      log('FinanceContext: Weekly fallback period income calculated:', periodIncome.toFixed(2));
    }

    // Get all expense transactions and resolve their dates to the current pay period
    const resolvedExpenses = transactions
      .filter(t => t.type === 'expense')
      .map(t => {
        let resolvedDate = new Date(t.date);

        // Handle given expenses with schedule
        if (t.category === 'given_expenses' && t.givenExpenseSchedule && currentPayPeriod) {
          const periodStart = new Date(periodStartDate);
          const periodEnd = new Date(periodEndDate);
          
          // Calculate the date for this given expense within the pay period
          const payPeriodDate = getGivenExpenseDateForPayPeriod(
            t.givenExpenseSchedule,
            periodStart,
            periodEnd
          );
          
          if (payPeriodDate) {
            resolvedDate = payPeriodDate;
          } else {
            // If no date in pay period, calculate next occurrence
            resolvedDate = calculateNextGivenExpenseDate(t.givenExpenseSchedule);
          }
        }
        // If this is a non-recurring expense, try to resolve it to the current pay period
        else if (!t.isRecurring && currentPayPeriod) {
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
          const validCandidates = candidates.filter(
            date => date >= periodStart && date <= periodEnd
          );

          if (validCandidates.length > 0) {
            // Use the first valid candidate (closest to pay period start)
            resolvedDate = validCandidates[0];
          }
          // If no valid candidates, keep the original date
        }

        return {
          ...t,
          resolvedDate,
        };
      })
      .filter(t => {
        // Only include expenses that fall within the current pay period
        // For given expenses, include them if they have a date in or near the period
        if (t.category === 'given_expenses' && t.givenExpenseSchedule) {
          // Include if within pay period or within next 30 days (for display)
          const thirtyDaysFromPeriodEnd = new Date(periodEndDate);
          thirtyDaysFromPeriodEnd.setDate(thirtyDaysFromPeriodEnd.getDate() + 30);
          return t.resolvedDate >= periodStartDate && t.resolvedDate <= thirtyDaysFromPeriodEnd;
        }
        return (
          t.resolvedDate >= periodStartDate && t.resolvedDate <= periodEndDate
        );
      });

    // Calculate upcoming expenses (future transactions in this period, including today)
    // Limit to next 30 days and sort by closest date
    const upcomingExpenses = filterAndSortBySmartDateLimits(
      resolvedExpenses
        .filter(t => {
          // Include today's date as upcoming, not past
          const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const expenseDateStart = new Date(
            t.resolvedDate.getFullYear(),
            t.resolvedDate.getMonth(),
            t.resolvedDate.getDate()
          );
          return expenseDateStart >= todayStart;
        })
        .map(t => ({ ...t, date: t.resolvedDate.toISOString() })), // Update the date to resolved date
      today
    );

    // Calculate past expenses for display (last 7 days, regardless of pay period)
    const pastExpenseTransactions = filterAndSortBySmartDateLimits(
      transactions
        .filter(t => {
          // Only include expenses (not income)
          if (t.type !== 'expense') return false;
          
          // Exclude today's date from past expenses
          const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const expenseDateStart = new Date(t.date);
          expenseDateStart.setHours(0, 0, 0, 0);
          return expenseDateStart < todayStart;
        })
        .map(t => ({ ...t, date: t.date })), // Keep original date string for past expenses
      today
    );

    // Calculate past expenses within current pay period for remaining balance calculation
    const pastExpensesInPeriod = resolvedExpenses
      .filter(t => {
        // Exclude today's date from past expenses
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const expenseDateStart = new Date(t.resolvedDate);
        expenseDateStart.setHours(0, 0, 0, 0);
        return expenseDateStart < todayStart;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate remaining balance
    const totalUpcomingExpenses = upcomingExpenses.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const remainingBalance =
      periodIncome - pastExpensesInPeriod - totalUpcomingExpenses;

    // Calculate utilization
    const totalPeriodExpenses = pastExpensesInPeriod + totalUpcomingExpenses;
    const utilization =
      periodIncome > 0
        ? Math.min((totalPeriodExpenses / periodIncome) * 100, 100)
        : 0;

    // Calculate contributions by category (all expenses in pay period)
    const contributions: Record<
      CategoryType,
      { total: number; count: number }
    > = {} as any;

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
      insights.push(
        `Your top spending category is ${topCategory.name} at $${topAmount.toFixed(2)}`
      );
    }

    // Add spending trend insights
    if (monthTransactions.length > 0) {
      const avgDailySpend = totalSpent / new Date().getDate();
      if (avgDailySpend > 50) {
        insights.push(
          `You're spending an average of $${avgDailySpend.toFixed(2)} per day`
        );
      }
    }

    // Add pay schedule insights
    const incomeTransactions = transactions.filter(
      t => t.type === 'income' && t.paySchedule
    );
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
    const incomeTransactions = transactions.filter(
      t => t.type === 'income' && t.isRecurring
    );

    incomeTransactions.forEach(transaction => {
      if (transaction.paySchedule) {
        // Use new pay schedule system
        const payDates = getPayDatesInRange(
          transaction.paySchedule,
          startOfMonth,
          endOfMonth
        );
        monthlyIncome += payDates.length * transaction.amount;
      } else {
        // Legacy system - assume monthly
        monthlyIncome += transaction.amount;
      }
    });

    // Calculate recurring expenses for current month (excluding given expenses which are handled separately)
    let recurringExpenses = 0;
    const recurringExpenseTransactions = transactions.filter(
      t =>
        t.type === 'expense' &&
        t.isRecurring &&
        t.category !== 'given_expenses'
    );

    recurringExpenseTransactions.forEach(transaction => {
      if (transaction.paySchedule) {
        // Use pay schedule to calculate how many times this expense occurs in current month
        const payDates = getPayDatesInRange(
          transaction.paySchedule,
          startOfMonth,
          endOfMonth
        );
        recurringExpenses += payDates.length * transaction.amount;
      } else {
        // For recurring expenses without pay schedule, check if they fall in current month
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= startOfMonth && transactionDate <= endOfMonth) {
          recurringExpenses += transaction.amount;
        }
      }
    });

    // Calculate one-time expenses for current month
    const oneTimeExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          !t.isRecurring &&
          t.category === 'one_time_expense' &&
          transactionDate >= startOfMonth &&
          transactionDate <= endOfMonth
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate given expenses based on their frequency schedule
    let givenExpenses = 0;
    const givenExpenseTransactions = transactions.filter(
      t => t.type === 'expense' && t.category === 'given_expenses'
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

    // Calculate savings expenses for current month
    // Handle both recurring savings with pay schedules and one-time savings
    let savingsExpenses = 0;
    const savingsTransactions = transactions.filter(
      t => t.type === 'expense' && t.category === 'savings'
    );

    savingsTransactions.forEach(transaction => {
      if (transaction.isRecurring && transaction.paySchedule) {
        // For recurring savings with pay schedule, calculate actual pay dates in the current month
        const payDates = getPayDatesInRange(
          transaction.paySchedule,
          startOfMonth,
          endOfMonth
        );
        savingsExpenses += payDates.length * transaction.amount;
      } else {
        // For one-time savings or recurring savings without pay schedule, check if date falls in current month
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= startOfMonth && transactionDate <= endOfMonth) {
          savingsExpenses += transaction.amount;
        }
      }
    });

    // Debug logging for budget calculations (dev only)
    log('FinanceContext: Budget calculation for current month:', {
      month: `${startOfMonth.toDateString()} to ${endOfMonth.toDateString()}`,
      monthlyIncome: monthlyIncome.toFixed(2),
      recurringExpenses: recurringExpenses.toFixed(2),
      oneTimeExpenses: oneTimeExpenses.toFixed(2),
      givenExpenses: givenExpenses.toFixed(2),
      savingsExpenses: savingsExpenses.toFixed(2),
      totalExpenses: (recurringExpenses + oneTimeExpenses + givenExpenses + savingsExpenses).toFixed(2)
    });

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
    try {
      log('FinanceContext: Adding transaction', transaction);

      // Generate a UUID-compliant ID for database compatibility
      const uniqueId = generateUUID();
      
      const newTransaction: Transaction = {
        ...transaction,
        id: uniqueId,
      };

      log('FinanceContext: Generated transaction ID:', uniqueId);

      // Use functional update to ensure we have the latest state
      let updatedTransactions: Transaction[] = [];
      setTransactions(prevTransactions => {
        updatedTransactions = [...prevTransactions, newTransaction];
        log('FinanceContext: Current transactions count:', prevTransactions.length);
        log('FinanceContext: New transactions count:', updatedTransactions.length);
        return updatedTransactions;
      });

      // Save to storage (await to ensure it completes)
      console.log(`[SETUP DEBUG] FinanceContext: Saving ${updatedTransactions.length} transactions to storage key: ${STORAGE_KEYS.TRANSACTIONS}`);
      console.log(`[SETUP DEBUG] FinanceContext: UserId: ${userId}`);
      console.log(`[SETUP DEBUG] FinanceContext: Storage key should be: finance_transactions_v2_${userId}`);
      log(`FinanceContext: Saving ${updatedTransactions.length} transactions to storage key: ${STORAGE_KEYS.TRANSACTIONS}`);
      await saveTransactions(updatedTransactions);
      console.log('[SETUP DEBUG] FinanceContext: Save completed, verifying...');
      log('FinanceContext: Save completed, verifying...');
      
      // Verify the save was successful immediately
      const savedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTransactions) {
        const parsed = JSON.parse(savedTransactions);
        log(`FinanceContext: Storage verification - saved ${parsed.length} transactions (expected ${updatedTransactions.length})`);
        if (parsed.length !== updatedTransactions.length) {
          warn('FinanceContext: Storage count mismatch! Expected:', updatedTransactions.length, 'Storage:', parsed.length);
          // Try to save again if there's a mismatch
          log('FinanceContext: Retrying save due to count mismatch...');
          await saveTransactions(updatedTransactions);
        }
      } else {
        logError('FinanceContext: CRITICAL - Save verification failed! No data found in storage after save.');
        logError(`FinanceContext: Storage key used: ${STORAGE_KEYS.TRANSACTIONS}`);
        // Try to save again
        log('FinanceContext: Retrying save...');
        await saveTransactions(updatedTransactions);
      }
      
      // Sync to cloud (non-blocking, but log errors)
      const syncService = new SyncService(userId);
      syncService.syncTransactionToCloud(newTransaction).catch(error => {
        logError('FinanceContext: Error syncing to cloud:', error);
      });

      log('FinanceContext: Transaction added successfully. New count:', updatedTransactions.length);
    } catch (error) {
      logError('FinanceContext: Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ) => {
    try {
      const transactionToUpdate = transactions.find(t => t.id === id);
      if (!transactionToUpdate) {
        warn('FinanceContext: Transaction not found for update:', id);
        return;
      }

      const updatedTransaction = { ...transactionToUpdate, ...updates };
      const updatedTransactions = transactions.map(t =>
        t.id === id ? updatedTransaction : t
      );

      // Update state immediately for real-time sync
      setTransactions(updatedTransactions);

      // Save to storage (local first)
      await saveTransactions(updatedTransactions);
      
      // Sync to cloud
      const syncService = new SyncService(userId);
      await syncService.syncTransactionToCloud(updatedTransaction);
      
      log('FinanceContext: Transaction updated successfully');
    } catch (error) {
      logError('FinanceContext: Error updating transaction:', error);
      // Revert state on error
      setTransactions(transactions);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const updatedTransactions = transactions.filter(t => t.id !== id);

      // Update state immediately for real-time sync
      setTransactions(updatedTransactions);

      // Save to storage (local first)
      await saveTransactions(updatedTransactions);
      
      // Delete from cloud
      const syncService = new SyncService(userId);
      await syncService.deleteTransactionFromCloud(id);
      
      log('FinanceContext: Transaction deleted successfully');
    } catch (error) {
      logError('FinanceContext: Error deleting transaction:', error);
      // Revert state on error
      setTransactions(transactions);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      log('FinanceContext: Clearing all data...');
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.BUDGET_GOALS,
        STORAGE_KEYS.LAST_BACKUP,
        STORAGE_KEYS.MILESTONES,
        STORAGE_KEYS.PLANNING_STREAK,
        'finance_auto_backup',
      ]);
      setTransactions([]);
      setMilestones([]);
      log('FinanceContext: All data cleared successfully');
    } catch (error) {
      logError('FinanceContext: Error clearing financial data:', error);
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
      log(
        `FinanceContext: Exporting ${transactions.length} transactions`
      );
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      logError('FinanceContext: Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  };

  const importData = async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
        const validTransactions =
          parsedData.transactions.filter(validateTransaction);
        log(
          `FinanceContext: Importing ${validTransactions.length} valid transactions`
        );
        setTransactions(validTransactions);
        await saveTransactions(validTransactions);
      } else {
        throw new Error('Invalid data format - no transactions array found');
      }
    } catch (error) {
      logError('FinanceContext: Error importing data:', error);
      throw new Error(
        'Failed to import data - invalid format or corrupted data'
      );
    }
  };

  const autoBackup = async () => {
    try {
      const lastBackup = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
      const now = new Date();
      const lastBackupDate = lastBackup ? new Date(lastBackup) : null;

      // Auto-backup once per day or if no backup exists
      if (
        !lastBackupDate ||
        now.getTime() - lastBackupDate.getTime() > 24 * 60 * 60 * 1000
      ) {
        const backupData = await exportData();
        await AsyncStorage.setItem('finance_auto_backup', backupData);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now.toISOString());
        log('FinanceContext: Auto-backup completed');
      }
    } catch (error) {
      logError('FinanceContext: Auto-backup failed:', error);
      // Don't throw error for backup failures - it's not critical
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
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
  return context;
}
