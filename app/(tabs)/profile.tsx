import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import { Shield, HelpCircle, RefreshCw, Edit3, Camera } from 'lucide-react-native';
import NameEditModal from '@/components/NameEditModal';

export default function ProfileScreen() {
  const {
    theme,
    setTheme,
    weekStartDay,
    setWeekStartDay,
    nickname,
    setNickname,
    avatarUri,
    setAvatarUri,
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
  const [showNameEditModal, setShowNameEditModal] = useState(false);

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAvatarPress = async () => {
    if (Platform.OS === 'web') {
      // For web, show a simple alert
      Alert.alert(
        'Avatar Upload',
        'Avatar upload is not available on web. This feature works on mobile devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to update your avatar.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Update Avatar',
      'Choose how you\'d like to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImagePicker() },
        ...(avatarUri ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => removeAvatar() }] : []),
      ]
    );
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await setAvatarUri(result.assets[0].uri);
    }
  };

  const openImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await setAvatarUri(result.assets[0].uri);
    }
  };

  const removeAvatar = async () => {
    await setAvatarUri(null);
  };

  const handleNameSave = async (name: string) => {
    await setNickname(name);
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
              <Pressable style={styles.avatarContainer} onPress={handleAvatarPress}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {nickname?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Camera size={16} color={Colors.card} />
                </View>
              </Pressable>
              <View style={styles.nameSection}>
                <Text style={[styles.nameText, !nickname && styles.nameTextPlaceholder]}>
                  {nickname || 'Add Your Name'}
                </Text>
              </View>
              <Pressable style={styles.editIcon} onPress={() => setShowNameEditModal(true)}>
                <Edit3 size={18} color={Colors.textSecondary} />
              </Pressable>
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
      
      <NameEditModal
        visible={showNameEditModal}
        currentName={nickname}
        onSave={handleNameSave}
        onClose={() => setShowNameEditModal(false)}
      />

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowThemeModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Theme</Text>
            {(['system', 'light', 'dark'] as const).map((themeOption) => (
              <Pressable
                key={themeOption}
                style={[styles.modalOption, theme === themeOption && styles.modalOptionSelected]}
                onPress={async () => {
                  await setTheme(themeOption);
                  setShowThemeModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, theme === themeOption && styles.modalOptionTextSelected]}>
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Week Start Day Selection Modal */}
      <Modal
        visible={showWeekStartModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeekStartModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowWeekStartModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Week Starts On</Text>
            {(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const).map((day) => (
              <Pressable
                key={day}
                style={[styles.modalOption, weekStartDay === day && styles.modalOptionSelected]}
                onPress={async () => {
                  await setWeekStartDay(day);
                  setShowWeekStartModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, weekStartDay === day && styles.modalOptionTextSelected]}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    gap: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.card,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  nameTextPlaceholder: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  editIcon: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: Spacing.minTouchTarget,
    minHeight: Spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: Colors.primary,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: Colors.card,
    fontWeight: '600',
  },
});
