import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  // Use AppState listener instead of polling to save battery
  const previousSettingsRef = useRef<string>('');
  
  useEffect(() => {
    const checkForDataReset = async () => {
      try {
        const storedSettings = await NotificationService.loadSettings();
        const storedSettingsString = JSON.stringify(storedSettings);
        const currentSettingsString = JSON.stringify(settings);
        
        // Only update if settings actually changed (prevents infinite loops)
        if (storedSettingsString !== currentSettingsString && storedSettingsString !== previousSettingsRef.current) {
          previousSettingsRef.current = storedSettingsString;
          setSettings(storedSettings);
        }
      } catch (error) {
        console.error(
          'NotificationContext: Error checking for data reset:',
          error
        );
      }
    };

    // Initialize previous settings ref
    previousSettingsRef.current = JSON.stringify(settings);

    // Check immediately on mount
    checkForDataReset();

    // Only check when app comes to foreground (much more battery-efficient than polling)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForDataReset();
      }
    });

    return () => {
      subscription.remove();
    };
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
