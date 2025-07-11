import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Modal,
} from 'react-native';
import Header from '@/components/Header';
import Card from '@/components/Card';
import SettingsItem from '@/components/SettingsItem';
import AlertModal from '@/components/AlertModal';
import TimePicker from '@/components/TimePicker';
import { useSettings } from '@/context/SettingsContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAlert } from '@/hooks/useAlert';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Shield, HelpCircle, RefreshCw } from 'lucide-react-native';

export default function ProfileScreen() {
  const {
    theme,
    setTheme,
    weekStartDay,
    setWeekStartDay,
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
  const [showTimePicker, setShowTimePicker] = useState<'reminder' | 'insight' | null>(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showWeekStartModal, setShowWeekStartModal] = useState(false);

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
        <Header title="Profile" subtitle="Manage your account and preferences" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Account Info */}
          <Card style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{nickname?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Enter your name"
                  style={styles.nameInput}
                />
              </View>
            </View>
          </Card>

          {/* Preferences */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            <SettingsItem title="Theme" value={theme} onPress={() => setShowThemeModal(true)} />
            <SettingsItem title="Week Starts On" value={weekStartDay} onPress={() => setShowWeekStartModal(true)} isLast />
          </Card>

          {/* Notifications */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.itemLabel}>Expense Reminders</Text>
              <Switch
                value={notificationSettings.expenseReminders}
                onValueChange={(value) => updateNotificationSettings({ expenseReminders: value })}
              />
            </View>
            {notificationSettings.expenseReminders && (
              <Pressable style={styles.timeRow} onPress={() => setShowTimePicker('reminder')}>
                <Text style={styles.timeLabel}>Reminder Time</Text>
                <Text style={styles.timeValue}>{formatTime(notificationSettings.reminderTime)}</Text>
              </Pressable>
            )}

            <View style={styles.rowBetween}>
              <Text style={styles.itemLabel}>Weekly Insights</Text>
              <Switch
                value={notificationSettings.insightAlerts}
                onValueChange={(value) => updateNotificationSettings({ insightAlerts: value })}
              />
            </View>
            {notificationSettings.insightAlerts && (
              <Pressable style={styles.timeRow} onPress={() => setShowTimePicker('insight')}>
                <Text style={styles.timeLabel}>Insight Time</Text>
                <Text style={styles.timeValue}>{formatTime(notificationSettings.weeklyInsightTime)}</Text>
              </Pressable>
            )}
          </Card>

          {/* Utilities */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Utilities</Text>
            <SettingsItem title="Reset Data" icon={<RefreshCw size={18} color={Colors.destructive} />} onPress={handleResetData} isLast />
          </Card>

          {/* Help & Support */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Support</Text>
            <SettingsItem title="Help & Tutorials" icon={<HelpCircle size={18} color={Colors.primary} />} onPress={() => {}} />
            <SettingsItem title="Contact Support" onPress={() => {}} isLast />
          </Card>

          <Text style={styles.versionText}>Version 1.0.0 — Data stored locally</Text>
        </ScrollView>
      </View>

      {showTimePicker && (
        <TimePicker
          value={showTimePicker === 'reminder' ? notificationSettings.reminderTime : notificationSettings.weeklyInsightTime}
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
    borderRadius: BorderRadius.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.card,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  nameInput: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
