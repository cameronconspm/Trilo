import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/types/finance';

export interface NotificationSettings {
  expenseReminders: boolean;
  insightAlerts: boolean;
  weeklyPlannerReminder: boolean;
  paydayReminder: boolean;
  weeklyDigestSummary: boolean;
  milestoneNotifications: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  expenseReminders: true,
  insightAlerts: true,
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
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    await this.loadSettings();
    await this.requestPermissions();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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
      } else {
        // If no settings found, reset to defaults
        this.settings = DEFAULT_SETTINGS;
      }
      return this.settings;
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      this.settings = DEFAULT_SETTINGS;
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

  async resetAllData() {
    if (Platform.OS === 'web') return;

    // Cancel all notifications
    await this.cancelAllNotifications();

    // Reset settings to defaults
    this.settings = DEFAULT_SETTINGS;

    // Clear stored settings
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear notification settings:', error);
    }
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

    // Cancel existing expense reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.identifier.startsWith('expense_reminder_')) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

    // Find expenses due in the next 3 days
    const upcomingExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const dueDate = new Date(t.date);
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    });

    if (upcomingExpenses.length > 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'expense_reminder_batch',
        content: {
          title: 'Upcoming Expenses',
          body: `You have ${upcomingExpenses.length} expense${upcomingExpenses.length > 1 ? 's' : ''} coming up in the next few days`,
          data: { type: 'expense_reminder', count: upcomingExpenses.length },
        },
        trigger: {
          date: tomorrow,
        } as Notifications.DateTriggerInput,
      });
    }
  }

  async scheduleWeeklyInsights() {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_insights',
      content: {
        title: 'Weekly Financial Insights',
        body: 'Check out your spending patterns and budget progress for this week!',
        data: { type: 'weekly_insights' },
      },
      trigger: {
        type: 'calendar',
        weekday: 1, // Sunday
        hour: 19, // 7 PM
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  }

  async scheduleWeeklyPlannerReminder() {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_planner_reminder',
      content: {
        title: 'Plan Your Week',
        body: "New week, new plan. Let's map out your money.",
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

  async schedulePaydayReminder(transactions: Transaction[]) {
    if (Platform.OS === 'web' || !this.settings.paydayReminder) return;

    // Cancel existing payday reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.identifier.startsWith('payday_reminder_')) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }

    // Find income transactions with pay schedules
    const incomeTransactions = transactions.filter(
      t => t.type === 'income' && t.paySchedule && t.isRecurring
    );

    const now = new Date();
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    incomeTransactions.forEach(async (income, index) => {
      if (income.paySchedule) {
        // Calculate next payday based on pay schedule
        const nextPayday = this.getNextPayday(income.paySchedule, now);
        if (nextPayday && nextPayday <= nextMonth) {
          // Schedule notification for 8 AM on payday
          const notificationTime = new Date(nextPayday);
          notificationTime.setHours(8, 0, 0, 0);

          await Notifications.scheduleNotificationAsync({
            identifier: `payday_reminder_${income.id}`,
            content: {
              title: "It's Payday!",
              body: `Your ${income.name} paycheck is here! Time to plan your money.`,
              data: { type: 'payday', incomeId: income.id },
            },
            trigger: {
              date: notificationTime,
            } as Notifications.DateTriggerInput,
          });
        }
      }
    });
  }

  private getNextPayday(paySchedule: any, fromDate: Date): Date | null {
    // This is a simplified implementation - you might want to use your existing pay schedule utilities
    const today = new Date(fromDate);
    today.setHours(0, 0, 0, 0);

    if (paySchedule.frequency === 'weekly') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return nextWeek;
    } else if (paySchedule.frequency === 'biweekly') {
      const nextPayday = new Date(today);
      nextPayday.setDate(today.getDate() + 14);
      return nextPayday;
    } else if (paySchedule.frequency === 'monthly') {
      const nextMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        paySchedule.dayOfMonth || 1
      );
      return nextMonth;
    }

    return null;
  }

  async scheduleWeeklyDigest() {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_digest',
      content: {
        title: 'Weekly Wrap-Up',
        body: "See how you spent, saved, and what's ahead next week.",
        data: { type: 'weekly_digest' },
      },
      trigger: {
        type: 'calendar',
        weekday: 1, // Sunday
        hour: 18, // 6 PM
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  }

  async scheduleMilestoneNotification(
    title: string,
    body: string,
    delay = 0
  ) {
    if (Platform.OS === 'web' || !this.settings.milestoneNotifications) return;

    // Only send milestone notifications for significant achievements
    // Add a small delay to avoid spam notifications
    const triggerDate = delay > 0 ? new Date(Date.now() + delay) : null;

    await Notifications.scheduleNotificationAsync({
      identifier: `milestone_${Date.now()}`,
      content: {
        title,
        body,
        data: { type: 'milestone' },
      },
      trigger: triggerDate
        ? ({ date: triggerDate } as Notifications.DateTriggerInput)
        : null,
    });
  }

  // Method to check if a milestone notification should be sent
  shouldSendMilestoneNotification(
    milestoneType: string,
    value: number
  ): boolean {
    // Only send notifications for significant milestones
    const significantMilestones = {
      savings: [100, 500, 1000, 2500, 5000, 10000], // Dollar amounts
      transactions: [10, 25, 50, 100], // Number of transactions
      budgetGoals: [0.5, 0.75, 1.0], // Percentage of goal reached
    };

    if (milestoneType === 'savings') {
      return significantMilestones.savings.includes(Math.floor(value));
    } else if (milestoneType === 'transactions') {
      return significantMilestones.transactions.includes(value);
    } else if (milestoneType === 'budgetGoals') {
      return significantMilestones.budgetGoals.some(
        threshold => Math.abs(value - threshold) < 0.01
      );
    }

    return false;
  }
}

export default new NotificationService();
