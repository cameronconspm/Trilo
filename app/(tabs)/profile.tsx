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
  StatusBar,
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
import { useThemeColors } from '@/constants/colors';
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
  
  // Get theme-aware colors
  const Colors = useThemeColors(theme);

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

    // Request both camera and media library permissions
    const [mediaLibraryStatus, cameraStatus] = await Promise.all([
      ImagePicker.requestMediaLibraryPermissionsAsync(),
      ImagePicker.requestCameraPermissionsAsync(),
    ]);

    if (mediaLibraryStatus.status !== 'granted' && cameraStatus.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your camera or photo library to update your avatar.',
        [{ text: 'OK' }]
      );
      return;
    }

    const options = [
      { text: 'Cancel', style: 'cancel' as const },
    ];
    
    if (cameraStatus.status === 'granted') {
      options.push({ text: 'Camera', onPress: () => openCamera() });
    }
    
    if (mediaLibraryStatus.status === 'granted') {
      options.push({ text: 'Photo Library', onPress: () => openImagePicker() });
    }
    
    if (avatarUri) {
      options.push({ text: 'Remove Photo', style: 'destructive' as const, onPress: () => removeAvatar() });
    }

    Alert.alert(
      'Update Avatar',
      'Choose how you\'d like to update your profile picture',
      options
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

  // Set status bar style based on theme
  const statusBarStyle = theme === 'dark' || (theme === 'system' && Colors.background === '#000000') ? 'light-content' : 'dark-content';

  return (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor={Colors.background} />
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <Header title="Profile" subtitle="Manage your account and preferences" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Account Info */}
          <Card style={[styles.card, { backgroundColor: Colors.card }]}>
            <View style={styles.profileHeader}>
              <Pressable 
                style={styles.avatarContainer} 
                onPress={handleAvatarPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                    <Text style={[styles.avatarText, { color: Colors.card }]}>
                      {nickname?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraIcon, { backgroundColor: Colors.primary, borderColor: Colors.card }]}>
                  <Camera size={16} color={Colors.card} />
                </View>
              </Pressable>
              <View style={styles.nameSection}>
                <Text style={[styles.nameText, { color: Colors.text }, !nickname && { color: Colors.textSecondary }]}>
                  {nickname || 'Add Your Name'}
                </Text>
              </View>
              <Pressable 
                style={styles.editIcon} 
                onPress={() => setShowNameEditModal(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Edit3 size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </Card>

          {/* Preferences */}
          <Card style={[styles.card, { backgroundColor: Colors.card }]}>
            <Text style={[styles.cardTitle, { color: Colors.text }]}>Preferences</Text>
            <SettingsItem title="Theme" value={theme} onPress={() => setShowThemeModal(true)} />
            <SettingsItem title="Week Starts On" value={weekStartDay} onPress={() => setShowWeekStartModal(true)} isLast />
          </Card>

          {/* Notifications */}
          <Card style={[styles.card, { backgroundColor: Colors.card }]}>
            <Text style={[styles.cardTitle, { color: Colors.text }]}>Notifications</Text>
            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: Colors.text }]}>Expense Reminders</Text>
              <Switch
                value={notificationSettings.expenseReminders}
                onValueChange={(value) => updateNotificationSettings({ expenseReminders: value })}
                trackColor={{ false: Colors.inactive, true: Colors.primary }}
                thumbColor={Colors.card}
              />
            </View>
            {notificationSettings.expenseReminders && (
              <Pressable style={[styles.timeRow, { borderColor: Colors.border }]} onPress={() => setShowTimePicker('reminder')}>
                <Text style={[styles.timeLabel, { color: Colors.textSecondary }]}>Reminder Time</Text>
                <Text style={[styles.timeValue, { color: Colors.primary }]}>{formatTime(notificationSettings.reminderTime)}</Text>
              </Pressable>
            )}

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: Colors.text }]}>Weekly Insights</Text>
              <Switch
                value={notificationSettings.insightAlerts}
                onValueChange={(value) => updateNotificationSettings({ insightAlerts: value })}
                trackColor={{ false: Colors.inactive, true: Colors.primary }}
                thumbColor={Colors.card}
              />
            </View>
            {notificationSettings.insightAlerts && (
              <Pressable style={[styles.timeRow, { borderColor: Colors.border }]} onPress={() => setShowTimePicker('insight')}>
                <Text style={[styles.timeLabel, { color: Colors.textSecondary }]}>Insight Time</Text>
                <Text style={[styles.timeValue, { color: Colors.primary }]}>{formatTime(notificationSettings.weeklyInsightTime)}</Text>
              </Pressable>
            )}
          </Card>

          {/* Utilities */}
          <Card style={[styles.card, { backgroundColor: Colors.card }]}>
            <Text style={[styles.cardTitle, { color: Colors.text }]}>Utilities</Text>
            <SettingsItem title="Reset Data" icon={<RefreshCw size={18} color={Colors.destructive} />} onPress={handleResetData} isLast />
          </Card>

          {/* Help & Support */}
          <Card style={[styles.card, { backgroundColor: Colors.card }]}>
            <Text style={[styles.cardTitle, { color: Colors.text }]}>Support</Text>
            <SettingsItem title="Help & Tutorials" icon={<HelpCircle size={18} color={Colors.primary} />} onPress={() => {}} />
            <SettingsItem title="Contact Support" onPress={() => {}} isLast />
          </Card>

          <Text style={[styles.versionText, { color: Colors.inactive }]}>Version 1.0.0 — Data stored locally</Text>
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
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Choose Theme</Text>
            {(['system', 'light', 'dark'] as const).map((themeOption) => (
              <Pressable
                key={themeOption}
                style={[
                  styles.modalOption, 
                  theme === themeOption && [styles.modalOptionSelected, { backgroundColor: Colors.primary }]
                ]}
                onPress={async () => {
                  await setTheme(themeOption);
                  setShowThemeModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText, 
                  { color: Colors.text },
                  theme === themeOption && [styles.modalOptionTextSelected, { color: Colors.card }]
                ]}>
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
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Week Starts On</Text>
            {(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const).map((day) => (
              <Pressable
                key={day}
                style={[
                  styles.modalOption, 
                  weekStartDay === day && [styles.modalOptionSelected, { backgroundColor: Colors.primary }]
                ]}
                onPress={async () => {
                  await setWeekStartDay(day);
                  setShowWeekStartModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText, 
                  { color: Colors.text },
                  weekStartDay === day && [styles.modalOptionTextSelected, { color: Colors.card }]
                ]}>
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
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
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
  },
  timeLabel: {
    fontSize: 14,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    // backgroundColor will be set dynamically
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
  },
});
