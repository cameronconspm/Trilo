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

export interface StorageError extends Error {
  code: 'STORAGE_ERROR' | 'VALIDATION_ERROR' | 'VERIFICATION_ERROR';
  key?: string;
  originalError?: unknown;
}

/**
 * Create a storage error with consistent structure
 */
function createStorageError(
  message: string,
  code: StorageError['code'],
  key?: string,
  originalError?: unknown
): StorageError {
  const error = new Error(message) as StorageError;
  error.code = code;
  error.key = key;
  error.originalError = originalError;
  return error;
}

/**
 * Custom hook for AsyncStorage operations with error handling and type safety
 * Includes data persistence validation and recovery mechanisms
 */
export function useStorage(): StorageHook {
  const getItem = useCallback(
    async <T>(key: string, defaultValue?: T): Promise<T | null> => {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value === null) {
          return defaultValue || null;
        }

        // Validate JSON before parsing
        let parsed: T;
        try {
          parsed = JSON.parse(value) as T;
        } catch (parseError) {
          throw createStorageError(
            `Invalid JSON data for key: ${key}`,
            'VALIDATION_ERROR',
            key,
            parseError
          );
        }

        return parsed;
      } catch (error) {
        // Try to recover by returning default value
        if (defaultValue !== undefined) {
          return defaultValue;
        }

        // Re-throw storage errors, but handle validation errors gracefully
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'STORAGE_ERROR'
        ) {
          throw error;
        }

        return null;
      }
    },
    []
  );

  const setItem = useCallback(
    async <T>(key: string, value: T): Promise<void> => {
      try {
        const serialized = JSON.stringify(value);
        await AsyncStorage.setItem(key, serialized);

        // Verify the data was saved correctly
        const verification = await AsyncStorage.getItem(key);
        if (verification !== serialized) {
          throw createStorageError(
            'Data verification failed after save',
            'VERIFICATION_ERROR',
            key
          );
        }
      } catch (error) {
        if (error instanceof Error && 'code' in error) {
          throw error; // Re-throw our custom errors
        }

        throw createStorageError(
          `Failed to save ${key}`,
          'STORAGE_ERROR',
          key,
          error
        );
      }
    },
    []
  );

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);

      // Verify the item was removed
      const verification = await AsyncStorage.getItem(key);
      if (verification !== null) {
        throw createStorageError(
          'Item verification failed after removal',
          'VERIFICATION_ERROR',
          key
        );
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }

      throw createStorageError(
        `Failed to remove ${key}`,
        'STORAGE_ERROR',
        key,
        error
      );
    }
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.clear();

      // Verify storage is empty
      const remainingKeys = await AsyncStorage.getAllKeys();
      if (remainingKeys.length > 0) {
        throw createStorageError(
          'Storage verification failed after clear',
          'VERIFICATION_ERROR'
        );
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }

      throw createStorageError(
        'Failed to clear storage',
        'STORAGE_ERROR',
        undefined,
        error
      );
    }
  }, []);

  const getAllKeys = useCallback(async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.slice();
    } catch (error) {
      throw createStorageError(
        'Failed to get storage keys',
        'STORAGE_ERROR',
        undefined,
        error
      );
    }
  }, []);

  const multiGet = useCallback(
    async (keys: string[]): Promise<Array<[string, string | null]>> => {
      try {
        const result = await AsyncStorage.multiGet(keys);
        return result.slice();
      } catch (error) {
        return keys.map(key => [key, null]);
      }
    },
    []
  );

  const multiSet = useCallback(
    async (keyValuePairs: Array<[string, string]>): Promise<void> => {
      try {
        await AsyncStorage.multiSet(keyValuePairs);

        // Verify all items were saved correctly
        const keys = keyValuePairs.map(([key]) => key);
        const verification = await AsyncStorage.multiGet(keys);

        for (let i = 0; i < keyValuePairs.length; i++) {
          const [originalKey, originalValue] = keyValuePairs[i];
          const [verifyKey, verifyValue] = verification[i];

          if (originalKey !== verifyKey || originalValue !== verifyValue) {
            throw createStorageError(
              `Verification failed for key ${originalKey}`,
              'VERIFICATION_ERROR',
              originalKey
            );
          }
        }
      } catch (error) {
        if (error instanceof Error && 'code' in error) {
          throw error; // Re-throw our custom errors
        }

        throw createStorageError(
          `Failed to save multiple items: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'STORAGE_ERROR',
          undefined,
          error
        );
      }
    },
    []
  );

  const multiRemove = useCallback(async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);

      // Verify all items were removed
      const verification = await AsyncStorage.multiGet(keys);
      const remainingItems = verification.filter(([, value]) => value !== null);

      if (remainingItems.length > 0) {
        throw createStorageError(
          `Verification failed - ${remainingItems.length} items still exist`,
          'VERIFICATION_ERROR'
        );
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }

      throw createStorageError(
        `Failed to remove multiple items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        undefined,
        error
      );
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

      return totalSize;
    } catch (error) {
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
