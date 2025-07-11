// ProfileScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useSettings } from '@/context/SettingsContext';
import { useFinance } from '@/context/FinanceContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAlert } from '@/hooks/useAlert';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import AlertModal from '@/components/AlertModal';
import TimePicker from '@/components/TimePicker';
import SettingsItem from '@/components/SettingsItem';
import { Bell, Shield, HelpCircle, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

export default function ProfileScreen() {
  const {
    theme,
    setTheme,
    weekStartDay,
    setWeekStartDay,
    resetData,
    isLoading: settingsLoading,
  } = useSettings();

  const { clearAllData, transactions } = useFinance();
  const {
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
    hasPermission,
    requestPermission,
    isLoading: notificationsLoading,
  } = useNotifications();

  const { alertState, showAlert, hideAlert } = useAlert();
  const [showTimePicker, setShowTimePicker] = useState<'reminder' | 'insight' | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const handleResetData = () => {
    showAlert({
      title: 'Reset All Data',
      message: `This will permanently delete all ${transactions.length} transactions. This action cannot be undone.`,
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await resetData();
              showAlert({
                title: 'Success',
                message: 'All data has been cleared.',
                type: 'success',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            } catch (e) {
              showAlert({
                title: 'Error',
                message: 'Could not reset data.',
                type: 'error',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
        },
      ],
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatWeekStartDay = (day: string) =>
    day.charAt(0).toUpperCase() + day.slice(1);

  if (settingsLoading || notificationsLoading) {
    return (
      <View style={styles.container}>
        <Header title="Profile" subtitle="Loading..." />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Header title="Profile" subtitle="Preferences & settings" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.profileCard}>
            <Text style={styles.profileTitle}>Personal Account</Text>
            <Text style={styles.profileSubtitle}>Data stored locally</Text>
            <Text style={styles.transactionCount}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </Text>
          </Card>

          {/* Notifications */}
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <Card>
            <SettingsItem
              title="Expense Reminders"
              subtitle="Get notified before bills are due"
              toggle
              value={notificationSettings.expenseReminders}
              onToggle={(value) =>
                updateNotificationSettings({ expenseReminders: value })
              }
            />
            {notificationSettings.expenseReminders && (
              <Pressable
                style={styles.timeRow}
                onPress={() => setShowTimePicker('reminder')}
              >
                <Text style={styles.timeLabel}>Reminder Time</Text>
                <Text style={styles.timeValue}>{formatTime(notificationSettings.reminderTime)}</Text>
              </Pressable>
            )}
            <SettingsItem
              title="Weekly Insights"
              subtitle="Receive weekly spend summaries"
              toggle
              value={notificationSettings.insightAlerts}
              onToggle={(value) =>
                updateNotificationSettings({ insightAlerts: value })
              }
            />
            {notificationSettings.insightAlerts && (
              <>
                <Pressable
                  style={styles.timeRow}
                  onPress={() => setShowDayPicker(true)}
                >
                  <Text style={styles.timeLabel}>Insight Day</Text>
                  <Text style={styles.timeValue}>
                    {formatWeekStartDay(notificationSettings.weeklyInsightDay)}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.timeRow}
                  onPress={() => setShowTimePicker('insight')}
                >
                  <Text style={styles.timeLabel}>Insight Time</Text>
                  <Text style={styles.timeValue}>
                    {formatTime(notificationSettings.weeklyInsightTime)}
                  </Text>
                </Pressable>
              </>
            )}
          </Card>

          {/* Preferences */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <Card>
            <SettingsItem
              title="Theme"
              value={theme.charAt(0).toUpperCase() + theme.slice(1)}
              onPress={() => showAlert({ title: 'Theme Options', message: 'Theme switching not implemented yet.', type: 'info', actions: [{ text: 'OK', onPress: () => {} }] })}
            />
            <SettingsItem
              title="Week Starts On"
              value={formatWeekStartDay(weekStartDay)}
              onPress={() => showAlert({ title: 'Week Start Day', message: 'Week start setting not implemented yet.', type: 'info', actions: [{ text: 'OK', onPress: () => {} }] })}
              isLast
            />
          </Card>

          {/* Data & Support */}
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Data & Support</Text>
          </View>
          <Card>
            <SettingsItem
              title="Reset All Data"
              subtitle="Clear all transactions and preferences"
              icon={<RefreshCw size={20} color={Colors.destructive} />}
              onPress={handleResetData}
            />
            <SettingsItem
              title="Help"
              subtitle="FAQ and troubleshooting"
              icon={<HelpCircle size={20} color={Colors.textSecondary} />}
              onPress={() =>
                showAlert({
                  title: 'Help Center',
                  message: 'Visit the help center for FAQs and tips.',
                  type: 'info',
                  actions: [{ text: 'OK', onPress: () => {} }],
                })
              }
            />
          </Card>
        </ScrollView>
      </View>

      {showTimePicker && (
        <TimePicker
          value={
            showTimePicker === 'reminder'
              ? notificationSettings.reminderTime
              : notificationSettings.weeklyInsightTime
          }
          onChange={(time) => {
            const key =
              showTimePicker === 'reminder' ? 'reminderTime' : 'weeklyInsightTime';
            updateNotificationSettings({ [key]: time });
            setShowTimePicker(null);
          }}
          onClose={() => setShowTimePicker(null)}
        />
      )}

      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        actions={alertState.actions}
        onClose={hideAlert}
      />
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.inactive,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  profileCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.cardSecondary,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  profileSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 13,
    color: Colors.inactive,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  timeLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
});
