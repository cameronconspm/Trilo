import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { Transaction, Budget, CategoryType } from '@/types/finance';
import categories from '@/constants/categories';

interface BudgetContextType {
  budget: Budget;
  calculateBudget: (transactions: Transaction[]) => Budget;
  getBudgetUtilization: () => number;
  getRemainingIncome: () => number;
}

const DEFAULT_CONTEXT_VALUE: BudgetContextType = {
  budget: {
    income: 0,
    expenses: {
      given: 0,
      oneTime: 0,
      recurring: 0,
      savings: 0,
    },
  },
  calculateBudget: () => ({
    income: 0,
    expenses: {
      given: 0,
      oneTime: 0,
      recurring: 0,
      savings: 0,
    },
  }),
  getBudgetUtilization: () => 0,
  getRemainingIncome: () => 0,
};

const BudgetContext = createContext<BudgetContextType>(DEFAULT_CONTEXT_VALUE);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budget, setBudget] = useState<Budget>({
    income: 0,
    expenses: {
      given: 0,
      oneTime: 0,
      recurring: 0,
      savings: 0,
    },
  });

  const calculateBudget = (transactions: Transaction[]): Budget => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    // Calculate income
    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate expenses by category
    const expenses = {
      given: 0,
      oneTime: 0,
      recurring: 0,
      savings: 0,
    };

    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (t.category === 'given_expenses') {
          expenses.given += t.amount;
        } else if (t.category === 'one_time_expense' && !t.isRecurring) {
          expenses.oneTime += t.amount;
        } else if (t.isRecurring) {
          expenses.recurring += t.amount;
        } else if (t.category === 'savings') {
          expenses.savings += t.amount;
        }
      });

    return { income, expenses };
  };

  const getBudgetUtilization = (): number => {
    const totalExpenses =
      budget.expenses.given +
      budget.expenses.oneTime +
      budget.expenses.recurring +
      budget.expenses.savings;
    return budget.income > 0 ? (totalExpenses / budget.income) * 100 : 0;
  };

  const getRemainingIncome = (): number => {
    const totalExpenses =
      budget.expenses.given +
      budget.expenses.oneTime +
      budget.expenses.recurring +
      budget.expenses.savings;
    return budget.income - totalExpenses;
  };

  const value = useMemo(
    () => ({
      budget,
      calculateBudget,
      getBudgetUtilization,
      getRemainingIncome,
    }),
    [budget]
  );

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  return context;
}
