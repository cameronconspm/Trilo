export type TransactionType = 'income' | 'expense';

export type CategoryType = 
  | 'income'
  | 'debt'
  | 'subscription'
  | 'bill'
  | 'one_time_expense';

export type PayCadence = 
  | 'weekly'
  | 'every_2_weeks'
  | 'twice_monthly'
  | 'monthly'
  | 'custom';

export interface Category {
  id: CategoryType;
  name: string;
  color: string;
  icon?: string;
}

export interface PaySchedule {
  cadence: PayCadence;
  lastPaidDate: string; // ISO string
  // For twice_monthly: two day numbers (e.g., [7, 23])
  monthlyDays?: number[];
  // For custom: array of day numbers
  customDays?: number[];
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO string
  category: CategoryType;
  type: TransactionType;
  isRecurring: boolean;
  // New pay schedule for income
  paySchedule?: PaySchedule;
  // Legacy fields (kept for backward compatibility)
  weekDay?: string;
  weekNumber?: number;
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
  currentPayPeriod?: string;
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