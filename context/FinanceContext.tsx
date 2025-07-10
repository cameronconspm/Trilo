import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, WeeklyOverview, MonthlyInsights, Budget, CategoryType } from '@/types/finance';
import categories from '@/constants/categories';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  weeklyOverview: WeeklyOverview;
  monthlyInsights: MonthlyInsights;
  budget: Budget;
  isLoading: boolean;
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
          setTransactions(JSON.parse(storedTransactions));
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
    calculateWeeklyOverview();
    calculateMonthlyInsights();
    calculateBudget();
  }, [transactions]);

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

    // Calculate upcoming expenses
    const upcomingExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate > today && transactionDate <= endOfWeek && t.type === 'expense';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate remaining balance
    const totalExpenses = upcomingExpenses.reduce((sum, t) => sum + t.amount, 0);
    const remainingBalance = weekIncome - totalExpenses;

    // Calculate utilization
    const utilization = weekIncome > 0 ? Math.min((totalExpenses / weekIncome) * 100, 100) : 0;

    // Calculate contributions by category
    const contributions: Record<CategoryType, { total: number; count: number }> = {} as any;
    
    weekTransactions
      .filter(t => t.type === 'expense')
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

    let topCategory = categories[0];
    let topAmount = 0;

    Object.entries(spendingByCategory).forEach(([categoryId, amount]) => {
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = categories.find(c => c.id === categoryId) || categories[0];
      }
    });

    // Get recent transactions
    const recentTransactions = [...transactions]
      .filter(t => new Date(t.date) <= today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

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

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    
    // Save to AsyncStorage
    AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions))
      .catch(error => console.error('Error saving transaction:', error));
  };

  const deleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    
    // Save to AsyncStorage
    AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions))
      .catch(error => console.error('Error deleting transaction:', error));
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        weeklyOverview,
        monthlyInsights,
        budget,
        isLoading,
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