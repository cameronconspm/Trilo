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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'settings_theme',
  WEEK_START_DAY: 'settings_week_start_day',
  BANK_CONNECTED: 'settings_bank_connected',
  USER_PREFERENCES: 'settings_user_preferences',
} as const;

interface UserPreferences {
  theme: ThemeType;
  weekStartDay: WeekStartDay;
  isBankConnected: boolean;
  notificationsEnabled: boolean;
  budgetAlerts: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  weekStartDay: 'thursday',
  isBankConnected: false,
  notificationsEnabled: true,
  budgetAlerts: true,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>('thursday');
  const [isBankConnected, setIsBankConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Try to load consolidated preferences first
      const storedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      
      if (storedPreferences) {
        const preferences: UserPreferences = JSON.parse(storedPreferences);
        setThemeState(preferences.theme);
        setWeekStartDayState(preferences.weekStartDay);
        setIsBankConnected(preferences.isBankConnected);
      } else {
        // Fallback to individual keys for backward compatibility
        const [storedTheme, storedWeekStartDay, storedBankConnection] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.WEEK_START_DAY),
          AsyncStorage.getItem(STORAGE_KEYS.BANK_CONNECTED),
        ]);

        if (storedTheme) setThemeState(storedTheme as ThemeType);
        if (storedWeekStartDay) setWeekStartDayState(storedWeekStartDay as WeekStartDay);
        if (storedBankConnection) setIsBankConnected(JSON.parse(storedBankConnection));

        // Migrate to consolidated preferences
        await saveAllPreferences();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default values on error
    } finally {
      setIsLoading(false);
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
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save settings');
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await saveAllPreferences();
    } catch (error) {
      console.error('Error saving theme:', error);
      // Revert on error
      setThemeState(theme);
      throw new Error('Failed to save theme setting');
    }
  };

  const setWeekStartDay = async (day: WeekStartDay) => {
    try {
      setWeekStartDayState(day);
      await saveAllPreferences();
    } catch (error) {
      console.error('Error saving week start day:', error);
      // Revert on error
      setWeekStartDayState(weekStartDay);
      throw new Error('Failed to save week start day');
    }
  };

  const connectBank = async () => {
    try {
      setIsBankConnected(true);
      await saveAllPreferences();
    } catch (error) {
      console.error('Error saving bank connection:', error);
      setIsBankConnected(false);
      throw new Error('Failed to save bank connection');
    }
  };

  const disconnectBank = async () => {
    try {
      setIsBankConnected(false);
      await saveAllPreferences();
    } catch (error) {
      console.error('Error saving bank disconnection:', error);
      setIsBankConnected(true);
      throw new Error('Failed to disconnect bank');
    }
  };

  const resetData = async () => {
    try {
      // Clear all settings and reset to defaults
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.WEEK_START_DAY,
        STORAGE_KEYS.BANK_CONNECTED,
        STORAGE_KEYS.USER_PREFERENCES,
      ]);
      
      // Reset state to defaults
      setThemeState(DEFAULT_PREFERENCES.theme);
      setWeekStartDayState(DEFAULT_PREFERENCES.weekStartDay);
      setIsBankConnected(DEFAULT_PREFERENCES.isBankConnected);
      
      // Save default preferences
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
    } catch (error) {
      console.error('Error resetting settings:', error);
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