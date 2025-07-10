import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, WeeklyOverview, MonthlyInsights, Budget, CategoryType } from '@/types/finance';
import categories from '@/constants/categories';
import { calculateIncomeDate, formatWeekAndDay } from '@/utils/dateUtils';

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
  TRANSACTIONS: 'finance_transactions',
  BUDGET_GOALS: 'finance_budget_goals',
  LAST_BACKUP: 'finance_last_backup',
} as const;

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverview>({
    weekIncome: 0,
    remainingBalance: 0,
    utilization: 0,
    contributions: {},
    upcomingExpenses: [],
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
      
      // Load transactions
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        // Validate and clean data
        const validTransactions = parsedTransactions.filter(validateTransaction);
        setTransactions(validTransactions);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      // Could show user-friendly error message here
    } finally {
      setIsLoading(false);
    }
  };

  const validateTransaction = (transaction: any): transaction is Transaction => {
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
      categories.some(cat => cat.id === transaction.category)
    );
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw new Error('Failed to save transaction data');
    }
  };

  const calculateWeeklyOverview = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Filter transactions for current week
    const weekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
    });

    // Calculate week income
    const weekIncome = weekTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate upcoming expenses (future transactions this week)
    const upcomingExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate > today && transactionDate <= endOfWeek && t.type === 'expense';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate past expenses this week
    const pastExpenses = weekTransactions
      .filter(t => t.type === 'expense' && new Date(t.date) <= today)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate remaining balance
    const totalUpcomingExpenses = upcomingExpenses.reduce((sum, t) => sum + t.amount, 0);
    const remainingBalance = weekIncome - pastExpenses - totalUpcomingExpenses;

    // Calculate utilization
    const totalWeekExpenses = pastExpenses + totalUpcomingExpenses;
    const utilization = weekIncome > 0 ? Math.min((totalWeekExpenses / weekIncome) * 100, 100) : 0;

    // Calculate contributions by category (past expenses only)
    const contributions: Record<CategoryType, { total: number; count: number }> = {} as any;
    
    weekTransactions
      .filter(t => t.type === 'expense' && new Date(t.date) <= today)
      .forEach(t => {
        if (!contributions[t.category]) {
          contributions[t.category] = { total: 0, count: 0 };
        }
        contributions[t.category].total += t.amount;
        contributions[t.category].count += 1;
      });

    setWeeklyOverview({
      weekIncome,
      remainingBalance,
      utilization,
      contributions,
      upcomingExpenses,
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

    // Calculate total spent
    const totalSpent = monthTransactions
      .filter(t => t.type === 'expense' && t.category !== 'savings')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate total saved
    const totalSaved = monthTransactions
      .filter(t => t.category === 'savings')
      .reduce((sum, t) => sum + t.amount, 0);

    // Find top spending category
    const spendingByCategory: Record<CategoryType, number> = {} as any;
    
    monthTransactions
      .filter(t => t.type === 'expense' && t.category !== 'savings')
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
    
    if (totalSaved > 0) {
      insights.push(`Great job saving $${totalSaved.toFixed(2)} this month!`);
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

    // Add savings rate insight
    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (monthIncome > 0 && totalSaved > 0) {
      const savingsRate = (totalSaved / monthIncome) * 100;
      insights.push(`You're saving ${savingsRate.toFixed(1)}% of your income`);
    }

    // Add weekly income insights
    const weeklyIncomeTransactions = monthTransactions.filter(t => 
      t.type === 'income' && t.weekDay && t.weekNumber
    );
    
    if (weeklyIncomeTransactions.length > 0) {
      const incomeSchedules = weeklyIncomeTransactions.map(t => 
        formatWeekAndDay(t.weekNumber!, t.weekDay!)
      );
      insights.push(`Income scheduled for: ${incomeSchedules.join(', ')}`);
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
    // Calculate monthly income from recurring income transactions
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && t.isRecurring)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate recurring expenses
    const recurringExpenses = transactions
      .filter(t => t.type === 'expense' && t.isRecurring)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate one-time expenses for current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const oneTimeExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && 
               !t.isRecurring && 
               (t.category === 'miscellaneous' || t.category === 'wants') &&
               transactionDate >= startOfMonth && 
               transactionDate <= endOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const givenExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && 
               !t.isRecurring && 
               t.category !== 'miscellaneous' &&
               t.category !== 'wants' &&
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
      },
    });
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updatedTransactions = transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);
  };

  const deleteTransaction = async (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.BUDGET_GOALS,
        STORAGE_KEYS.LAST_BACKUP,
      ]);
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing financial data:', error);
      throw new Error('Failed to clear data');
    }
  };

  const exportData = async (): Promise<string> => {
    try {
      const exportData = {
        transactions,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  };

  const importData = async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
        const validTransactions = parsedData.transactions.filter(validateTransaction);
        setTransactions(validTransactions);
        await saveTransactions(validTransactions);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  };

  const autoBackup = async () => {
    try {
      const lastBackup = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
      const now = new Date();
      const lastBackupDate = lastBackup ? new Date(lastBackup) : null;
      
      // Auto-backup once per day
      if (!lastBackupDate || now.getTime() - lastBackupDate.getTime() > 24 * 60 * 60 * 1000) {
        const backupData = await exportData();
        await AsyncStorage.setItem('finance_auto_backup', backupData);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now.toISOString());
      }
    } catch (error) {
      console.error('Auto-backup failed:', error);
      // Don't throw error for backup failures
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