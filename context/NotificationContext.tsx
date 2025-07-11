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

  useEffect(() => {
    // Update expense reminders when transactions change
    if (settings.expenseReminders && hasPermission) {
      NotificationService.scheduleExpenseReminders(transactions);
    }
  }, [transactions, settings.expenseReminders, hasPermission]);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      const loadedSettings = await NotificationService.loadSettings();
      setSettings(loadedSettings);
      
      const permission = await NotificationService.requestPermissions();
      setHasPermission(permission);
      
      if (permission) {
        await NotificationService.scheduleAllNotifications();
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