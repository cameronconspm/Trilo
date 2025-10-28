import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/types/finance';

/**
 * Sync Service
 * Handles syncing between local storage and Supabase database
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance_transactions_v2',
  LAST_SYNC: 'last_sync_timestamp',
};

export class SyncService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Sync local data to Supabase
  async syncToCloud(): Promise<void> {
    try {
      // Get local transactions
      const localKey = `${STORAGE_KEYS.TRANSACTIONS}_${this.userId}`;
      const localData = await AsyncStorage.getItem(localKey);
      
      if (!localData) {
        console.log('SyncService: No local data to sync');
        return;
      }

      const transactions = JSON.parse(localData);
      
      // Save to Supabase
      if (transactions.length > 0) {
        await Promise.all(
          transactions.map((t: Transaction) =>
            supabase
              .from('user_transactions')
              .upsert({
                id: t.id,
                user_id: this.userId,
                name: t.name,
                amount: t.amount,
                category: t.category,
                type: t.type,
                date: t.date,
                is_recurring: t.isRecurring || false,
                pay_schedule: t.paySchedule || null,
              })
          )
        );
      }

      // Update last sync timestamp
      await AsyncStorage.setItem(
        `last_sync_timestamp_${this.userId}`,
        new Date().toISOString()
      );

      console.log(`SyncService: Synced ${transactions.length} transactions to cloud`);
    } catch (error) {
      console.error('SyncService: Error syncing to cloud:', error);
      throw error;
    }
  }

  // Load data from Supabase
  async loadFromCloud(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false });

      if (error) throw error;

      // Convert to app format
      const transactions = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name || '',
        amount: Number(t.amount),
        date: t.date,
        category: t.category as any,
        type: t.type as any,
        isRecurring: t.is_recurring || false,
        paySchedule: t.pay_schedule,
      }));

      // Also save to local for offline access
      const localKey = `${STORAGE_KEYS.TRANSACTIONS}_${this.userId}`;
      await AsyncStorage.setItem(localKey, JSON.stringify(transactions));

      console.log(`SyncService: Loaded ${transactions.length} transactions from cloud`);
      return transactions;
    } catch (error) {
      console.error('SyncService: Error loading from cloud:', error);
      throw error;
    }
  }

  // Sync local changes to cloud (called after each save)
  async syncTransactionToCloud(transaction: Transaction): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_transactions')
        .upsert({
          id: transaction.id,
          user_id: this.userId,
          name: transaction.name,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date,
          is_recurring: transaction.isRecurring || false,
          pay_schedule: transaction.paySchedule || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('SyncService: Error syncing transaction to cloud:', error);
      throw error;
    }
  }

  // Delete transaction from cloud
  async deleteTransactionFromCloud(transactionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('SyncService: Error deleting from cloud:', error);
      throw error;
    }
  }
}

