import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
} from 'react-native';
import Header from '@/components/Header';
import Card from '@/components/Card';
import SettingsItem from '@/components/SettingsItem';
import Button from '@/components/Button';
import AlertModal from '@/components/AlertModal';
import TimePicker from '@/components/TimePicker';
import { useSettings } from '@/context/SettingsContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAlert } from '@/hooks/useAlert';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Bell, Shield, HelpCircle, RefreshCw, User2 } from 'lucide-react-native';

export default function ProfileScreen() {
  const {
    theme,
    setTheme,
    weekStartDay,
    setWeekStartDay,
    defaultTab,
    setDefaultTab,
    nickname,
    setNickname,
    resetData,
  } = useSettings();

  const {
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
    hasPermission,
    requestPermission,
  } = useNotifications();

  const { alertState, showAlert, hideAlert } = useAlert();
  const [showTimePicker, setShowTimePicker] = useState<'reminder' | 'insight' | 'daily' | null>(null);

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleResetData = () => {
    showAlert({
      title: 'Reset All Data',
      message: 'This will delete all transactions and preferences.',
      type: 'warning',
      actions: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            await resetData();
          },
        },
      ],
    });
  };

  return (
    <>
      <View style={styles.container}>
        <Header title="Profile" subtitle="Customize your experience" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Account Overview */}
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Nickname</Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="Enter your name"
                style={styles.textInput}
              />
            </View>
          </Card>

          {/* Preferences */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            <SettingsItem title="Theme" value={theme} onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
            <SettingsItem title="Week Starts On" value={weekStartDay} onPress={() => setWeekStartDay('monday')} />
            <SettingsItem title="Default Tab" value={defaultTab} onPress={() => setDefaultTab('Overview')} isLast />
          </Card>

          {/* Notifications */}
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Expense Reminders</Text>
              <Switch
                value={notificationSettings.expenseReminders}
                onValueChange={(value) => updateNotificationSettings({ expenseReminders: value })}
              />
            </View>
            <Pressable style={styles.timeRow} onPress={() => setShowTimePicker('reminder')}>
              <Text style={styles.timeLabel}>Reminder Time</Text>
              <Text style={styles.timeValue}>{formatTime(notificationSettings.reminderTime)}</Text>
            </Pressable>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Weekly Insights</Text>
              <Switch
                value={notificationSettings.insightAlerts}
                onValueChange={(value) => updateNotificationSettings({ insightAlerts: value })}
              />
            </View>
            <Pressable style={styles.timeRow} onPress={() => setShowTimePicker('insight')}>
              <Text style={styles.timeLabel}>Insight Time</Text>
              <Text style={styles.timeValue}>{formatTime(notificationSettings.weeklyInsightTime)}</Text>
            </Pressable>
          </Card>

          {/* App Utilities */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Utilities</Text>
            <SettingsItem title="Reset Data" icon={<RefreshCw size={18} color={Colors.destructive} />} onPress={handleResetData} />
            <SettingsItem title="Export Data" onPress={() => {}} />
            <SettingsItem title="Import Data" onPress={() => {}} isLast />
          </Card>

          {/* Help & Support */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Support</Text>
            <SettingsItem title="Help & Tutorials" icon={<HelpCircle size={18} color={Colors.primary} />} onPress={() => {}} />
            <SettingsItem title="Report a Bug" onPress={() => {}} />
            <SettingsItem title="Contact Support" onPress={() => {}} isLast />
          </Card>

          <Text style={styles.versionText}>Version 1.0.0 — Data stored locally</Text>
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
            const setting = showTimePicker === 'reminder' ? 'reminderTime' : 'weeklyInsightTime';
            updateNotificationSettings({ [setting]: time });
            setShowTimePicker(null);
          }}
          onClose={() => setShowTimePicker(null)}
        />
      )}

      <AlertModal {...alertState} onClose={hideAlert} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    flex: 1,
    textAlign: 'right',
    color: Colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.inactive,
    paddingVertical: Spacing.lg,
  },
});
