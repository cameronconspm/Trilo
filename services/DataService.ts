import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, CategoryType } from '@/types/finance';

/**
 * Enhanced data service layer with robust persistence and error recovery
 * Designed for reliable local storage with future cloud extensibility
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
  
  // Data integrity
  validateDataIntegrity(): Promise<boolean>;
  repairData(): Promise<void>;
  createBackup(): Promise<void>;
  restoreFromBackup(): Promise<boolean>;
}

class LocalDataService implements DataService {
  private readonly STORAGE_KEY = 'finance_transactions_v2';
  private readonly BACKUP_KEY = 'finance_backup_v2';
  private readonly INTEGRITY_KEY = 'finance_integrity_v2';
  private readonly VERSION = '2.0.0';

  async getTransactions(): Promise<Transaction[]> {
    try {
      console.log('DataService: Loading transactions...');
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!data) {
        console.log('DataService: No transactions found');
        return [];
      }

      const transactions = JSON.parse(data);
      
      if (!Array.isArray(transactions)) {
        console.warn('DataService: Invalid transaction data format, attempting recovery...');
        const recovered = await this.restoreFromBackup();
        if (recovered) {
          return this.getTransactions();
        }
        return [];
      }

      // Validate each transaction
      const validTransactions = transactions.filter(this.validateTransaction);
      
      if (validTransactions.length !== transactions.length) {
        console.warn(`DataService: Found ${transactions.length - validTransactions.length} invalid transactions, cleaning up...`);
        await this.saveAllTransactions(validTransactions);
      }

      console.log(`DataService: Loaded ${validTransactions.length} valid transactions`);
      return validTransactions;
    } catch (error) {
      console.error('DataService: Error loading transactions:', error);
      
      // Attempt recovery from backup
      const recovered = await this.restoreFromBackup();
      if (recovered) {
        return this.getTransactions();
      }
      
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
      console.log(`DataService: Saved transaction ${transaction.id}`);
    } catch (error) {
      console.error('DataService: Error saving transaction:', error);
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
        console.log(`DataService: Updated transaction ${id}`);
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error('DataService: Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      
      if (filteredTransactions.length === transactions.length) {
        throw new Error('Transaction not found');
      }
      
      await this.saveAllTransactions(filteredTransactions);
      console.log(`DataService: Deleted transaction ${id}`);
    } catch (error) {
      console.error('DataService: Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  async saveAllTransactions(transactions: Transaction[]): Promise<void> {
    try {
      // Validate all transactions before saving
      const validTransactions = transactions.filter(this.validateTransaction);
      
      if (validTransactions.length !== transactions.length) {
        console.warn(`DataService: Filtered out ${transactions.length - validTransactions.length} invalid transactions`);
      }

      const dataToSave = JSON.stringify(validTransactions);
      await AsyncStorage.setItem(this.STORAGE_KEY, dataToSave);
      
      // Update integrity check
      await this.updateIntegrityCheck(validTransactions);
      
      // Create backup periodically
      if (validTransactions.length > 0) {
        await this.createBackup();
      }
      
      console.log(`DataService: Saved ${validTransactions.length} transactions`);
    } catch (error) {
      console.error('DataService: Error saving all transactions:', error);
      throw new Error('Failed to save transactions');
    }
  }

  async clearAllTransactions(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEY,
        this.BACKUP_KEY,
        this.INTEGRITY_KEY,
      ]);
      console.log('DataService: Cleared all transaction data');
    } catch (error) {
      console.error('DataService: Error clearing transactions:', error);
      throw new Error('Failed to clear transactions');
    }
  }

  async exportData(): Promise<string> {
    try {
      const transactions = await this.getTransactions();
      const exportData = {
        transactions,
        exportDate: new Date().toISOString(),
        version: this.VERSION,
        integrity: await this.calculateIntegrityHash(transactions),
      };
      
      console.log(`DataService: Exported ${transactions.length} transactions`);
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('DataService: Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      
      if (!parsedData.transactions || !Array.isArray(parsedData.transactions)) {
        throw new Error('Invalid data format - no transactions array found');
      }

      // Validate integrity if available
      if (parsedData.integrity) {
        const calculatedHash = await this.calculateIntegrityHash(parsedData.transactions);
        if (calculatedHash !== parsedData.integrity) {
          console.warn('DataService: Import data integrity check failed, proceeding with caution');
        }
      }

      const validTransactions = parsedData.transactions.filter(this.validateTransaction);
      
      if (validTransactions.length === 0) {
        throw new Error('No valid transactions found in import data');
      }

      await this.saveAllTransactions(validTransactions);
      console.log(`DataService: Imported ${validTransactions.length} valid transactions`);
    } catch (error) {
      console.error('DataService: Error importing data:', error);
      throw new Error('Failed to import data - invalid format or corrupted data');
    }
  }

  async getTransactionsByCategory(category: CategoryType): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => t.category === category);
    } catch (error) {
      console.error('DataService: Error getting transactions by category:', error);
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
      console.error('DataService: Error getting transactions by date range:', error);
      return [];
    }
  }

  async validateDataIntegrity(): Promise<boolean> {
    try {
      const transactions = await this.getTransactions();
      const storedIntegrity = await AsyncStorage.getItem(this.INTEGRITY_KEY);
      
      if (!storedIntegrity) {
        // No integrity check exists, create one
        await this.updateIntegrityCheck(transactions);
        return true;
      }

      const { hash, count, lastUpdated } = JSON.parse(storedIntegrity);
      const currentHash = await this.calculateIntegrityHash(transactions);
      
      const isValid = hash === currentHash && count === transactions.length;
      
      if (!isValid) {
        console.warn('DataService: Data integrity check failed');
      }
      
      return isValid;
    } catch (error) {
      console.error('DataService: Error validating data integrity:', error);
      return false;
    }
  }

  async repairData(): Promise<void> {
    try {
      console.log('DataService: Attempting data repair...');
      
      const transactions = await this.getTransactions();
      const validTransactions = transactions.filter(this.validateTransaction);
      
      if (validTransactions.length !== transactions.length) {
        console.log(`DataService: Repaired ${transactions.length - validTransactions.length} invalid transactions`);
        await this.saveAllTransactions(validTransactions);
      }
      
      // Update integrity check
      await this.updateIntegrityCheck(validTransactions);
      
      console.log('DataService: Data repair completed');
    } catch (error) {
      console.error('DataService: Error repairing data:', error);
      throw new Error('Failed to repair data');
    }
  }

  async createBackup(): Promise<void> {
    try {
      const exportData = await this.exportData();
      await AsyncStorage.setItem(this.BACKUP_KEY, exportData);
      console.log('DataService: Backup created successfully');
    } catch (error) {
      console.error('DataService: Error creating backup:', error);
      // Don't throw error for backup failures
    }
  }

  async restoreFromBackup(): Promise<boolean> {
    try {
      console.log('DataService: Attempting to restore from backup...');
      
      const backupData = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (!backupData) {
        console.log('DataService: No backup found');
        return false;
      }

      const parsedBackup = JSON.parse(backupData);
      if (parsedBackup.transactions && Array.isArray(parsedBackup.transactions)) {
        const validTransactions = parsedBackup.transactions.filter(this.validateTransaction);
        
        if (validTransactions.length > 0) {
          await this.saveAllTransactions(validTransactions);
          console.log(`DataService: Restored ${validTransactions.length} transactions from backup`);
          return true;
        }
      }
      
      console.log('DataService: Backup contains no valid transactions');
      return false;
    } catch (error) {
      console.error('DataService: Error restoring from backup:', error);
      return false;
    }
  }

  private validateTransaction = (transaction: any): transaction is Transaction => {
    try {
      return (
        transaction &&
        typeof transaction.id === 'string' &&
        typeof transaction.name === 'string' &&
        typeof transaction.amount === 'number' &&
        typeof transaction.date === 'string' &&
        typeof transaction.category === 'string' &&
        typeof transaction.type === 'string' &&
        typeof transaction.isRecurring === 'boolean' &&
        transaction.amount > 0 &&
        ['income', 'expense'].includes(transaction.type) &&
        !isNaN(new Date(transaction.date).getTime()) &&
        transaction.name.trim().length > 0
      );
    } catch (error) {
      return false;
    }
  };

  private async calculateIntegrityHash(transactions: Transaction[]): Promise<string> {
    // Simple hash calculation for integrity checking
    const dataString = JSON.stringify(transactions.sort((a, b) => a.id.localeCompare(b.id)));
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private async updateIntegrityCheck(transactions: Transaction[]): Promise<void> {
    try {
      const integrityData = {
        hash: await this.calculateIntegrityHash(transactions),
        count: transactions.length,
        lastUpdated: new Date().toISOString(),
        version: this.VERSION,
      };
      
      await AsyncStorage.setItem(this.INTEGRITY_KEY, JSON.stringify(integrityData));
    } catch (error) {
      console.error('DataService: Error updating integrity check:', error);
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