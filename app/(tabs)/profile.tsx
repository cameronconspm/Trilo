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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Header from '@/components/Header';
import Card from '@/components/Card';
import SettingsItem from '@/components/SettingsItem';
import AlertModal from '@/components/AlertModal';
import { useSettings } from '@/context/SettingsContext';
import { useNotifications } from '@/context/NotificationContext';
import { useFinance } from '@/context/FinanceContext';
import { useAlert } from '@/hooks/useAlert';
import { useThemeColors } from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Shield, Mail, RefreshCw, Edit3, Camera, Upload, ExternalLink } from 'lucide-react-native';
import NameEditModal from '@/components/NameEditModal';
import { Transaction, CategoryType } from '@/types/finance';

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
  } = useNotifications();

  const { clearAllData: clearFinanceData, reloadData: reloadFinanceData, addTransaction } = useFinance();

  const { alertState, showAlert, hideAlert } = useAlert();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showWeekStartModal, setShowWeekStartModal] = useState(false);
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Get theme-aware colors
  const colors = useThemeColors(theme);



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

    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Cancel', style: 'cancel' },
    ];
    
    if (cameraStatus.status === 'granted') {
      options.push({ text: 'Camera', onPress: () => openCamera() });
    }
    
    if (mediaLibraryStatus.status === 'granted') {
      options.push({ text: 'Photo Library', onPress: () => openImagePicker() });
    }
    
    if (avatarUri) {
      options.push({ text: 'Remove Photo', style: 'destructive', onPress: () => removeAvatar() });
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
      message: 'This will permanently delete all transactions, preferences, and settings. This action cannot be undone.',
      type: 'warning',
      actions: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear financial data first
              await clearFinanceData();
              
              // Then clear all settings and other data
              await resetData();
              
              // Reload financial data to reset state
              await reloadFinanceData();
              
              showAlert({
                title: 'Data Reset Complete',
                message: 'All data has been successfully deleted. The app has been reset to default settings.',
                type: 'success',
                actions: [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Force app to reload by reloading the page (web) or restarting (mobile)
                      if (Platform.OS === 'web') {
                        window.location.reload();
                      }
                    }
                  }
                ],
              });
            } catch (error) {
              console.error('Reset data error:', error);
              showAlert({
                title: 'Reset Failed',
                message: 'There was an error resetting your data. Please try again.',
                type: 'error',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
        },
      ],
    });
  };

  const handlePrivacyPolicy = async () => {
    const url = 'https://www.thetriloapp.com/privacy-policy';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open privacy policy link');
      }
    } catch {
      Alert.alert('Error', 'Unable to open privacy policy link');
    }
  };

  const handleContactSupport = async () => {
    const email = 'support@thetriloapp.com';
    const subject = 'Support Request';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Email Not Available', 'Please send an email to support@thetriloapp.com');
      }
    } catch {
      Alert.alert('Email Not Available', 'Please send an email to support@thetriloapp.com');
    }
  };

  const handleImportCSV = async () => {
    try {
      setIsImporting(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      if (!file) {
        throw new Error('No file selected');
      }

      // Read the file content
      let csvContent: string;
      if (Platform.OS === 'web') {
        // For web, we need to read the file differently
        const response = await fetch(file.uri);
        csvContent = await response.text();
      } else {
        // For mobile, read from the file system
        const response = await fetch(file.uri);
        csvContent = await response.text();
      }

      // Parse CSV content
      const importedTransactions = parseCSV(csvContent);
      
      if (importedTransactions.length === 0) {
        throw new Error('No valid transactions found in CSV file');
      }

      // Add all transactions
      let successCount = 0;
      let errorCount = 0;
      
      for (const transaction of importedTransactions) {
        try {
          await addTransaction(transaction);
          successCount++;
        } catch (error) {
          console.error('Error adding transaction:', error);
          errorCount++;
        }
      }

      // Show success message
      showAlert({
        title: 'Import Complete',
        message: `Successfully imported ${successCount} expenses${errorCount > 0 ? `. ${errorCount} transactions failed to import.` : '.'}`,
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });

    } catch (error) {
      console.error('CSV Import Error:', error);
      showAlert({
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Failed to import CSV file. Please check the file format and try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const parseCSV = (csvContent: string): Omit<Transaction, 'id'>[] => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const transactions: Omit<Transaction, 'id'>[] = [];

    // Validate required headers
    const requiredHeaders = ['expense name', 'amount', 'category', 'day of month', 'recurring'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.includes(header.replace(' ', '')) || h.includes(header))
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Please check the template format.`);
    }

    // Find column indices
    const nameIndex = headers.findIndex(h => h.includes('expense') && h.includes('name'));
    const amountIndex = headers.findIndex(h => h.includes('amount'));
    const categoryIndex = headers.findIndex(h => h.includes('category'));
    const dayIndex = headers.findIndex(h => h.includes('day') && h.includes('month'));
    const recurringIndex = headers.findIndex(h => h.includes('recurring'));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      try {
        const name = values[nameIndex]?.trim();
        const amountStr = values[amountIndex]?.trim();
        const categoryStr = values[categoryIndex]?.trim().toLowerCase();
        const dayStr = values[dayIndex]?.trim();
        const recurringStr = values[recurringIndex]?.trim().toLowerCase();

        if (!name || !amountStr || !categoryStr || !dayStr) {
          console.warn(`Skipping row ${i + 1}: Missing required data`);
          continue;
        }

        // Parse amount
        const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          console.warn(`Skipping row ${i + 1}: Invalid amount`);
          continue;
        }

        // Parse day of month
        const dayOfMonth = parseInt(dayStr);
        if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
          console.warn(`Skipping row ${i + 1}: Invalid day of month`);
          continue;
        }

        // Parse recurring
        const isRecurring = recurringStr === 'true' || recurringStr === '1' || recurringStr === 'yes';

        // Map category
        let categoryId: CategoryType = 'one_time_expense'; // default
        const categoryMapping: Record<string, CategoryType> = {
          'debt': 'debt',
          'subscription': 'subscription',
          'subscriptions': 'subscription',
          'bill': 'bill',
          'bills': 'bill',
          'utilities': 'bill',
          'bills & utilities': 'bill',
          'savings': 'savings',
          'one-time': 'one_time_expense',
          'one time': 'one_time_expense',
          'onetime': 'one_time_expense',
          'one-time expense': 'one_time_expense',
          'one-time expenses': 'one_time_expense',
          'given': 'given_expenses',
          'given expense': 'given_expenses',
          'given expenses': 'given_expenses',
        };

        if (categoryMapping[categoryStr]) {
          categoryId = categoryMapping[categoryStr];
        }

        // Create date for this month with the specified day
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const transactionDate = new Date(currentYear, currentMonth, dayOfMonth);

        // If the date is in the past for this month, use next month
        if (transactionDate < today && !isRecurring) {
          transactionDate.setMonth(currentMonth + 1);
        }

        const transaction: Omit<Transaction, 'id'> = {
          name,
          amount,
          date: transactionDate.toISOString(),
          category: categoryId,
          type: 'expense',
          isRecurring,
        };

        transactions.push(transaction);
      } catch (error) {
        console.warn(`Error parsing row ${i + 1}:`, error);
        continue;
      }
    }

    return transactions;
  };

  const handleOpenTemplate = async () => {
    const url = 'https://docs.google.com/spreadsheets/d/1OWsGvdJH9aOquUnbv2Vy45nqYh8ECkoy9pokfldqRho/edit?gid=0#gid=0';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open template link');
      }
    } catch {
      Alert.alert('Error', 'Unable to open template link');
    }
  };



  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Header title="Profile" subtitle="Manage your account and preferences" />
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

          {/* Account Info */}
          <Card style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <Pressable 
                style={styles.avatarContainer} 
                onPress={handleAvatarPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.card }]}>
                      {nickname?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraIcon, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                  <Camera size={16} color={colors.card} />
                </View>
              </Pressable>
              <View style={styles.nameSection}>
                <Text style={[styles.nameText, { color: colors.text }, !nickname && { color: colors.textSecondary }]}>
                  {nickname || 'Add Your Name'}
                </Text>
              </View>
              <Pressable 
                style={styles.editIcon} 
                onPress={() => setShowNameEditModal(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Edit3 size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </Card>

          {/* Preferences */}
          <Card style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Preferences</Text>
            <SettingsItem title="Theme" value={theme.charAt(0).toUpperCase() + theme.slice(1)} onPress={() => setShowThemeModal(true)} />
            <SettingsItem title="Week Starts On" value={weekStartDay.charAt(0).toUpperCase() + weekStartDay.slice(1)} onPress={() => setShowWeekStartModal(true)} isLast />
          </Card>

          {/* Notifications */}
          <Card style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Notifications</Text>
            
            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>Weekly Planner Reminder</Text>
              <Switch
                value={notificationSettings.weeklyPlannerReminder}
                onValueChange={(value) => updateNotificationSettings({ weeklyPlannerReminder: value })}
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>Get reminded to plan your week every Monday morning</Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>Payday Reminder</Text>
              <Switch
                value={notificationSettings.paydayReminder}
                onValueChange={(value) => updateNotificationSettings({ paydayReminder: value })}
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>Get notified when your paycheck arrives based on your pay schedule</Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>Weekly Digest Summary</Text>
              <Switch
                value={notificationSettings.weeklyDigestSummary}
                onValueChange={(value) => updateNotificationSettings({ weeklyDigestSummary: value })}
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>Receive a weekly spending summary every Sunday evening</Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>Milestone Celebrations</Text>
              <Switch
                value={notificationSettings.milestoneNotifications}
                onValueChange={(value) => updateNotificationSettings({ milestoneNotifications: value })}
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>Celebrate when you reach savings goals and spending milestones</Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>Expense Reminders</Text>
              <Switch
                value={notificationSettings.expenseReminders}
                onValueChange={(value) => updateNotificationSettings({ expenseReminders: value })}
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>Get reminded about upcoming expenses automatically</Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>Weekly Insights</Text>
              <Switch
                value={notificationSettings.insightAlerts}
                onValueChange={(value) => updateNotificationSettings({ insightAlerts: value })}
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>Receive weekly spending insights on Sunday evenings</Text>
          </Card>

          {/* Data Management */}
          <Card style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Data Management</Text>
            <SettingsItem 
              title="Import CSV" 
              subtitle="Import expenses from a CSV file"
              icon={<Upload size={18} color={colors.primary} />} 
              onPress={handleImportCSV}
              disabled={isImporting}
            />
            <Pressable 
              style={styles.templateLink}
              onPress={handleOpenTemplate}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.templateLinkContent}>
                <ExternalLink size={16} color={colors.primary} />
                <Text style={[styles.templateLinkText, { color: colors.primary }]}>Expense Sheet Template</Text>
              </View>
            </Pressable>
            <SettingsItem title="Reset Data" icon={<RefreshCw size={18} color={colors.destructive} />} onPress={handleResetData} isLast />
          </Card>

          {/* Help & Support */}
          <Card style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Support</Text>
            <SettingsItem title="Privacy Policy" icon={<Shield size={18} color={colors.primary} />} onPress={handlePrivacyPolicy} />
            <SettingsItem title="Contact Support" icon={<Mail size={18} color={colors.primary} />} onPress={handleContactSupport} isLast />
          </Card>

          <Text style={[styles.versionText, { color: colors.inactive }]}>Version 1.0.0 — Data stored locally</Text>
        </ScrollView>
      </SafeAreaView>



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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Theme</Text>
            {(['system', 'light', 'dark'] as const).map((themeOption) => (
              <Pressable
                key={themeOption}
                style={[
                  styles.modalOption, 
                  theme === themeOption && [styles.modalOptionSelected, { backgroundColor: colors.primary }]
                ]}
                onPress={async () => {
                  await setTheme(themeOption);
                  setShowThemeModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText, 
                  { color: colors.text },
                  theme === themeOption && [styles.modalOptionTextSelected, { color: colors.card }]
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Week Starts On</Text>
            {(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const).map((day) => (
              <Pressable
                key={day}
                style={[
                  styles.modalOption, 
                  weekStartDay === day && [styles.modalOptionSelected, { backgroundColor: colors.primary }]
                ]}
                onPress={async () => {
                  await setWeekStartDay(day);
                  setShowWeekStartModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText, 
                  { color: colors.text },
                  weekStartDay === day && [styles.modalOptionTextSelected, { color: colors.card }]
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
    paddingHorizontal: Spacing.screenHorizontal, // 16px horizontal padding
    paddingTop: Spacing.cardMargin, // 16px padding between header and first card
    gap: Spacing.sectionSpacing, // 24px between sections
  },
  card: {
    padding: Spacing.cardPadding, // Standard 16px padding
    borderRadius: BorderRadius.lg, // Standard 12px border radius
    ...Shadow.card, // Standard card shadow
  },
  cardTitle: {
    fontSize: 17, // Balanced card title font
    fontWeight: '600', // Bold
    marginBottom: Spacing.lg, // 16px margin
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: Spacing.rowMinHeight, // 44px minimum row height
    paddingVertical: Spacing.sm,
  },
  itemLabel: {
    fontSize: 15, // Balanced body label font
    fontWeight: '400', // Regular weight
    lineHeight: 20,
    flexShrink: 1,
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
    fontSize: 17, // Balanced name font
    fontWeight: '600', // Medium weight
    lineHeight: 22,
    flexShrink: 1,
  },
  editIcon: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: Spacing.minTouchTarget,
    minHeight: Spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDescription: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingLeft: 0,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: Spacing.xl,
    lineHeight: 16,
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
  templateLink: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  templateLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  templateLinkText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
});
