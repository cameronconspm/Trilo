import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'system' | 'light' | 'dark';
type WeekStartDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

interface SettingsContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  weekStartDay: WeekStartDay;
  setWeekStartDay: (day: WeekStartDay) => void;
  isBankConnected: boolean;
  connectBank: () => void;
  disconnectBank: () => void;
  resetData: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>('thursday');
  const [isBankConnected, setIsBankConnected] = useState(false);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme) {
          setThemeState(storedTheme as ThemeType);
        }

        const storedWeekStartDay = await AsyncStorage.getItem('weekStartDay');
        if (storedWeekStartDay) {
          setWeekStartDayState(storedWeekStartDay as WeekStartDay);
        }

        const storedBankConnection = await AsyncStorage.getItem('isBankConnected');
        if (storedBankConnection) {
          setIsBankConnected(JSON.parse(storedBankConnection));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('theme', newTheme)
      .catch(error => console.error('Error saving theme:', error));
  };

  const setWeekStartDay = (day: WeekStartDay) => {
    setWeekStartDayState(day);
    AsyncStorage.setItem('weekStartDay', day)
      .catch(error => console.error('Error saving week start day:', error));
  };

  const connectBank = () => {
    setIsBankConnected(true);
    AsyncStorage.setItem('isBankConnected', JSON.stringify(true))
      .catch(error => console.error('Error saving bank connection:', error));
  };

  const disconnectBank = () => {
    setIsBankConnected(false);
    AsyncStorage.setItem('isBankConnected', JSON.stringify(false))
      .catch(error => console.error('Error saving bank connection:', error));
  };

  const resetData = async () => {
    try {
      await AsyncStorage.removeItem('transactions');
      alert('All data has been reset. Please restart the app.');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data. Please try again.');
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