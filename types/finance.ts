export type TransactionType = 'income' | 'expense';

export type CategoryType =
  | 'income'
  | 'debt'
  | 'subscription'
  | 'bill'
  | 'savings'
  | 'one_time_expense'
  | 'given_expenses'
  | 'uncategorized';

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
  isPaid?: boolean; // Track if expense has been paid
  // New pay schedule for income
  paySchedule?: PaySchedule;
  // Given expense schedule
  givenExpenseSchedule?: GivenExpenseSchedule;
  // Legacy fields (kept for backward compatibility)
  weekDay?: string;
  weekNumber?: number;
}

// New type for draft expenses in multi-expense flow
export interface DraftExpense {
  id: string;
  name: string;
  amount: number;
  category: CategoryType;
  isRecurring: boolean;
  isPaid?: boolean; // Track if expense has been paid
  paySchedule?: PaySchedule;
  givenExpenseSchedule?: GivenExpenseSchedule;
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
  pastExpenses: Transaction[];
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

// Utility types for better type safety
export type NonRecurringTransaction = Omit<Transaction, 'isRecurring'> & {
  isRecurring: false;
};

export type RecurringTransaction = Omit<Transaction, 'isRecurring'> & {
  isRecurring: true;
};

export type IncomeTransaction = Omit<Transaction, 'type'> & {
  type: 'income';
};

export type ExpenseTransaction = Omit<Transaction, 'type'> & {
  type: 'expense';
};

// Date utility types
export type DateString = string; // ISO string
export type WeekDay =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';
export type WeekNumber = 1 | 2 | 3 | 4 | 5;

// Form state types
export interface TransactionFormData {
  name: string;
  amount: string;
  category: CategoryType;
  isRecurring: boolean;
  paySchedule?: PaySchedule;
  givenExpenseSchedule?: GivenExpenseSchedule;
  weekDay?: WeekDay;
  weekNumber?: WeekNumber;
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Reminder types
export type ReminderReason = 
  | 'cancel_subscription'
  | 'find_cheaper_option'
  | 'evaluate_usage'
  | 'remind_before_renewal';

export interface Reminder {
  id: string;
  transactionId: string;
  transactionName: string;
  transactionCategory: CategoryType;
  reason: ReminderReason;
  note?: string;
  reminderDate: string; // ISO string
  createdAt: string; // ISO string
  isCompleted: boolean;
  snoozeCount: number; // Track how many times user snoozed
  maxSnoozes: number; // Max snoozes allowed (default 3)
}

export interface ReminderReasonOption {
  id: ReminderReason;
  label: string;
  description: string;
}

// Challenge System Types
export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  type: 'debt_paydown' | 'savings' | 'spending_limit' | 'emergency_fund';
  target_amount: number;
  duration_days: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points_reward: number;
  badge_reward?: string;
  is_active: boolean;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  template_id: string;
  challenge_name: string;
  description: string;
  type: 'debt_paydown' | 'savings' | 'spending_limit' | 'emergency_fund';
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  progress_percentage: number;
  points_reward: number;
  badge_reward?: string;
  template_name?: string;
  template_description?: string;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  progress_date: string;
  amount_progress: number;
  percentage_complete: number;
  daily_change: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_name: string;
  badge_type: 'debt_paydown' | 'savings' | 'consistency' | 'milestone' | 'streak';
  badge_description: string;
  earned_date: string;
  challenge_id?: string;
  points_earned: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserFinancialScore {
  id: string;
  user_id: string;
  total_points: number;
  debt_paydown_points: number;
  savings_points: number;
  consistency_points: number;
  milestone_points: number;
  current_level: number;
  level_name: string;
  weekly_score: number;
  monthly_score: number;
  last_reset_date?: string;
}

export interface ChallengeCompletion {
  id: string;
  challenge_id: string;
  user_id: string;
  start_date: string;
  completion_date: string;
  final_amount: number;
  completion_percentage: number;
  points_earned: number;
  badges_earned?: string[];
  completion_time_hours?: number;
}

export interface WeeklyReset {
  id: string;
  user_id: string;
  reset_week_start: string;
  reset_week_end: string;
  challenges_completed: number;
  challenges_failed: number;
  total_points_earned: number;
  badges_earned: number;
  reset_completed_at: string;
}

// Account data for challenge tracking
export interface AccountDataForChallenges {
  id: string;
  type: 'checking' | 'savings' | 'credit_card' | 'loan';
  balance: number;
  previous_balance?: number;
  transactions?: Transaction[];
}

// Micro Goal interface
export interface MicroGoal {
  id: string;
  title: string;
  description: string;
  category: 'spending' | 'savings' | 'habit' | 'quick_win';
  duration: number; // in days
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  targetAmount: number; // target amount for the goal
  isActive: boolean;
  isCompleted: boolean;
  startDate?: string;
  completionDate?: string;
  progress?: number; // 0-100
  currentDay?: number; // current day in the goal duration
}

// Challenge tracking context
export interface ChallengeTrackingContext {
  activeChallenges: UserChallenge[];
  completedChallenges: ChallengeCompletion[];
  userBadges: UserBadge[];
  financialScore: UserFinancialScore | null;
  activeMicroGoals: MicroGoal[];
  completedMicroGoals: MicroGoal[];
  isLoading: boolean;
  error: string | null;
  createChallenge: (templateId: string, customTarget?: number) => Promise<void>;
  updateProgress: (accountData: AccountDataForChallenges[]) => Promise<void>;
  getChallengeTemplates: () => Promise<ChallengeTemplate[]>;
  performWeeklyReset: () => Promise<void>;
  startMicroGoal: (goal: MicroGoal) => Promise<void>;
  completeMicroGoal: (goalId: string) => Promise<void>;
  deleteMicroGoal: (goalId: string) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  loadChallengeData: () => Promise<void>;
}
