import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '@/services/NotificationService';
import { Appearance } from 'react-native';
import { useAuth } from './AuthContext';

type ThemeType = 'system' | 'light' | 'dark';

interface SettingsContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  isBankConnected: boolean;
  connectBank: () => Promise<void>;
  disconnectBank: () => Promise<void>;
  resetData: () => Promise<void>;
  resetDataSelective: () => Promise<void>;
  isLoading: boolean;
  nickname: string;
  setNickname: (name: string) => Promise<void>;
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => Promise<void>;
}

const DEFAULT_CONTEXT_VALUE: SettingsContextType = {
  theme: 'system',
  setTheme: async () => {},
  isBankConnected: false,
  connectBank: async () => {},
  disconnectBank: async () => {},
  resetData: async () => {},
  resetDataSelective: async () => {},
  isLoading: true,
  nickname: '',
  setNickname: async () => {},
  avatarUri: null,
  setAvatarUri: async () => {},
};

const SettingsContext = createContext<SettingsContextType>(DEFAULT_CONTEXT_VALUE);

// Helper to get user-specific storage keys
const getStorageKeys = (userId: string) => ({
  USER_PREFERENCES: `settings_user_preferences_v2_${userId}`,
  SETTINGS_VERSION: `settings_version_${userId}`,
  // Legacy keys for migration
  THEME: `settings_theme_${userId}`,
  BANK_CONNECTED: `settings_bank_connected_${userId}`,
});

interface UserPreferences {
  theme: ThemeType;
  isBankConnected: boolean;
  notificationsEnabled: boolean;
  budgetAlerts: boolean;
  version: string;
  nickname: string;
  avatarUri: string | null;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  isBankConnected: false,
  notificationsEnabled: true,
  budgetAlerts: true,
  version: '2.0.0',
  nickname: '',
  avatarUri: null,
};

