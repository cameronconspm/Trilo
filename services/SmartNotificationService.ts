import React, { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { UserChallenge, UserBadge } from '@/types/finance';

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

interface NotificationData {
  id: string;
  type: 'challenge_progress' | 'challenge_completion' | 'badge_unlock' | 'streak_reminder' | 'weekly_recap';
  title: string;
  body: string;
  data?: any;
  scheduledTime?: Date;
}

interface SmartNotificationService {
  scheduleNotification: (notification: NotificationData) => Promise<void>;
  cancelNotification: (id: string) => Promise<void>;
  scheduleWeeklyRecap: () => Promise<void>;
  scheduleChallengeReminders: (challenges: UserChallenge[]) => Promise<void>;
  scheduleStreakReminders: () => Promise<void>;
  scheduleBadgeUnlockNotifications: (badges: UserBadge[]) => Promise<void>;
  generateMotivationalNudge: (challenge: UserChallenge) => NotificationData;
  generateStreakReminder: () => NotificationData;
  generateBadgeUnlockNotification: (badge: UserBadge) => NotificationData;
}

class NotificationService implements SmartNotificationService {
  private readonly STORAGE_KEY = 'notification_preferences';
  private readonly WEEKLY_RECAP_ID = 'weekly_recap';
  private readonly CHALLENGE_REMINDER_PREFIX = 'challenge_reminder_';
  private readonly STREAK_REMINDER_ID = 'streak_reminder';
  private readonly BADGE_UNLOCK_PREFIX = 'badge_unlock_';

  async scheduleNotification(notification: NotificationData): Promise<void> {
    try {
      const notificationContent = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      };

      if (notification.scheduledTime) {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: notification.scheduledTime as any,
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async scheduleWeeklyRecap(): Promise<void> {
    try {
      // Cancel existing weekly recap
      await this.cancelNotification(this.WEEKLY_RECAP_ID);

      // Schedule for every Sunday at 7 PM
      const now = new Date();
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + (7 - now.getDay()));
      nextSunday.setHours(19, 0, 0, 0);

      // If it's already past 7 PM on Sunday, schedule for next week
      if (now.getDay() === 0 && now.getHours() >= 19) {
        nextSunday.setDate(nextSunday.getDate() + 7);
      }

      const notification: NotificationData = {
        id: this.WEEKLY_RECAP_ID,
        type: 'weekly_recap',
        title: '📊 Your Weekly Financial Recap is Ready!',
        body: 'Check out your progress, achievements, and new challenges for this week.',
        scheduledTime: nextSunday,
        data: { type: 'weekly_recap' }
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error scheduling weekly recap:', error);
    }
  }

  async scheduleChallengeReminders(challenges: UserChallenge[]): Promise<void> {
    try {
      for (const challenge of challenges) {
        const reminderId = `${this.CHALLENGE_REMINDER_PREFIX}${challenge.id}`;
        
        // Cancel existing reminder
        await this.cancelNotification(reminderId);

        // Generate motivational nudge
        const nudge = this.generateMotivationalNudge(challenge);
        
        // Schedule reminder for 2 days before challenge ends
        const endDate = new Date(challenge.end_date);
        const reminderDate = new Date(endDate);
        reminderDate.setDate(endDate.getDate() - 2);
        reminderDate.setHours(18, 0, 0, 0); // 6 PM

        // Only schedule if reminder date is in the future
        if (reminderDate > new Date()) {
          const notification: NotificationData = {
            ...nudge,
            id: reminderId,
            scheduledTime: reminderDate,
          };

          await this.scheduleNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error scheduling challenge reminders:', error);
    }
  }

  async scheduleStreakReminders(): Promise<void> {
    try {
      // Cancel existing streak reminder
      await this.cancelNotification(this.STREAK_REMINDER_ID);

      // Schedule for every day at 9 AM
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const notification: NotificationData = {
        ...this.generateStreakReminder(),
        id: this.STREAK_REMINDER_ID,
        scheduledTime: tomorrow,
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error scheduling streak reminders:', error);
    }
  }

  async scheduleBadgeUnlockNotifications(badges: UserBadge[]): Promise<void> {
    try {
      for (const badge of badges) {
        const notificationId = `${this.BADGE_UNLOCK_PREFIX}${badge.id}`;
        
        // Check if we've already notified about this badge
        const hasNotified = await AsyncStorage.getItem(notificationId);
        if (hasNotified) continue;

        const notification = this.generateBadgeUnlockNotification(badge);
        await this.scheduleNotification(notification);
        
        // Mark as notified
        await AsyncStorage.setItem(notificationId, 'true');
      }
    } catch (error) {
      console.error('Error scheduling badge unlock notifications:', error);
    }
  }

  generateMotivationalNudge(challenge: UserChallenge): NotificationData {
    const progressPercentage = Math.round(challenge.progress_percentage);
    const remainingAmount = challenge.target_amount - challenge.current_amount;
    
    let title: string;
    let body: string;

    if (progressPercentage >= 90) {
      title = '🎯 Almost There!';
      body = `You're ${progressPercentage}% complete with "${challenge.challenge_name}"! Just $${remainingAmount.toFixed(2)} to go!`;
    } else if (progressPercentage >= 50) {
      title = '💪 Great Progress!';
      body = `You're halfway through "${challenge.challenge_name}"! Keep up the momentum!`;
    } else if (progressPercentage >= 25) {
      title = '🚀 Getting Started!';
      body = `You're making progress on "${challenge.challenge_name}"! Every step counts!`;
    } else {
      title = '🌟 New Challenge!';
      body = `Ready to tackle "${challenge.challenge_name}"? You've got this!`;
    }

    return {
      id: `${this.CHALLENGE_REMINDER_PREFIX}${challenge.id}`,
      type: 'challenge_progress',
      title,
      body,
      data: { challengeId: challenge.id, type: 'challenge_progress' }
    };
  }

  generateStreakReminder(): NotificationData {
    const streakMessages = [
      {
        title: '🔥 Streak Alert!',
        body: 'You\'ve been crushing your financial goals! Don\'t break the streak today!'
      },
      {
        title: '💎 Consistency is Key!',
        body: 'Your daily financial habits are building wealth. Keep it up!'
      },
      {
        title: '⭐ You\'re on Fire!',
        body: 'Your financial discipline is paying off. Stay consistent!'
      },
      {
        title: '🏆 Streak Master!',
        body: 'You\'re building amazing financial habits. Don\'t stop now!'
      }
    ];

    const randomMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)];

    return {
      id: this.STREAK_REMINDER_ID,
      type: 'streak_reminder',
      title: randomMessage.title,
      body: randomMessage.body,
      data: { type: 'streak_reminder' }
    };
  }

  generateBadgeUnlockNotification(badge: UserBadge): NotificationData {
    const badgeMessages = {
      'debt_buster': {
        title: '🏆 Debt Buster Badge Unlocked!',
        body: 'Congratulations! You\'ve earned your first debt payoff badge. Keep crushing those financial goals!'
      },
      'saver_star': {
        title: '⭐ Saver Star Badge Unlocked!',
        body: 'Amazing work! Your savings habits are paying off. You\'re building a brighter financial future!'
      },
      'no_spend_ninja': {
        title: '🥷 No Spend Ninja Badge Unlocked!',
        body: 'Incredible discipline! You\'ve mastered the art of mindful spending. Your wallet thanks you!'
      },
      'streak_master': {
        title: '🔥 Streak Master Badge Unlocked!',
        body: 'Outstanding consistency! You\'ve proven that small daily actions lead to big results!'
      },
      'emergency_hero': {
        title: '🛡️ Emergency Hero Badge Unlocked!',
        body: 'Fantastic! You\'ve built a solid emergency fund. You\'re now prepared for life\'s surprises!'
      }
    };

    const message = badgeMessages[badge.badge_name as keyof typeof badgeMessages] || {
      title: '🏅 New Badge Unlocked!',
      body: `Congratulations! You've earned the "${badge.badge_name}" badge. Keep up the great work!`
    };

    return {
      id: `${this.BADGE_UNLOCK_PREFIX}${badge.id}`,
      type: 'badge_unlock',
      title: message.title,
      body: message.body,
      data: { badgeId: badge.id, type: 'badge_unlock' }
    };
  }

  // Utility methods
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }
}

// Export singleton instance
export const smartNotificationService = new NotificationService();

// React hook for using the notification service
export function useSmartNotifications() {
  const { activeChallenges, userBadges } = useChallengeTracking();
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const granted = await smartNotificationService.requestPermissions();
    setPermissionsGranted(granted);
  };

  const scheduleAllNotifications = useCallback(async () => {
    if (!permissionsGranted) return;

    try {
      // Schedule weekly recap
      await smartNotificationService.scheduleWeeklyRecap();
      
      // Schedule challenge reminders
      await smartNotificationService.scheduleChallengeReminders(activeChallenges);
      
      // Schedule streak reminders
      await smartNotificationService.scheduleStreakReminders();
      
      // Schedule badge unlock notifications
      await smartNotificationService.scheduleBadgeUnlockNotifications(userBadges);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }, [permissionsGranted, activeChallenges, userBadges]);

  const sendImmediateNotification = useCallback(async (title: string, body: string, data?: any) => {
    if (!permissionsGranted) return;

    await smartNotificationService.scheduleNotification({
      id: `immediate_${Date.now()}`,
      type: 'challenge_progress',
      title,
      body,
      data,
    });
  }, [permissionsGranted]);

  return {
    permissionsGranted,
    scheduleAllNotifications,
    sendImmediateNotification,
    requestPermissions: checkPermissions,
  };
}
