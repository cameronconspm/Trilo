import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, CategoryType } from '@/types/finance';

/**
 * Data service layer for future extensibility to cloud storage
 * Currently uses AsyncStorage but can be easily switched to API calls
 */

export interface DataService {
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  saveTransaction(transaction: Transaction): Promise<void>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  
  // Bulk operations
  saveAllTransactions(transactions: Transaction[]): Promise<void>;
  clearAllTransactions(): Promise<void>;
  
  // Data management
  exportData(): Promise<string>;
  importData(data: string): Promise<void>;
  
  // Analytics
  getTransactionsByCategory(category: CategoryType): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
}

class LocalDataService implements DataService {
  private readonly STORAGE_KEY = 'finance_transactions';

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const existingIndex = transactions.findIndex(t => t.id === transaction.id);
      
      if (existingIndex >= 0) {
        transactions[existingIndex] = transaction;
      } else {
        transactions.push(transaction);
      }
      
      await this.saveAllTransactions(transactions);
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw new Error('Failed to save transaction');
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      
      if (index >= 0) {
        transactions[index] = { ...transactions[index], ...updates };
        await this.saveAllTransactions(transactions);
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      await this.saveAllTransactions(filteredTransactions);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  async saveAllTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving all transactions:', error);
      throw new Error('Failed to save transactions');
    }
  }

  async clearAllTransactions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing transactions:', error);
      throw new Error('Failed to clear transactions');
    }
  }

  async exportData(): Promise<string> {
    try {
      const transactions = await this.getTransactions();
      const exportData = {
        transactions,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
        await this.saveAllTransactions(parsedData.transactions);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  async getTransactionsByCategory(category: CategoryType): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => t.category === category);
    } catch (error) {
      console.error('Error getting transactions by category:', error);
      return [];
    }
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dataService = new LocalDataService();

// Factory function for future cloud service implementation
export function createDataService(type: 'local' | 'cloud' = 'local'): DataService {
  switch (type) {
    case 'local':
      return new LocalDataService();
    case 'cloud':
      // Future implementation
      throw new Error('Cloud data service not implemented yet');
    default:
      return new LocalDataService();
  }
}