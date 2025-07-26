import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://cycgtdtsnprulpmfkzwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y2d0ZHRzbnBydWxwbWZrendyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDQwOTUsImV4cCI6MjA2ODUyMDA5NX0.bQUSpMX4KkWJTcgPfewOPg19FXw9FvO05mN6FjQ3D7c';

// Get the appropriate redirect URL based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return `${window.location.origin}/verify`;
  }
  // For mobile development with Expo
  return 'exp://localhost:8081/--/verify';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export the redirect URL function for use in auth methods
export { getRedirectUrl };

// Database types
export interface UserTransaction {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  is_recurring: boolean;
  pay_schedule?: any;
  given_expense_schedule?: any;
  created_at?: string;
  updated_at?: string;
}

export interface UserIncome {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  pay_schedule?: any;
  created_at?: string;
  updated_at?: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  time_to_save: number;
  created_date: string;
  target_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Transaction service functions
export const transactionService = {
  // Get all transactions for a user
  async getTransactions(userId: string): Promise<UserTransaction[]> {
    const { data, error } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    return data || [];
  },

  // Add a new transaction
  async addTransaction(userId: string, transaction: Omit<UserTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserTransaction> {
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .insert({
          user_id: userId,
          ...transaction
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding transaction:', JSON.stringify(error, null, 2));
        
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
        
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error saving transactions:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  },

  // Update a transaction
  async updateTransaction(id: string, updates: Partial<Omit<UserTransaction, 'id' | 'user_id' | 'created_at'>>): Promise<UserTransaction> {
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating transaction:', JSON.stringify(error, null, 2));
        
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
        
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error saving transactions:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  },

  // Delete a transaction
  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  // Clear all transactions for a user
  async clearAllTransactions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_transactions')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error clearing transactions:', error);
      throw error;
    }
  }
};

// Income service functions
export const incomeService = {
  // Get all income sources for a user
  async getIncomes(userId: string): Promise<UserIncome[]> {
    const { data, error } = await supabase
      .from('user_income')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching incomes:', error);
      throw error;
    }
    
    return data || [];
  },

  // Add a new income source
  async addIncome(userId: string, income: Omit<UserIncome, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserIncome> {
    try {
      const { data, error } = await supabase
        .from('user_income')
        .insert({
          user_id: userId,
          ...income
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding income:', JSON.stringify(error, null, 2));
        
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
        
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error saving transactions:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  },

  // Update an income source
  async updateIncome(id: string, updates: Partial<Omit<UserIncome, 'id' | 'user_id' | 'created_at'>>): Promise<UserIncome> {
    const { data, error } = await supabase
      .from('user_income')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating income:', error);
      throw error;
    }
    
    return data;
  },

  // Delete an income source
  async deleteIncome(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_income')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  },

  // Clear all income sources for a user
  async clearAllIncomes(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_income')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error clearing incomes:', error);
      throw error;
    }
  },

  // Get active income sources
  async getActiveIncomes(userId: string): Promise<UserIncome[]> {
    const { data, error } = await supabase
      .from('user_income')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active incomes:', error);
      throw error;
    }
    
    return data || [];
  }
};

// Goal service functions
export const goalService = {
  // Get all goals for a user
  async getGoals(userId: string): Promise<UserGoal[]> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
    
    return data || [];
  },

  // Add a new goal
  async addGoal(userId: string, goal: Omit<UserGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserGoal> {
    const { data, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        ...goal
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
    
    return data;
  },

  // Update a goal
  async updateGoal(id: string, updates: Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at'>>): Promise<UserGoal> {
    const { data, error } = await supabase
      .from('user_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
    
    return data;
  },

  // Delete a goal
  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  // Clear all goals for a user
  async clearAllGoals(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error clearing goals:', error);
      throw error;
    }
  }
};