import React, { createContext, useContext, useEffect, useState } from 'react';
import NotificationService, {
  NotificationSettings,
} from '@/services/NotificationService';

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  isLoading: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

const DEFAULT_CONTEXT_VALUE: NotificationContextType = {
  settings: {
    expenseReminders: false,
    paydayReminder: false,
    weeklyPlannerReminder: false,
    weeklyDigestSummary: false,
    milestoneNotifications: false,
    insightAlerts: false,
  },
  updateSettings: async () => {},
  isLoading: false,
  hasPermission: false,
  requestPermission: async () => false,
};

const NotificationContext = createContext<NotificationContextType>(DEFAULT_CONTEXT_VALUE);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<NotificationSettings>(
    NotificationService.getSettings()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

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
        console.error(
          'NotificationContext: Error checking for data reset:',
          error
        );
      }
    };

    // Check every 2 seconds when app is active
    const interval = setInterval(checkForDataReset, 2000);
    return () => clearInterval(interval);
  }, [settings]);

  // Transaction-based notifications will be handled by FinanceContext
  // to avoid circular dependency

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      const loadedSettings = await NotificationService.loadSettings();
      setSettings(loadedSettings);

      const permission = await NotificationService.requestPermissions();
      setHasPermission(permission);

      if (permission) {
        await NotificationService.scheduleAllNotifications();
        // Transaction-based notifications will be handled by FinanceContext
        // to avoid circular dependency
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
  return context;
}
