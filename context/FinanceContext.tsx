import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, WeeklyOverview, MonthlyInsights, Budget, CategoryType } from '@/types/finance';
import categories from '@/constants/categories';
import { getPayDatesInRange, getWeeklyIncomeAmount, formatPaySchedule } from '@/utils/payScheduleUtils';
import { getCurrentPayPeriod } from '@/utils/payPeriodUtils';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  weeklyOverview: WeeklyOverview;
  monthlyInsights: MonthlyInsights;
  budget: Budget;
  isLoading: boolean;
  clearAllData: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance_transactions_v2',
  BUDGET_GOALS: 'finance_budget_goals_v2',
  LAST_BACKUP: 'finance_last_backup_v2',
  APP_VERSION: 'finance_app_version',
} as const;

const CURRENT_APP_VERSION = '2.0.0';

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverview>({
    weekIncome: 0,
    remainingBalance: 0,
    utilization: 0,
    contributions: {},
    upcomingExpenses: [],
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

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Calculate insights whenever transactions change
  useEffect(() => {
    if (!isLoading) {
      calculateWeeklyOverview();
      calculateMonthlyInsights();
      calculateBudget();
      // Auto-backup every time data changes
      autoBackup();
    }
  }, [transactions, isLoading]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      console.log('FinanceContext: Loading data from storage...');
      
      // Check app version for migration if needed
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      if (!storedVersion) {
        // First time app launch, set version
        await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, CURRENT_APP_VERSION);
        console.log('FinanceContext: First app launch, version set to', CURRENT_APP_VERSION);
      }
      
      // Load transactions with error recovery
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTransactions) {
        try {
          const parsedTransactions = JSON.parse(storedTransactions);
          if (Array.isArray(parsedTransactions)) {
            // Validate and clean data
            const validTransactions = parsedTransactions.filter(validateTransaction);
            console.log(`FinanceContext: Loaded ${validTransactions.length} valid transactions`);
            setTransactions(validTransactions);
            
            // If some transactions were invalid, save the cleaned data
            if (validTransactions.length !== parsedTransactions.length) {
              console.log('FinanceContext: Cleaned invalid transactions, saving updated data');
              await saveTransactions(validTransactions);
            }
          } else {
            console.warn('FinanceContext: Stored transactions is not an array, resetting to empty');
            setTransactions([]);
          }
        } catch (parseError) {
          console.error('FinanceContext: Error parsing stored transactions:', parseError);
          // Try to recover from backup
          await recoverFromBackup();
        }
      } else {
        console.log('FinanceContext: No stored transactions found, starting fresh');
        setTransactions([]);
      }
    } catch (error) {
      console.error('FinanceContext: Error loading financial data:', error);
      // Try to recover from backup
      await recoverFromBackup();
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
      const dataToSave = JSON.stringify(newTransactions);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, dataToSave);
      console.log(`FinanceContext: Saved ${newTransactions.length} transactions to storage`);
    } catch (error) {
      console.error('FinanceContext: Error saving transactions:', error);
      throw new Error('Failed to save transaction data');
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
      periodIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      console.log('FinanceContext: Total period income:', periodIncome);
    } else {
      // Fallback to weekly calculation if no pay period found
      periodStartDate = new Date(today);
      periodStartDate.setDate(today.getDate() - today.getDay());
      periodEndDate = new Date(periodStartDate);
      periodEndDate.setDate(periodStartDate.getDate() + 6);
      periodEndDate.setHours(23, 59, 59, 999);
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
    const pastExpenses = resolvedExpenses
      .filter(t => t.resolvedDate <= today)
      .reduce((sum, t) => sum + t.amount, 0);

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

    // Calculate recurring expenses
    const recurringExpenses = transactions
      .filter(t => t.type === 'expense' && t.isRecurring)
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

    const givenExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && 
               !t.isRecurring && 
               t.category === 'given_expenses' &&
               transactionDate >= startOfMonth && 
               transactionDate <= endOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && 
               t.category === 'savings' &&
               transactionDate >= startOfMonth && 
               transactionDate <= endOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

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
      console.log('FinanceContext: Adding transaction', transaction);
      
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };

      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      await saveTransactions(updatedTransactions);
      
      console.log('FinanceContext: Transaction added successfully');
    } catch (error) {
      console.error('FinanceContext: Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updatedTransactions = transactions.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      setTransactions(updatedTransactions);
      await saveTransactions(updatedTransactions);
      console.log('FinanceContext: Transaction updated successfully');
    } catch (error) {
      console.error('FinanceContext: Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      await saveTransactions(updatedTransactions);
      console.log('FinanceContext: Transaction deleted successfully');
    } catch (error) {
      console.error('FinanceContext: Error deleting transaction:', error);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      console.log('FinanceContext: Clearing all data...');
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.BUDGET_GOALS,
        STORAGE_KEYS.LAST_BACKUP,
        'finance_auto_backup',
      ]);
      setTransactions([]);
      console.log('FinanceContext: All data cleared successfully');
    } catch (error) {
      console.error('FinanceContext: Error clearing financial data:', error);
      throw new Error('Failed to clear data');
    }
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
        isLoading,
        clearAllData,
        exportData,
        importData,
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