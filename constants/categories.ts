import Colors from './colors';
import { Category, CategoryType } from '@/types/finance';

const categories: readonly Category[] = [
  {
    id: 'income',
    name: 'Income',
    color: Colors.income,
  },
  {
    id: 'debt',
    name: 'Debt',
    color: Colors.debt,
  },
  {
    id: 'subscription',
    name: 'Subscriptions',
    color: Colors.subscription,
  },
  {
    id: 'bill',
    name: 'Bills & Utilities',
    color: Colors.bill,
  },
  {
    id: 'savings',
    name: 'Savings',
    color: Colors.savings,
  },
  {
    id: 'one_time_expense',
    name: 'One-Time Expenses',
    color: Colors.oneTimeExpense,
  },
  {
    id: 'given_expenses',
    name: 'Given Expenses',
    color: Colors.givenExpenses,
  },
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    color: Colors.border,
  },
] as const;

export default categories;

// Utility functions for category operations
export const getCategoryById = (id: CategoryType): Category | undefined => {
  return categories.find(category => category.id === id);
};

export const getCategoryColor = (id: CategoryType): string => {
  return getCategoryById(id)?.color ?? Colors.border;
};

export const getCategoryName = (id: CategoryType): string => {
  return getCategoryById(id)?.name ?? 'Unknown';
};

export const isExpenseCategory = (id: CategoryType): boolean => {
  return id !== 'income';
};

export const isIncomeCategory = (id: CategoryType): boolean => {
  return id === 'income';
};
