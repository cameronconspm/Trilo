import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

export interface StorageHook {
  getItem: <T>(key: string, defaultValue?: T) => Promise<T | null>;
  setItem: <T>(key: string, value: T) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiGet: (keys: string[]) => Promise<Array<[string, string | null]>>;
  multiSet: (keyValuePairs: Array<[string, string]>) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
  getStorageSize: () => Promise<number>;
}

/**
 * Custom hook for AsyncStorage operations with error handling and type safety
 * Includes data persistence validation and recovery mechanisms
 */
export function useStorage(): StorageHook {
  const getItem = useCallback(async <T>(key: string, defaultValue?: T): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue || null;
      }
      
      // Validate JSON before parsing
      const parsed = JSON.parse(value) as T;
      console.log(`Storage: Retrieved ${key} successfully`);
      return parsed;
    } catch (error) {
      console.error(`Storage: Error getting item ${key}:`, error);
      
      // Try to recover by returning default value
      if (defaultValue !== undefined) {
        console.log(`Storage: Using default value for ${key}`);
        return defaultValue;
      }
      
      return null;
    }
  }, []);

  const setItem = useCallback(async <T>(key: string, value: T): Promise<void> => {
    try {
      const serialized = JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
      console.log(`Storage: Saved ${key} successfully`);
      
      // Verify the data was saved correctly
      const verification = await AsyncStorage.getItem(key);
      if (verification !== serialized) {
        throw new Error('Data verification failed after save');
      }
    } catch (error) {
      console.error(`Storage: Error setting item ${key}:`, error);
      throw new Error(`Failed to save ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Storage: Removed ${key} successfully`);
      
      // Verify the item was removed
      const verification = await AsyncStorage.getItem(key);
      if (verification !== null) {
        throw new Error('Item verification failed after removal');
      }
    } catch (error) {
      console.error(`Storage: Error removing item ${key}:`, error);
      throw new Error(`Failed to remove ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log(`Storage: Clearing ${keys.length} items...`);
      
      await AsyncStorage.clear();
      
      // Verify storage is empty
      const remainingKeys = await AsyncStorage.getAllKeys();
      if (remainingKeys.length > 0) {
        throw new Error('Storage verification failed after clear');
      }
      
      console.log('Storage: Cleared successfully');
    } catch (error) {
      console.error('Storage: Error clearing storage:', error);
      throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const getAllKeys = useCallback(async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log(`Storage: Retrieved ${keys.length} keys`);
      return [...keys];
    } catch (error) {
      console.error('Storage: Error getting all keys:', error);
      return [];
    }
  }, []);

  const multiGet = useCallback(async (keys: string[]): Promise<Array<[string, string | null]>> => {
    try {
      const result = await AsyncStorage.multiGet(keys);
      console.log(`Storage: Retrieved ${keys.length} items via multiGet`);
      return [...result];
    } catch (error) {
      console.error('Storage: Error with multiGet:', error);
      return keys.map(key => [key, null]);
    }
  }, []);

  const multiSet = useCallback(async (keyValuePairs: Array<[string, string]>): Promise<void> => {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
      console.log(`Storage: Saved ${keyValuePairs.length} items via multiSet`);
      
      // Verify all items were saved correctly
      const keys = keyValuePairs.map(([key]) => key);
      const verification = await AsyncStorage.multiGet(keys);
      
      for (let i = 0; i < keyValuePairs.length; i++) {
        const [originalKey, originalValue] = keyValuePairs[i];
        const [verifyKey, verifyValue] = verification[i];
        
        if (originalKey !== verifyKey || originalValue !== verifyValue) {
          throw new Error(`Verification failed for key ${originalKey}`);
        }
      }
    } catch (error) {
      console.error('Storage: Error with multiSet:', error);
      throw new Error(`Failed to save multiple items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const multiRemove = useCallback(async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log(`Storage: Removed ${keys.length} items via multiRemove`);
      
      // Verify all items were removed
      const verification = await AsyncStorage.multiGet(keys);
      const remainingItems = verification.filter(([, value]) => value !== null);
      
      if (remainingItems.length > 0) {
        throw new Error(`Verification failed - ${remainingItems.length} items still exist`);
      }
    } catch (error) {
      console.error('Storage: Error with multiRemove:', error);
      throw new Error(`Failed to remove multiple items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const getStorageSize = useCallback(async (): Promise<number> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      items.forEach(([key, value]) => {
        if (value) {
          totalSize += key.length + value.length;
        }
      });
      
      console.log(`Storage: Total size is ${totalSize} characters across ${keys.length} items`);
      return totalSize;
    } catch (error) {
      console.error('Storage: Error calculating storage size:', error);
      return 0;
    }
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    getAllKeys,
    multiGet,
    multiSet,
    multiRemove,
    getStorageSize,
  };
}