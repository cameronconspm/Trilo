import { supabase } from '@/lib/supabase';
import { Transaction, IncomeTransaction } from '@/types/finance';

/**
 * Supabase Data Service
 * Stores user data in Supabase database instead of local storage
 */

interface SupabaseTransaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  type: string;
  date: string;
  name?: string;
  is_recurring?: boolean;
  pay_schedule?: any;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseDataService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // TRANSACTIONS
  async getTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false });

      if (error) throw error;

      // Convert Supabase format to app Transaction format
      return (data || []).map(this.convertToTransaction);
    } catch (error) {
      console.error('SupabaseDataService: Error getting transactions:', error);
      return [];
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const supabaseTransaction = this.convertToSupabaseFormat(transaction);
      
      const { error } = await supabase
        .from('user_transactions')
        .upsert(supabaseTransaction, {
          onConflict: 'id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error saving transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error deleting transaction:', error);
      throw error;
    }
  }

  async saveAllTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const supabaseTransactions = transactions.map(t => this.convertToSupabaseFormat(t));
      
      const { error } = await supabase
        .from('user_transactions')
        .upsert(supabaseTransactions, {
          onConflict: 'id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error saving all transactions:', error);
      throw error;
    }
  }

  async clearAllTransactions(): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_transactions')
        .delete()
        .eq('user_id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error clearing transactions:', error);
      throw error;
    }
  }

  // INCOME
  async getIncome(): Promise<IncomeTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('user_income')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.convertToIncome);
    } catch (error) {
      console.error('SupabaseDataService: Error getting income:', error);
      return [];
    }
  }

  async saveIncome(income: IncomeTransaction): Promise<void> {
    try {
      const supabaseIncome = {
        id: income.id,
        user_id: this.userId,
        name: income.name,
        amount: income.amount,
        date: income.date,
        category: income.category || 'income',
        is_recurring: income.isRecurring || false,
        pay_schedule: income.paySchedule || null,
      };

      const { error } = await supabase
        .from('user_income')
        .upsert(supabaseIncome, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error saving income:', error);
      throw error;
    }
  }

  // SAVINGS GOALS
  async getSavingsGoals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_savings_goals')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('SupabaseDataService: Error getting savings goals:', error);
      return [];
    }
  }

  async saveSavingsGoal(goal: any): Promise<void> {
    try {
      const supabaseGoal = {
        ...goal,
        user_id: this.userId,
      };

      const { error } = await supabase
        .from('user_savings_goals')
        .upsert(supabaseGoal, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error saving savings goal:', error);
      throw error;
    }
  }

  // SETTINGS
  async getSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || {};
    } catch (error) {
      console.error('SupabaseDataService: Error getting settings:', error);
      return {};
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      const supabaseSettings = {
        ...settings,
        user_id: this.userId,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(supabaseSettings, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseDataService: Error saving settings:', error);
      throw error;
    }
  }

  // CONVERSION HELPERS
  private convertToTransaction(data: SupabaseTransaction): Transaction {
    return {
      id: data.id,
      name: data.name || '',
      amount: Number(data.amount),
      date: data.date,
      category: data.category as any,
      type: data.type as any,
      isRecurring: data.is_recurring || false,
      paySchedule: data.pay_schedule,
    };
  }

  private convertToSupabaseFormat(transaction: Transaction): any {
    return {
      id: transaction.id,
      user_id: this.userId,
      name: transaction.name,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      type: transaction.type,
      is_recurring: transaction.isRecurring || false,
      pay_schedule: transaction.paySchedule || null,
    };
  }

  private convertToIncome(data: any): IncomeTransaction {
    return {
      id: data.id,
      name: data.name,
      amount: Number(data.amount),
      date: data.date,
      category: data.category,
      type: 'income',
      isRecurring: data.is_recurring || false,
      paySchedule: data.pay_schedule,
    };
  }

  // EXPORT/IMPORT (for backup)
  async exportData(): Promise<string> {
    try {
      const [transactions, income, savingsGoals, settings] = await Promise.all([
        this.getTransactions(),
        this.getIncome(),
        this.getSavingsGoals(),
        this.getSettings(),
      ]);

      return JSON.stringify({
        transactions,
        income,
        savingsGoals,
        settings,
        exportDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('SupabaseDataService: Error exporting data:', error);
      throw error;
    }
  }
}

