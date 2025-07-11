import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/types/finance';

export interface NotificationSettings {
  expenseReminders: boolean;
  insightAlerts: boolean;
  reminderTime: string; // HH:MM format
  reminderDaysBefore: number;
  weeklyInsightDay: string; // 'monday', 'tuesday', etc.
  weeklyInsightTime: string; // HH:MM format
}

const DEFAULT_SETTINGS: NotificationSettings = {
  expenseReminders: true,
  insightAlerts: true,
  reminderTime: '09:00',
  reminderDaysBefore: 1,
  weeklyInsightDay: 'sunday',
  weeklyInsightTime: '18:00',
};

const STORAGE_KEY = 'notification_settings';

class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  async initialize() {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return;
    }

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

    // Load settings
    await this.loadSettings();

    // Request permissions
    await this.requestPermissions();
  }

  async requestPermissions() {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async loadSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
      return this.settings;
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Partial<NotificationSettings>) {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      
      // Reschedule notifications with new settings
      await this.scheduleAllNotifications();
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  async scheduleAllNotifications() {
    if (Platform.OS === 'web') return;

    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule weekly insights
    if (this.settings.insightAlerts) {
      await this.scheduleWeeklyInsights();
    }
  }

  async scheduleExpenseReminders(transactions: Transaction[]) {
    if (Platform.OS === 'web' || !this.settings.expenseReminders) return;

    // Cancel existing expense reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const expenseNotifications = scheduled.filter(n => 
      n.identifier.startsWith('expense_reminder_')
    );
    
    for (const notification of expenseNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    // Schedule new reminders for upcoming expenses
    const now = new Date();
    const upcomingExpenses = transactions.filter(transaction => {
      if (transaction.type !== 'expense') return false;
      
      const dueDate = new Date(transaction.date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - this.settings.reminderDaysBefore);
      
      return reminderDate > now && dueDate > now;
    });

    for (const expense of upcomingExpenses) {
      const dueDate = new Date(expense.date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - this.settings.reminderDaysBefore);
      
      // Set reminder time
      const [hours, minutes] = this.settings.reminderTime.split(':');
      reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (reminderDate > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `expense_reminder_${expense.id}`,
          content: {
            title: 'Upcoming Expense',
            body: `${expense.name} (${expense.category}) - ${expense.amount.toFixed(2)} due ${this.settings.reminderDaysBefore === 1 ? 'tomorrow' : `in ${this.settings.reminderDaysBefore} days`}`,
            data: { type: 'expense_reminder', transactionId: expense.id },
          },
          trigger: {
            type: 'datetime' as Notifications.NotificationTriggerInput['type'],
            date: reminderDate,
          },
        });
      }
    }
  }

  async scheduleWeeklyInsights() {
    if (Platform.OS === 'web') return;

    const dayMap = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };

    const targetDay = dayMap[this.settings.weeklyInsightDay as keyof typeof dayMap];
    const [hours, minutes] = this.settings.weeklyInsightTime.split(':');

    // Calculate next occurrence
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + (7 - now.getDay() + targetDay) % 7);
    nextWeek.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // If the time has passed today and it's the target day, schedule for next week
    if (nextWeek <= now) {
      nextWeek.setDate(nextWeek.getDate() + 7);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_insights',
      content: {
        title: 'Weekly Financial Insights',
        body: 'Check out your spending patterns and budget progress for this week!',
        data: { type: 'weekly_insights' },
      },
      trigger: {
        type: 'calendar' as Notifications.NotificationTriggerInput['type'],
        weekday: targetDay + 1, // expo-notifications uses 1-7 for Sunday-Saturday
        hour: parseInt(hours),
        minute: parseInt(minutes),
        repeats: true,
      },
    });
  }

  async cancelAllNotifications() {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Helper method to format time for display
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Helper method to get day display name
  formatDay(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
}

export default new NotificationService();