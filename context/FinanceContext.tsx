import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, WeeklyOverview, MonthlyInsights, Budget, CategoryType } from '@/types/finance';
import categories from '@/constants/categories';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  weeklyOverview: WeeklyOverview;
  monthlyInsights: MonthlyInsights;
  budget: Budget;
  isLoading: boolean;
  clearAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

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
    const loadData = async () => {
      try {
        setIsLoading(true);
        const storedTransactions = await AsyncStorage.getItem('transactions');
        if (storedTransactions) {
          const parsedTransactions = JSON.parse(storedTransactions);
          setTransactions(parsedTransactions);
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate weekly overview whenever transactions change
  useEffect(() => {
    if (!isLoading) {
      calculateWeeklyOverview();
      calculateMonthlyInsights();
      calculateBudget();
    }
  }, [transactions, isLoading]);

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
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updatedTransactions = transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    setTransactions(updatedTransactions);
    
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem('transactions');
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
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