export type TransactionType = 'income' | 'expense';

export type CategoryType = 
  | 'income'
  | 'debt'
  | 'subscription'
  | 'bill'
  | 'savings'
  | 'one_time_expense'
  | 'given_expenses';

export type PayCadence = 
  | 'weekly'
  | 'every_2_weeks'
  | 'twice_monthly'
  | 'monthly'
  | 'custom';

export type GivenExpenseFrequency = 
  | 'every_week'
  | 'every_other_week'
  | 'once_a_month';

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

export interface GivenExpenseSchedule {
  frequency: GivenExpenseFrequency;
  startDate: string; // ISO string
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
  // Given expense schedule
  givenExpenseSchedule?: GivenExpenseSchedule;
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
    savings: number;
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