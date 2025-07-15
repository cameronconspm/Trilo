import React, { createContext, useContext, useEffect, useState } from 'react';
import NotificationService, { NotificationSettings } from '@/services/NotificationService';
import { useFinance } from './FinanceContext';

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  isLoading: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const { transactions } = useFinance();

  useEffect(() => {
    initializeNotifications();
  }, []);

  // Check for external data clearing (like reset data)
  useEffect(() => {
    const checkForDataReset = async () => {
      try {
        const storedSettings = await NotificationService.loadSettings();
        // If settings were externally cleared, update our state
        if (JSON.stringify(storedSettings) !== JSON.stringify(settings)) {
          setSettings(storedSettings);
        }
      } catch (error) {
        console.error('NotificationContext: Error checking for data reset:', error);
      }
    };

    // Check every 2 seconds when app is active
    const interval = setInterval(checkForDataReset, 2000);
    return () => clearInterval(interval);
  }, [settings]);

  useEffect(() => {
    // Only update behavior-based notifications when settings change or significant transaction changes occur
    // Avoid triggering on every small transaction addition
    if (hasPermission && !isLoading && transactions.length > 0) {
      const timeoutId = setTimeout(() => {
        if (settings.expenseReminders) {
          NotificationService.scheduleExpenseReminders(transactions);
        }
        if (settings.paydayReminder) {
          NotificationService.schedulePaydayReminder(transactions);
        }
      }, 2000); // Debounce for 2 seconds to avoid excessive scheduling
      
      return () => clearTimeout(timeoutId);
    }
  }, [settings.expenseReminders, settings.paydayReminder, hasPermission, isLoading]);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      const loadedSettings = await NotificationService.loadSettings();
      setSettings(loadedSettings);
      
      const permission = await NotificationService.requestPermissions();
      setHasPermission(permission);
      
      if (permission) {
        await NotificationService.scheduleAllNotifications();
        // Schedule behavior-based notifications if we have transaction data
        if (transactions.length > 0) {
          if (loadedSettings.expenseReminders) {
            await NotificationService.scheduleExpenseReminders(transactions);
          }
          if (loadedSettings.paydayReminder) {
            await NotificationService.schedulePaydayReminder(transactions);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      await NotificationService.saveSettings(newSettings);
      setSettings(NotificationService.getSettings());
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    const permission = await NotificationService.requestPermissions();
    setHasPermission(permission);
    return permission;
  };

  return (
    <NotificationContext.Provider
      value={{
        settings,
        updateSettings,
        isLoading,
        hasPermission,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}