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
}

/**
 * Custom hook for AsyncStorage operations with error handling and type safety
 */
export function useStorage(): StorageHook {
  const getItem = useCallback(async <T>(key: string, defaultValue?: T): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue || null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return defaultValue || null;
    }
  }, []);

  const setItem = useCallback(async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw new Error(`Failed to save ${key}`);
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw new Error(`Failed to remove ${key}`);
    }
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }, []);

  const getAllKeys = useCallback(async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }, []);

  const multiGet = useCallback(async (keys: string[]): Promise<Array<[string, string | null]>> => {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error with multiGet:', error);
      return [];
    }
  }, []);

  const multiSet = useCallback(async (keyValuePairs: Array<[string, string]>): Promise<void> => {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error with multiSet:', error);
      throw new Error('Failed to save multiple items');
    }
  }, []);

  const multiRemove = useCallback(async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error with multiRemove:', error);
      throw new Error('Failed to remove multiple items');
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
  };
}