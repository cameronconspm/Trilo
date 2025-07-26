import React, { createContext, useContext, useEffect, useState } from 'react';
import NotificationService, { NotificationSettings } from '@/services/NotificationService';
import { useFinance } from './FinanceContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/services/supabase';

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  isLoading: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userId, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const { transactions } = useFinance();

  useEffect(() => {
    if (isAuthenticated && userId) {
      initializeNotifications();
    } else if (!isAuthenticated) {
      // Reset to defaults when logged out
      setSettings(NotificationService.getSettings());
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

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
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      await NotificationService.initialize();
      
      // Load settings from Supabase first
      const loadedSettings = await loadNotificationSettings();
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

  const loadNotificationSettings = async (): Promise<NotificationSettings> => {
    if (!userId) {
      return NotificationService.getSettings();
    }

    try {
      // Load from Supabase
      const { data: userProfile, error } = await supabase
        .from('app_users')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (error) {
        // Handle specific database errors
        if (error.code === 'PGRST116') {
          // User not found, use local settings
          console.log('NotificationContext: User profile not found, using local settings');
          return await NotificationService.loadSettings();
        } else if (error.code === '42703') {
          // Column doesn't exist, fall back to local storage
          console.warn('NotificationContext: preferences column does not exist in database, using local storage');
          return await NotificationService.loadSettings();
        } else {
          // Other database errors
          console.error('NotificationContext: Database error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          return await NotificationService.loadSettings();
        }
      }

      if (userProfile?.preferences?.notificationSettings) {
        const settings = userProfile.preferences.notificationSettings as NotificationSettings;
        // Update local storage as backup
        await NotificationService.saveSettings(settings);
        return settings;
      } else {
        // No settings in Supabase, migrate from local storage
        const localSettings = await NotificationService.loadSettings();
        await saveNotificationSettings(localSettings);
        return localSettings;
      }
    } catch (error) {
      console.error('NotificationContext: Unexpected error loading notification settings:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: JSON.stringify(error, null, 2)
      });
      return await NotificationService.loadSettings();
    }
  };

  const saveNotificationSettings = async (newSettings: NotificationSettings) => {
    if (!userId) {
      console.warn('NotificationContext: No user ID, saving to local storage only');
      await NotificationService.saveSettings(newSettings);
      return;
    }

    try {
      // Get current preferences
      const { data: userProfile, error: fetchError } = await supabase
        .from('app_users')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // User not found, save to local storage only
          console.warn('NotificationContext: User profile not found, saving to local storage only');
          await NotificationService.saveSettings(newSettings);
          return;
        } else if (fetchError.code === '42703') {
          // Column doesn't exist, fall back to local storage
          console.warn('NotificationContext: preferences column does not exist, saving to local storage only');
          await NotificationService.saveSettings(newSettings);
          return;
        } else {
          // Other database errors
          console.error('NotificationContext: Database error while fetching preferences:', {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          });
          await NotificationService.saveSettings(newSettings);
          return;
        }
      }

      const currentPreferences = userProfile?.preferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        notificationSettings: newSettings
      };

      // Save to Supabase
      const { error } = await supabase
        .from('app_users')
        .update({ preferences: updatedPreferences })
        .eq('id', userId);

      if (error) {
        if (error.code === '42703') {
          // Column doesn't exist, fall back to local storage
          console.warn('NotificationContext: preferences column does not exist during update, saving to local storage only');
          await NotificationService.saveSettings(newSettings);
          return;
        } else {
          console.error('NotificationContext: Error saving to Supabase:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          await NotificationService.saveSettings(newSettings);
          return;
        }
      }

      // Also save to local storage as backup
      await NotificationService.saveSettings(newSettings);
      console.log('NotificationContext: Settings saved to Supabase successfully');
    } catch (error) {
      console.error('NotificationContext: Unexpected error saving notification settings:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: JSON.stringify(error, null, 2)
      });
      await NotificationService.saveSettings(newSettings);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await saveNotificationSettings(updatedSettings);
      setSettings(updatedSettings);
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