const CURRENT_SETTINGS_VERSION = '2.0.0';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const STORAGE_KEYS = getStorageKeys(userId);
  
  const [theme, setThemeState] = useState<ThemeType>(DEFAULT_PREFERENCES.theme);
  const [isBankConnected, setIsBankConnected] = useState(
    DEFAULT_PREFERENCES.isBankConnected
  );
  const [nickname, setNicknameState] = useState<string>(
    DEFAULT_PREFERENCES.nickname
  );
  const [avatarUri, setAvatarUriState] = useState<string | null>(
    DEFAULT_PREFERENCES.avatarUri
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      console.log('SettingsContext: Loading settings from storage...');

      // Check settings version
      const storedVersion = await AsyncStorage.getItem(
        STORAGE_KEYS.SETTINGS_VERSION
      );
      if (!storedVersion) {
        // First time app launch, set version
        await AsyncStorage.setItem(
          STORAGE_KEYS.SETTINGS_VERSION,
          CURRENT_SETTINGS_VERSION
        );
        console.log(
          'SettingsContext: First app launch, version set to',
          CURRENT_SETTINGS_VERSION
        );
      }

      // Try to load consolidated preferences first
      const storedPreferences = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_PREFERENCES
      );

      if (storedPreferences) {
        try {
          const preferences: UserPreferences = JSON.parse(storedPreferences);
          console.log('SettingsContext: Loaded preferences from storage');

          // Validate and apply preferences
          if (
            preferences.theme &&
            ['system', 'light', 'dark'].includes(preferences.theme)
          ) {
            setThemeState(preferences.theme);
          }
          if (typeof preferences.isBankConnected === 'boolean') {
            setIsBankConnected(preferences.isBankConnected);
          }
          if (typeof preferences.nickname === 'string') {
            setNicknameState(preferences.nickname);
          }
          if (
            preferences.avatarUri === null ||
            typeof preferences.avatarUri === 'string'
          ) {
            setAvatarUriState(preferences.avatarUri);
          }
        } catch (parseError) {
          console.error(
            'SettingsContext: Error parsing stored preferences:',
            parseError
          );
          await migrateFromLegacySettings();
        }
      } else {
        // Try to migrate from legacy settings
        await migrateFromLegacySettings();
      }
    } catch (error) {
      console.error('SettingsContext: Error loading settings:', error);
      // Use default values on error
      await saveAllPreferences();
    } finally {
      setIsLoading(false);
    }
  };

  const migrateFromLegacySettings = async () => {
    try {
      console.log(
        'SettingsContext: Attempting to migrate from legacy settings...'
      );

      // Try to load individual legacy keys
      const [storedTheme, storedBankConnection] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.BANK_CONNECTED),
        ]);

      let migrated = false;

      if (storedTheme && ['system', 'light', 'dark'].includes(storedTheme)) {
        setThemeState(storedTheme as ThemeType);
        migrated = true;
      }
      if (storedBankConnection) {
        try {
          const bankConnected = JSON.parse(storedBankConnection);
          if (typeof bankConnected === 'boolean') {
            setIsBankConnected(bankConnected);
            migrated = true;
          }
        } catch (e) {
          // Ignore parse error
        }
      }

      if (migrated) {
        console.log('SettingsContext: Successfully migrated legacy settings');
        // Save migrated settings to new format
        await saveAllPreferences();

        // Clean up legacy keys
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.THEME,
          STORAGE_KEYS.BANK_CONNECTED,
        ]);
      } else {
        console.log(
          'SettingsContext: No legacy settings found, using defaults'
        );
        await saveAllPreferences();
      }
    } catch (error) {
      console.error('SettingsContext: Error migrating legacy settings:', error);
      // Use defaults and save them
      await saveAllPreferences();
    }
  };

  const saveAllPreferences = async () => {
    try {
      const preferences: UserPreferences = {
        theme,
        isBankConnected,
        notificationsEnabled: true,
        budgetAlerts: true,
        version: CURRENT_SETTINGS_VERSION,
        nickname,
        avatarUri,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
      console.log('SettingsContext: Preferences saved successfully');
    } catch (error) {
      console.error('SettingsContext: Error saving preferences:', error);
      throw new Error('Failed to save settings');
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      console.log('SettingsContext: Setting theme to', newTheme);
      setThemeState(newTheme);
      // Save immediately to ensure persistence
      const preferences: UserPreferences = {
        theme: newTheme,
        isBankConnected,
        notificationsEnabled: true,
        budgetAlerts: true,
        version: CURRENT_SETTINGS_VERSION,
        nickname,
        avatarUri,
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
      console.log('SettingsContext: Theme saved successfully');
      
      // Log the effective theme after change
      const effectiveTheme = newTheme === 'system' 
        ? (Appearance.getColorScheme() || 'light')
        : newTheme;
      console.log('SettingsContext: Effective theme after change:', effectiveTheme);
    } catch (error) {
      console.error('SettingsContext: Error saving theme:', error);
      // Revert on error
      setThemeState(theme);
      throw new Error('Failed to save theme setting');
    }
  };

  const connectBank = async () => {
    try {
      console.log('SettingsContext: Connecting bank account');
      setIsBankConnected(true);
      await saveAllPreferences();
    } catch (error) {
      console.error('SettingsContext: Error saving bank connection:', error);
      setIsBankConnected(false);
      throw new Error('Failed to save bank connection');
    }
  };

  const disconnectBank = async () => {
    try {
      console.log('SettingsContext: Disconnecting bank account');
      setIsBankConnected(false);
      await saveAllPreferences();
    } catch (error) {
      console.error('SettingsContext: Error saving bank disconnection:', error);
      setIsBankConnected(true);
      throw new Error('Failed to disconnect bank');
    }
  };

  const setNickname = async (name: string) => {
    try {
      console.log('SettingsContext: Setting nickname to', name);
      setNicknameState(name);
      await saveAllPreferences();
    } catch (error) {
      console.error('SettingsContext: Error saving nickname:', error);
      // Revert on error
      setNicknameState(nickname);
      throw new Error('Failed to save nickname');
    }
  };

  const setAvatarUri = async (uri: string | null) => {
    try {
      console.log('SettingsContext: Setting avatar URI to', uri);
      setAvatarUriState(uri);
      await saveAllPreferences();
    } catch (error) {
      console.error('SettingsContext: Error saving avatar URI:', error);
      // Revert on error
      setAvatarUriState(avatarUri);
      throw new Error('Failed to save avatar URI');
    }
  };

  const resetData = async () => {
    try {
      console.log('SettingsContext: Resetting all app data...');

      // Clear ALL app data - settings, financial data, notifications, etc.
      const allKeys = await AsyncStorage.getAllKeys();
      console.log(
        'SettingsContext: Found',
        allKeys.length,
        'storage keys to clear'
      );

      // Reset notifications first
      await NotificationService.resetAllData();

      // Remove all stored data
      await AsyncStorage.multiRemove(allKeys);

      // Reset state to defaults
      setThemeState(DEFAULT_PREFERENCES.theme);
      setIsBankConnected(DEFAULT_PREFERENCES.isBankConnected);
      setNicknameState(DEFAULT_PREFERENCES.nickname);
      setAvatarUriState(DEFAULT_PREFERENCES.avatarUri);

      // Save default preferences
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(DEFAULT_PREFERENCES)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS_VERSION,
        CURRENT_SETTINGS_VERSION
      );

      console.log('SettingsContext: All app data reset successfully');
    } catch (error) {
      console.error('SettingsContext: Error resetting all data:', error);
      throw new Error('Failed to reset all data');
    }
  };

  const resetDataSelective = async () => {
    try {
      console.log('SettingsContext: Resetting selective app data (preserving achievements)...');

      // Get all storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Define keys to preserve (user achievements)
      const keysToPreserve = [
        'activeChallenges',
        'userBadges', 
        'financialScore',
        'completedChallenges',
        'activeMicroGoals',
        // Add any other achievement-related keys here
      ];

      // Filter out keys to preserve
      const keysToDelete = allKeys.filter(key => 
        !keysToPreserve.some(preserveKey => key.includes(preserveKey))
      );

      console.log(
        'SettingsContext: Preserving',
        keysToPreserve.length,
        'achievement keys, deleting',
        keysToDelete.length,
        'other keys'
      );

      // Reset notifications first
      await NotificationService.resetAllData();

      // Remove only non-achievement data
      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }

      // Reset state to defaults (but keep achievements)
      setThemeState(DEFAULT_PREFERENCES.theme);
      setIsBankConnected(DEFAULT_PREFERENCES.isBankConnected);
      setNicknameState(DEFAULT_PREFERENCES.nickname);
      setAvatarUriState(DEFAULT_PREFERENCES.avatarUri);

      // Save default preferences
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(DEFAULT_PREFERENCES)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS_VERSION,
        CURRENT_SETTINGS_VERSION
      );

      console.log('SettingsContext: Selective data reset completed successfully');
    } catch (error) {
      console.error('SettingsContext: Error in selective reset:', error);
      throw new Error('Failed to reset selective data');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        isBankConnected,
        connectBank,
        disconnectBank,
        resetData,
        resetDataSelective,
        isLoading,
        nickname,
        setNickname,
        avatarUri,
        setAvatarUri,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  return context;
}
