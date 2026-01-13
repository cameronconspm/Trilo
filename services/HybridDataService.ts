import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Transaction, IncomeTransaction } from '@/types/finance';
import { SupabaseDataService } from './SupabaseDataService';

/**
 * Hybrid Data Service
 * Tries Supabase first, falls back to local storage if Supabase is unavailable
 */

export interface HybridDataService {
  getTransactions(): Promise<Transaction[]>;
  saveTransaction(transaction: Transaction): Promise<void>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  saveAllTransactions(transactions: Transaction[]): Promise<void>;
  clearAllTransactions(): Promise<void>;
  exportData(): Promise<string>;
}

export class HybridDataService implements HybridDataService {
  private userId: string;
  private supabaseService: SupabaseDataService | null = null;
  private useSupabase = false;

  constructor(userId: string) {
    this.userId = userId;
    this.supabaseService = new SupabaseDataService(userId);
  }

  // Check if Supabase is available
  private async checkSupabaseAvailability(): Promise<boolean> {
    try {
      // Test a simple query
      const { error } = await supabase
        .from('user_transactions')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  // Get storage key for local storage
  private getLocalStorageKey(key: string): string {
    return `${key}_${this.userId}`;
  }

  // TRANSACTIONS
  async getTransactions(): Promise<Transaction[]> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();
    
    if (isSupabaseAvailable && this.supabaseService) {
      try {
        return await this.supabaseService.getTransactions();
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to local:', error);
      }
    }

    // Fallback to local storage
    try {
      const data = await AsyncStorage.getItem(
        this.getLocalStorageKey('finance_transactions_v2')
      );
      
      if (!data) return [];
      
      const transactions = JSON.parse(data);
      return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
      console.error('Local storage fetch failed:', error);
      return [];
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();
    
    if (isSupabaseAvailable && this.supabaseService) {
      try {
        await this.supabaseService.saveTransaction(transaction);
        return;
      } catch (error) {
        console.warn('Supabase save failed, falling back to local:', error);
      }
    }

    // Fallback to local storage
    try {
      const transactions = await this.getTransactions();
      const existingIndex = transactions.findIndex(t => t.id === transaction.id);
      
      if (existingIndex >= 0) {
        transactions[existingIndex] = transaction;
      } else {
        transactions.push(transaction);
      }
      
      await AsyncStorage.setItem(
        this.getLocalStorageKey('finance_transactions_v2'),
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error('Local storage save failed:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();
    
    if (isSupabaseAvailable && this.supabaseService) {
      try {
        await this.supabaseService.updateTransaction(id, updates);
        return;
      } catch (error) {
        console.warn('Supabase update failed, falling back to local:', error);
      }
    }

    // Fallback to local storage
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      
      if (index >= 0) {
        transactions[index] = { ...transactions[index], ...updates };
        await AsyncStorage.setItem(
          this.getLocalStorageKey('finance_transactions_v2'),
          JSON.stringify(transactions)
        );
      }
    } catch (error) {
      console.error('Local storage update failed:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();
    
    if (isSupabaseAvailable && this.supabaseService) {
      try {
        await this.supabaseService.deleteTransaction(id);
        return;
      } catch (error) {
        console.warn('Supabase delete failed, falling back to local:', error);
      }
    }

    // Fallback to local storage
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== id);
      
      await AsyncStorage.setItem(
        this.getLocalStorageKey('finance_transactions_v2'),
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Local storage delete failed:', error);
      throw error;
    }
  }

  async saveAllTransactions(transactions: Transaction[]): Promise<void> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();
    
    if (isSupabaseAvailable && this.supabaseService) {
      try {
        await this.supabaseService.saveAllTransactions(transactions);
        return;
      } catch (error) {
        console.warn('Supabase save all failed, falling back to local:', error);
      }
    }

    // Fallback to local storage
    try {
      await AsyncStorage.setItem(
        this.getLocalStorageKey('finance_transactions_v2'),
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error('Local storage save all failed:', error);
      throw error;
    }
  }

  async clearAllTransactions(): Promise<void> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();
    
    if (isSupabaseAvailable && this.supabaseService) {
      try {
        await this.supabaseService.clearAllTransactions();
        return;
      } catch (error) {
        console.warn('Supabase clear failed, falling back to local:', error);
      }
    }

    // Fallback to local storage
    try {
      await AsyncStorage.removeItem(this.getLocalStorageKey('finance_transactions_v2'));
    } catch (error) {
      console.error('Local storage clear failed:', error);
      throw error;
    }
  }

  async exportData(): Promise<string> {
    if (this.supabaseService) {
      try {
        return await this.supabaseService.exportData();
      } catch (error) {
        console.warn('Supabase export failed:', error);
      }
    }

    // Fallback to local storage
    try {
      const transactions = await this.getTransactions();
      return JSON.stringify({
        transactions,
        exportDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Local export failed:', error);
      throw error;
    }
  }
}

