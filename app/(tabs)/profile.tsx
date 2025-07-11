import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { useSettings } from '@/context/SettingsContext';
import { useFinance } from '@/context/FinanceContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAlert } from '@/hooks/useAlert';
import Header from '@/components/Header';
import SettingsItem from '@/components/SettingsItem';
import Card from '@/components/Card';
import Button from '@/components/Button';
import AlertModal from '@/components/AlertModal';
import TimePicker from '@/components/TimePicker';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Bell, Shield, HelpCircle, Trash2, RefreshCw } from 'lucide-react-native';

export default function ProfileScreen() {
  const { 
    theme, 
    setTheme, 
    weekStartDay, 
    setWeekStartDay,
    resetData,
    isLoading: settingsLoading
  } = useSettings();
  
  const { clearAllData, transactions } = useFinance();
  const { 
    settings: notificationSettings, 
    updateSettings: updateNotificationSettings,
    hasPermission,
    requestPermission,
    isLoading: notificationsLoading
  } = useNotifications();
  const { alertState, showAlert, hideAlert } = useAlert();
  
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showWeekStartOptions, setShowWeekStartOptions] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'reminder' | 'insight' | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  
  const handleThemeChange = async (newTheme: 'system' | 'light' | 'dark') => {
    try {
      await setTheme(newTheme);
      setShowThemeOptions(false);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to save theme setting. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };
  
  const handleWeekStartChange = async (day: string) => {
    try {
      await setWeekStartDay(day as any);
      setShowWeekStartOptions(false);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to save week start day. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleNotificationToggle = async (setting: 'expenseReminders' | 'insightAlerts', value: boolean) => {
    if (value && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        showAlert({
          title: 'Permission Required',
          message: 'Please enable notifications in your device settings to receive reminders and insights.',
          type: 'warning',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
        return;
      }
    }

    try {
      await updateNotificationSettings({ [setting]: value });
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to update notification settings. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleTimeChange = async (type: 'reminder' | 'insight', time: string) => {
    try {
      const setting = type === 'reminder' ? 'reminderTime' : 'weeklyInsightTime';
      await updateNotificationSettings({ [setting]: time });
      setShowTimePicker(null);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to update time setting. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleInsightDayChange = async (day: string) => {
    try {
      await updateNotificationSettings({ weeklyInsightDay: day });
      setShowDayPicker(false);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to update insight day. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };
  
  const handleResetData = () => {
    showAlert({
      title: 'Reset All Data',
      message: `This will permanently delete all ${transactions.length} transactions and reset your financial data. This action cannot be undone.`,
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { 
          text: 'Reset Everything', 
          onPress: async () => {
            try {
              await clearAllData();
              await resetData();
              showAlert({
                title: 'Success',
                message: 'All data has been reset successfully.',
                type: 'success',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            } catch (error) {
              showAlert({
                title: 'Error',
                message: 'Failed to reset data. Please try again.',
                type: 'error',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
          style: 'destructive'
        }
      ],
    });
  };
  
  const formatWeekStartDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
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
        <Header title="Profile" subtitle="Settings & preferences" />
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Account Overview */}
          <Card variant="elevated" style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>Personal Account</Text>
                <Text style={styles.accountStatus}>Local Storage</Text>
                <Text style={styles.transactionCount}>
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </Card>

          {/* Notification Settings */}
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <Card variant="subtle">
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Expense Reminders</Text>
                <Text style={styles.settingSubtitle}>
                  Get notified {notificationSettings.reminderDaysBefore} day{notificationSettings.reminderDaysBefore !== 1 ? 's' : ''} before expenses are due
                </Text>
              </View>
              <Switch
                value={notificationSettings.expenseReminders}
                onValueChange={(value) => handleNotificationToggle('expenseReminders', value)}
                trackColor={{ false: Colors.inactive, true: Colors.primary }}
                thumbColor={Colors.card}
              />
            </View>

            {notificationSettings.expenseReminders && (
              <Pressable 
                style={styles.timeRow}
                onPress={() => setShowTimePicker('reminder')}
              >
                <Text style={styles.timeLabel}>Reminder Time</Text>
                <Text style={styles.timeValue}>
                  {formatTime(notificationSettings.reminderTime)}
                </Text>
              </Pressable>
            )}

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Weekly Insights</Text>
                <Text style={styles.settingSubtitle}>
                  Get weekly spending summaries and budget insights
                </Text>
              </View>
              <Switch
                value={notificationSettings.insightAlerts}
                onValueChange={(value) => handleNotificationToggle('insightAlerts', value)}
                trackColor={{ false: Colors.inactive, true: Colors.primary }}
                thumbColor={Colors.card}
              />
            </View>

            {notificationSettings.insightAlerts && (
              <>
                {showDayPicker ? (
                  <View style={styles.dayPicker}>
                    {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                      <Pressable
                        key={day}
                        style={[
                          styles.dayOption,
                          notificationSettings.weeklyInsightDay === day && styles.selectedDay
                        ]}
                        onPress={() => handleInsightDayChange(day)}
                      >
                        <Text style={[
                          styles.dayText,
                          notificationSettings.weeklyInsightDay === day && styles.selectedDayText
                        ]}>
                          {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Pressable 
                    style={styles.timeRow}
                    onPress={() => setShowDayPicker(true)}
                  >
                    <Text style={styles.timeLabel}>Insight Day</Text>
                    <Text style={styles.timeValue}>
                      {formatWeekStartDay(notificationSettings.weeklyInsightDay)}
                    </Text>
                  </Pressable>
                )}

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

            {!hasPermission && (
              <View style={styles.permissionWarning}>
                <Text style={styles.permissionText}>
                  Notifications are disabled. Enable them in your device settings to receive reminders.
                </Text>
              </View>
            )}
          </Card>

          {/* Preferences */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <Card variant="subtle">
            {showThemeOptions ? (
              <>
                <SettingsItem 
                  title="System (Default)" 
                  onPress={() => handleThemeChange('system')}
                />
                <SettingsItem 
                  title="Light" 
                  onPress={() => handleThemeChange('light')}
                />
                <SettingsItem 
                  title="Dark" 
                  onPress={() => handleThemeChange('dark')}
                  isLast
                />
              </>
            ) : (
              <SettingsItem 
                title="Appearance" 
                value={theme.charAt(0).toUpperCase() + theme.slice(1)}
                onPress={() => setShowThemeOptions(true)}
              />
            )}
            
            {showWeekStartOptions ? (
              <>
                {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day, index, array) => (
                  <SettingsItem 
                    key={day}
                    title={formatWeekStartDay(day)} 
                    onPress={() => handleWeekStartChange(day)}
                    isLast={index === array.length - 1}
                  />
                ))}
              </>
            ) : (
              <SettingsItem 
                title="Week starts on" 
                value={formatWeekStartDay(weekStartDay)}
                onPress={() => setShowWeekStartOptions(true)}
                isLast
              />
            )}
          </Card>
          
          {/* Data & Support */}
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Data & Support</Text>
          </View>
          <Card variant="subtle">
            <View style={styles.actionRow}>
              <RefreshCw size={20} color={Colors.destructive} />
              <Pressable style={styles.actionContent} onPress={handleResetData}>
                <Text style={styles.actionTitle}>Reset Data</Text>
                <Text style={styles.actionSubtitle}>
                  Clear all transactions and settings
                </Text>
              </Pressable>
            </View>
            
            <View style={styles.actionRow}>
              <HelpCircle size={20} color={Colors.textSecondary} />
              <Pressable 
                style={styles.actionContent}
                onPress={() => showAlert({
                  title: 'Help Center',
                  message: 'Access tutorials, FAQs, and troubleshooting guides to get the most out of your finance tracker.',
                  type: 'info',
                  actions: [{ text: 'OK', onPress: () => {} }],
                })}
              >
                <Text style={styles.actionTitle}>Help</Text>
                <Text style={styles.actionSubtitle}>
                  Tutorials and troubleshooting
                </Text>
              </Pressable>
            </View>
            
            <View style={styles.actionRow}>
              <HelpCircle size={20} color={Colors.textSecondary} />
              <Pressable 
                style={[styles.actionContent, styles.lastAction]}
                onPress={() => showAlert({
                  title: 'Contact Support',
                  message: 'Need help? Send us a message and we\'ll get back to you as soon as possible.',
                  type: 'info',
                  actions: [{ text: 'OK', onPress: () => {} }],
                })}
              >
                <Text style={styles.actionTitle}>Contact Support</Text>
                <Text style={styles.actionSubtitle}>
                  Get help from our team
                </Text>
              </Pressable>
            </View>
          </Card>
          
          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appCopyright}>© 2024 Finance Tracker</Text>
            <Text style={styles.storageInfo}>
              Data stored locally on your device
            </Text>
          </View>
        </ScrollView>
      </View>
      
      {showTimePicker && (
        <TimePicker
          value={showTimePicker === 'reminder' ? notificationSettings.reminderTime : notificationSettings.weeklyInsightTime}
          onChange={(time) => handleTimeChange(showTimePicker, time)}
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
  accountCard: {
    marginBottom: Spacing.lg,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.card,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  accountStatus: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 13,
    color: Colors.inactive,
    fontWeight: '500' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginLeft: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  timeValue: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  dayPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayOption: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  selectedDayText: {
    color: Colors.card,
  },
  permissionWarning: {
    backgroundColor: Colors.warning + '20',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    margin: Spacing.lg,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.warning,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  lastAction: {
    borderBottomWidth: 0,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: Spacing.xs,
  },
  appCopyright: {
    fontSize: 12,
    color: Colors.inactive,
    marginBottom: Spacing.xs,
  },
  storageInfo: {
    fontSize: 11,
    color: Colors.inactive,
    fontStyle: 'italic' as const,
  },
});