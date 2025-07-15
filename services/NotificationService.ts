import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/types/finance';

export interface NotificationSettings {
  expenseReminders: boolean;
  insightAlerts: boolean;
  reminderTime: string; // 'HH:MM'
  reminderDaysBefore: number;
  weeklyInsightDay: string; // 'monday', 'tuesday', etc.
  weeklyInsightTime: string; // 'HH:MM'
  weeklyPlannerReminder: boolean;
  paydayReminder: boolean;
  weeklyDigestSummary: boolean;
  milestoneNotifications: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  expenseReminders: true,
  insightAlerts: true,
  reminderTime: '09:00',
  reminderDaysBefore: 1,
  weeklyInsightDay: 'sunday',
  weeklyInsightTime: '18:00',
  weeklyPlannerReminder: true,
  paydayReminder: true,
  weeklyDigestSummary: true,
  milestoneNotifications: true,
};

const STORAGE_KEY = 'notification_settings';

class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  async initialize() {
    if (Platform.OS === 'web') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await this.loadSettings();
    await this.requestPermissions();
  }

  async requestPermissions(): Promise<boolean> {
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
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  async cancelAllNotifications() {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async scheduleAllNotifications() {
    if (Platform.OS === 'web') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (this.settings.insightAlerts) {
      await this.scheduleWeeklyInsights();
    }

    if (this.settings.weeklyPlannerReminder) {
      await this.scheduleWeeklyPlannerReminder();
    }

    if (this.settings.weeklyDigestSummary) {
      await this.scheduleWeeklyDigest();
    }
  }

  async scheduleExpenseReminders(transactions: Transaction[]) {
    if (Platform.OS === 'web' || !this.settings.expenseReminders) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduled) {
      if (notification.identifier.startsWith('expense_reminder_')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    const now = new Date();
    const [reminderHour, reminderMinute] = this.settings.reminderTime.split(':').map(Number);

    const upcomingExpenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const dueDate = new Date(t.date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - this.settings.reminderDaysBefore);
      reminderDate.setHours(reminderHour, reminderMinute, 0, 0);
      return reminderDate > now && dueDate > now;
    });

    for (const expense of upcomingExpenses) {
      const dueDate = new Date(expense.date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - this.settings.reminderDaysBefore);
      reminderDate.setHours(reminderHour, reminderMinute, 0, 0);

      if (reminderDate <= now) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `expense_reminder_${expense.id}`,
        content: {
          title: 'Upcoming Expense',
          body: `${expense.name} (${expense.category}) - $${expense.amount.toFixed(2)} due soon`,
          data: { type: 'expense_reminder', transactionId: expense.id },
        },
        trigger: {
          type: 'datetime',
          date: reminderDate,
        } as Notifications.DateTriggerInput,
      });
    }
  }

  async scheduleWeeklyInsights() {
    const dayMap = {
      sunday: 1,
      monday: 2,
      tuesday: 3,
      wednesday: 4,
      thursday: 5,
      friday: 6,
      saturday: 7,
    };

    const targetDay = dayMap[this.settings.weeklyInsightDay as keyof typeof dayMap];
    const [hour, minute] = this.settings.weeklyInsightTime.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Financial Insights',
        body: 'Check out your spending patterns and budget progress for this week!',
        data: { type: 'weekly_insights' },
      },
      trigger: {
        type: 'calendar',
        weekday: targetDay,
        hour,
        minute,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  async scheduleWeeklyPlannerReminder() {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_planner_reminder',
      content: {
        title: 'Plan Your Week',
        body: 'New week, new plan. Let\'s map out your money.',
        data: { type: 'weekly_planner' },
      },
      trigger: {
        type: 'calendar',
        weekday: 2, // Monday
        hour: 9,
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  }

  async schedulePaydayReminder(payday: number) {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'payday_reminder',
      content: {
        title: 'It\'s Payday',
        body: 'Your paycheck just hit! Want to assign your funds now?',
        data: { type: 'payday' },
      },
      trigger: {
        type: 'calendar',
        day: payday,
        hour: 7,
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  }

  async scheduleWeeklyDigest() {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_digest',
      content: {
        title: 'Weekly Wrap-Up',
        body: 'See how you spent, saved, and what\'s ahead next week.',
        data: { type: 'weekly_digest' },
      },
      trigger: {
        type: 'calendar',
        weekday: 1, // Sunday
        hour: 19,
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  }

  async scheduleMilestoneNotification(title: string, body: string) {
    if (Platform.OS === 'web' || !this.settings.milestoneNotifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'milestone' },
      },
      trigger: null, // Immediate notification
    });
  }

  formatDay(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
}

export default new NotificationService();
