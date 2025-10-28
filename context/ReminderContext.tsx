import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Reminder, ReminderReason, Transaction } from '@/types/finance';
import { useFinance } from './FinanceContext';

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (transaction: Transaction, reason: ReminderReason, note?: string) => Promise<void>;
  completeReminder: (reminderId: string) => Promise<void>;
  snoozeReminder: (reminderId: string, days: number) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  getReminderForTransaction: (transactionId: string) => Reminder | undefined;
  isLoading: boolean;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

const STORAGE_KEY = 'reminders';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { transactions } = useFinance();

  // Load reminders from storage
  useEffect(() => {
    loadReminders();
  }, []);

  // Check for expired reminders and schedule notifications
  useEffect(() => {
    if (reminders.length > 0) {
      checkAndScheduleNotifications();
    }
  }, [reminders]);

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedReminders = JSON.parse(stored);
        setReminders(parsedReminders);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReminders = async (newReminders: Reminder[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const calculateReminderDate = (transaction: Transaction): Date => {
    const now = new Date();
    
    if (transaction.isRecurring) {
      // For recurring expenses, set reminder 1 day before next billing cycle
      const transactionDate = new Date(transaction.date);
      const dayOfMonth = transactionDate.getDate();
      
      // Calculate next occurrence
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
      const nextOccurrence = nextMonth > now ? nextMonth : new Date(now.getFullYear(), now.getMonth() + 2, dayOfMonth);
      
      // Set reminder 1 day before
      const reminderDate = new Date(nextOccurrence);
      reminderDate.setDate(reminderDate.getDate() - 1);
      
      return reminderDate;
    } else {
      // For one-time expenses, set reminder for 7 days from now
      const reminderDate = new Date(now);
      reminderDate.setDate(reminderDate.getDate() + 7);
      return reminderDate;
    }
  };

  const addReminder = async (transaction: Transaction, reason: ReminderReason, note?: string) => {
    const reminderDate = calculateReminderDate(transaction);
    
    const newReminder: Reminder = {
      id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transactionId: transaction.id,
      transactionName: transaction.name,
      transactionCategory: transaction.category,
      reason,
      note,
      reminderDate: reminderDate.toISOString(),
      createdAt: new Date().toISOString(),
      isCompleted: false,
      snoozeCount: 0,
      maxSnoozes: 3,
    };

    const updatedReminders = [...reminders, newReminder];
    await saveReminders(updatedReminders);
    
    // Schedule notification
    await scheduleNotification(newReminder);
  };

  const completeReminder = async (reminderId: string) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, isCompleted: true }
        : reminder
    );
    
    await saveReminders(updatedReminders);
    
    // Cancel any scheduled notifications for this reminder
    await cancelNotification(reminderId);
  };

  const snoozeReminder = async (reminderId: string, days: number) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder || reminder.snoozeCount >= reminder.maxSnoozes) {
      return;
    }

    const newReminderDate = new Date(reminder.reminderDate);
    newReminderDate.setDate(newReminderDate.getDate() + days);

    const updatedReminders = reminders.map(r =>
      r.id === reminderId
        ? {
            ...r,
            reminderDate: newReminderDate.toISOString(),
            snoozeCount: r.snoozeCount + 1,
          }
        : r
    );

    await saveReminders(updatedReminders);
    
    // Reschedule notification
    await cancelNotification(reminderId);
    await scheduleNotification({ ...reminder, reminderDate: newReminderDate.toISOString(), snoozeCount: reminder.snoozeCount + 1 });
  };

  const deleteReminder = async (reminderId: string) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== reminderId);
    await saveReminders(updatedReminders);
    
    // Cancel any scheduled notifications for this reminder
    await cancelNotification(reminderId);
  };

  const getReminderForTransaction = (transactionId: string): Reminder | undefined => {
    return reminders.find(reminder => 
      reminder.transactionId === transactionId && !reminder.isCompleted
    );
  };

  const scheduleNotification = async (reminder: Reminder) => {
    try {
      const reminderDate = new Date(reminder.reminderDate);
      const now = new Date();
      
      // Only schedule if the reminder date is in the future
      if (reminderDate > now) {
        const notificationMessages = [
          `Still paying for ${reminder.transactionName}? Want to cancel it now?`,
          `Ready to say goodbye to ${reminder.transactionName}?`,
          `Time to review ${reminder.transactionName} - still worth it?`,
        ];
        
        const randomMessage = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Expense Reminder',
            body: randomMessage,
            data: { reminderId: reminder.id },
          },
          trigger: reminderDate as any,
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelNotification = async (reminderId: string) => {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationToCancel = scheduledNotifications.find(
        notification => notification.content.data?.reminderId === reminderId
      );
      
      if (notificationToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notificationToCancel.identifier);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const checkAndScheduleNotifications = async () => {
    const now = new Date();
    const activeReminders = reminders.filter(reminder => 
      !reminder.isCompleted && new Date(reminder.reminderDate) > now
    );

    for (const reminder of activeReminders) {
      await scheduleNotification(reminder);
    }
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        addReminder,
        completeReminder,
        snoozeReminder,
        deleteReminder,
        getReminderForTransaction,
        isLoading,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}
