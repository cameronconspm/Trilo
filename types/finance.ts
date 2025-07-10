export type TransactionType = 'income' | 'expense';

export type CategoryType = 
  | 'income'
  | 'savings'
  | 'subscriptions'
  | 'bills_utilities'
  | 'debt'
  | 'one_time';

export interface Category {
  id: CategoryType;
  name: string;
  color: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO string
  category: CategoryType;
  type: TransactionType;
  isRecurring: boolean;
}

export interface Budget {
  income: number;
  expenses: {
    given: number;
    oneTime: number;
    recurring: number;
  };
}

export interface WeeklyOverview {
  weekIncome: number;
  remainingBalance: number;
  utilization: number;
  contributions: {
    [key in CategoryType]?: {
      total: number;
      count: number;
    };
  };
  upcomingExpenses: Transaction[];
}

export interface MonthlyInsights {
  totalSpent: number;
  totalSaved: number;
  topSpendingCategory: {
    category: Category;
    amount: number;
  };
  insights: string[];
  recentTransactions: Transaction[];
}