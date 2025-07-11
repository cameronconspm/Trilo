import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'system' | 'light' | 'dark';
type WeekStartDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

interface SettingsContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  weekStartDay: WeekStartDay;
  setWeekStartDay: (day: WeekStartDay) => Promise<void>;
  isBankConnected: boolean;
  connectBank: () => Promise<void>;
  disconnectBank: () => Promise<void>;
  resetData: () => Promise<void>;
  isLoading: boolean;
  nickname: string;
  setNickname: (name: string) => Promise<void>;
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_PREFERENCES: 'settings_user_preferences_v2',
  SETTINGS_VERSION: 'settings_version',
  // Legacy keys for migration
  THEME: 'settings_theme',
  WEEK_START_DAY: 'settings_week_start_day',
  BANK_CONNECTED: 'settings_bank_connected',
} as const;

interface UserPreferences {
  theme: ThemeType;
  weekStartDay: WeekStartDay;
  isBankConnected: boolean;
  notificationsEnabled: boolean;
  budgetAlerts: boolean;
  version: string;
  nickname: string;
  avatarUri: string | null;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  weekStartDay: 'thursday',
  isBankConnected: false,
  notificationsEnabled: true,
  budgetAlerts: true,
  version: '2.0.0',
  nickname: '',
  avatarUri: null,
};

const CURRENT_SETTINGS_VERSION = '2.0.0';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(DEFAULT_PREFERENCES.theme);
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>(DEFAULT_PREFERENCES.weekStartDay);
  const [isBankConnected, setIsBankConnected] = useState(DEFAULT_PREFERENCES.isBankConnected);
  const [nickname, setNicknameState] = useState<string>(DEFAULT_PREFERENCES.nickname);
  const [avatarUri, setAvatarUriState] = useState<string | null>(DEFAULT_PREFERENCES.avatarUri);
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
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS_VERSION);
      if (!storedVersion) {
        // First time app launch, set version
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS_VERSION, CURRENT_SETTINGS_VERSION);
        console.log('SettingsContext: First app launch, version set to', CURRENT_SETTINGS_VERSION);
      }
      
      // Try to load consolidated preferences first
      const storedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      
      if (storedPreferences) {
        try {
          const preferences: UserPreferences = JSON.parse(storedPreferences);
          console.log('SettingsContext: Loaded preferences from storage');
          
          // Validate and apply preferences
          if (preferences.theme && ['system', 'light', 'dark'].includes(preferences.theme)) {
            setThemeState(preferences.theme);
          }
          if (preferences.weekStartDay && ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(preferences.weekStartDay)) {
            setWeekStartDayState(preferences.weekStartDay);
          }
          if (typeof preferences.isBankConnected === 'boolean') {
            setIsBankConnected(preferences.isBankConnected);
          }
          if (typeof preferences.nickname === 'string') {
            setNicknameState(preferences.nickname);
          }
          if (preferences.avatarUri === null || typeof preferences.avatarUri === 'string') {
            setAvatarUriState(preferences.avatarUri);
          }
        } catch (parseError) {
          console.error('SettingsContext: Error parsing stored preferences:', parseError);
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
      console.log('SettingsContext: Attempting to migrate from legacy settings...');
      
      // Try to load individual legacy keys
      const [storedTheme, storedWeekStartDay, storedBankConnection] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.THEME),
        AsyncStorage.getItem(STORAGE_KEYS.WEEK_START_DAY),
        AsyncStorage.getItem(STORAGE_KEYS.BANK_CONNECTED),
      ]);

      let migrated = false;
      
      if (storedTheme && ['system', 'light', 'dark'].includes(storedTheme)) {
        setThemeState(storedTheme as ThemeType);
        migrated = true;
      }
      if (storedWeekStartDay && ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(storedWeekStartDay)) {
        setWeekStartDayState(storedWeekStartDay as WeekStartDay);
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
          STORAGE_KEYS.WEEK_START_DAY,
          STORAGE_KEYS.BANK_CONNECTED,
        ]);
      } else {
        console.log('SettingsContext: No legacy settings found, using defaults');
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
        weekStartDay,
        isBankConnected,
        notificationsEnabled: true,
        budgetAlerts: true,
        version: CURRENT_SETTINGS_VERSION,
        nickname,
        avatarUri,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
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
      await saveAllPreferences();
    } catch (error) {
      console.error('SettingsContext: Error saving theme:', error);
      // Revert on error
      setThemeState(theme);
      throw new Error('Failed to save theme setting');
    }
  };

  const setWeekStartDay = async (day: WeekStartDay) => {
    try {
      console.log('SettingsContext: Setting week start day to', day);
      setWeekStartDayState(day);
      await saveAllPreferences();
    } catch (error) {
      console.error('SettingsContext: Error saving week start day:', error);
      // Revert on error
      setWeekStartDayState(weekStartDay);
      throw new Error('Failed to save week start day');
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
      console.log('SettingsContext: Resetting all settings data...');
      
      // Clear all settings and reset to defaults
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.SETTINGS_VERSION,
        // Also clean up any legacy keys
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.WEEK_START_DAY,
        STORAGE_KEYS.BANK_CONNECTED,
      ]);
      
      // Reset state to defaults
      setThemeState(DEFAULT_PREFERENCES.theme);
      setWeekStartDayState(DEFAULT_PREFERENCES.weekStartDay);
      setIsBankConnected(DEFAULT_PREFERENCES.isBankConnected);
      setNicknameState(DEFAULT_PREFERENCES.nickname);
      setAvatarUriState(DEFAULT_PREFERENCES.avatarUri);
      
      // Save default preferences
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS_VERSION, CURRENT_SETTINGS_VERSION);
      
      console.log('SettingsContext: Settings reset successfully');
    } catch (error) {
      console.error('SettingsContext: Error resetting settings:', error);
      throw new Error('Failed to reset settings');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        weekStartDay,
        setWeekStartDay,
        isBankConnected,
        connectBank,
        disconnectBank,
        resetData,
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
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}