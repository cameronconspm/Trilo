import React, { useState, useEffect } from 'react';
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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/layout/Header';
import Card from '@/components/layout/Card';
import SettingsItem from '@/components/SettingsItem';
import AlertModal from '@/components/modals/AlertModal';
import { CsvImportModal } from '@/components/modals';
import { BadgeGalleryModal, LevelBadge } from '@/components/badges';
import { useSettings } from '@/context/SettingsContext';
import { useNotifications } from '@/context/NotificationContext';
import { useFinance } from '@/context/FinanceContext';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { useThemeColors } from '@/constants/colors';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';
import {
  Shield,
  Mail,
  RefreshCw,
  Edit3,
  Camera,
  ExternalLink,
  Upload,
  ChevronDown,
  ChevronRight,
  Trophy,
  LogOut,
} from 'lucide-react-native';
import NameEditModal from '@/components/modals/NameEditModal';
import { ModalWrapper } from '@/components/modals/ModalWrapper';
import { Transaction, CategoryType } from '@/types/finance';

export default function ProfileScreen() {
  const {
    theme,
    setTheme,
    nickname,
    setNickname,
    avatarUri,
    setAvatarUri,
    resetData,
    resetDataSelective,
  } = useSettings();

  const {
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
  } = useNotifications();
  
  const challengeTracking = useChallengeTracking();

  const {
    clearAllData: clearFinanceData,
    reloadData: reloadFinanceData,
    addTransaction,
  } = useFinance();

  const { signOut, deleteAccount, user } = useAuth();

  const { alertState, showAlert, hideAlert } = useAlert();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);

  // Get theme-aware colors
  const colors = useThemeColors(theme);

  // Collapse notifications when leaving the tab
  // Use useEffect instead of useFocusEffect to avoid navigation context issues
  useEffect(() => {
    // This will run when component mounts/unmounts
    return () => {
      setNotificationsExpanded(false);
    };
  }, []);

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

    if (
      mediaLibraryStatus.status !== 'granted' &&
      cameraStatus.status !== 'granted'
    ) {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your camera or photo library to update your avatar.',
        [{ text: 'OK' }]
      );
      return;
    }

    const options: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [{ text: 'Cancel', style: 'cancel' }];

    if (cameraStatus.status === 'granted') {
      options.push({ text: 'Camera', onPress: () => openCamera() });
    }

    if (mediaLibraryStatus.status === 'granted') {
      options.push({ text: 'Photo Library', onPress: () => openImagePicker() });
    }

    if (avatarUri) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => removeAvatar(),
      });
    }

    Alert.alert(
      'Update Avatar',
      "Choose how you'd like to update your profile picture",
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
      title: 'Reset Personal Data',
      message:
        'This will reset your bank connections, transactions, and preferences. Your achievements, badges, and progress will be preserved.',
      type: 'warning',
      actions: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear financial data (transactions, budgets, bank connections)
              await clearFinanceData();

              // Clear settings and preferences (but preserve achievements)
              await resetDataSelective();

              // Reload financial data to reset state
              await reloadFinanceData();

              showAlert({
                title: 'Data Reset Complete',
                message:
                  'Personal data has been reset. Your achievements and progress have been preserved.',
                type: 'success',
                actions: [
                  {
                    text: 'Dismiss',
                    onPress: () => {
                      // Force app to reload by reloading the page (web) or restarting (mobile)
                      if (Platform.OS === 'web') {
                        window.location.reload();
                      }
                    },
                  },
                ],
              });
            } catch (error) {
              console.error('Reset data error:', error);
              showAlert({
                title: 'Reset Failed',
                message:
                  'There was an error resetting your data. Please try again.',
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
        Alert.alert(
          'Email Not Available',
          'Please send an email to support@thetriloapp.com'
        );
      }
    } catch {
      Alert.alert(
        'Email Not Available',
        'Please send an email to support@thetriloapp.com'
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Success', 'Your account has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your account and preferences
            </Text>
          </View>
          {/* Account Info */}
          <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
            <View style={styles.profileHeader}>
              <Pressable
                style={styles.avatarContainer}
                onPress={handleAvatarPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[styles.avatar, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.avatarText, { color: colors.card }]}>
                      {nickname?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.cameraIcon,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.card,
                    },
                  ]}
                >
                  <Camera size={16} color={colors.card} />
                </View>
              </Pressable>
              <View style={styles.nameSection}>
                <Text
                  style={[
                    styles.nameText,
                    { color: colors.text },
                    !nickname && { color: colors.textSecondary },
                  ]}
                >
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
          <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Preferences
            </Text>
            <SettingsItem
              title='Theme'
              value={theme.charAt(0).toUpperCase() + theme.slice(1)}
              onPress={() => setShowThemeModal(true)}
              isLast
            />
          </Card>

          {/* Badges & Achievements */}
          <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
            <View style={styles.rowBetween}>
              <View style={styles.badgeHeaderLeft}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Badges & Achievements
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowBadgeGallery(true)}
                style={styles.badgeButton}
              >
                <Text style={[styles.badgeButtonText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Level Badge */}
            {challengeTracking.financialScore && (
              <View style={styles.levelSection}>
                <View style={styles.levelInfo}>
                  <LevelBadge 
                    level={challengeTracking.financialScore.current_level}
                    levelName={challengeTracking.financialScore.level_name}
                    size={40}
                    showLevelNumber={true}
                  />
                  <View style={styles.levelDetails}>
                    <Text style={[styles.levelName, { color: colors.text }]}>
                      {challengeTracking.financialScore.level_name}
                    </Text>
                    <Text style={[styles.levelPoints, { color: colors.textSecondary }]}>
                      {challengeTracking.financialScore.total_points} total points
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Recent Badges */}
            <View style={styles.recentBadgesSection}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Recent Badges ({challengeTracking.userBadges.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
                {challengeTracking.userBadges.slice(0, 5).map((badge) => (
                  <View key={badge.id} style={styles.recentBadgeItem}>
                    <Text style={styles.badgeEmoji}>🏆</Text>
                    <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                      {badge.badge_name.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
                {challengeTracking.userBadges.length === 0 && (
                  <View style={styles.noBadgesContainer}>
                    <Text style={[styles.noBadgesText, { color: colors.textSecondary }]}>
                      Complete challenges to earn badges!
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Card>

          {/* Notifications */}
          <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Notifications
            </Text>
            
            <Pressable
              style={styles.rowBetween}
              onPress={() => setNotificationsExpanded(!notificationsExpanded)}
            >
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Notification Settings
              </Text>
              {notificationsExpanded ? (
                <ChevronDown size={20} color={colors.textSecondary} />
              ) : (
                <ChevronRight size={20} color={colors.textSecondary} />
              )}
            </Pressable>

            {notificationsExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Weekly Planner Reminder
              </Text>
              <Switch
                value={notificationSettings.weeklyPlannerReminder}
                onValueChange={value =>
                  updateNotificationSettings({ weeklyPlannerReminder: value })
                }
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text
              style={[
                styles.notificationDescription,
                { color: colors.textSecondary },
              ]}
            >
              Get reminded to plan your week every Monday morning
            </Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Payday Reminder
              </Text>
              <Switch
                value={notificationSettings.paydayReminder}
                onValueChange={value =>
                  updateNotificationSettings({ paydayReminder: value })
                }
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text
              style={[
                styles.notificationDescription,
                { color: colors.textSecondary },
              ]}
            >
              Get notified when your paycheck arrives based on your pay schedule
            </Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Weekly Digest Summary
              </Text>
              <Switch
                value={notificationSettings.weeklyDigestSummary}
                onValueChange={value =>
                  updateNotificationSettings({ weeklyDigestSummary: value })
                }
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text
              style={[
                styles.notificationDescription,
                { color: colors.textSecondary },
              ]}
            >
              Receive a weekly spending summary every Sunday evening
            </Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Milestone Celebrations
              </Text>
              <Switch
                value={notificationSettings.milestoneNotifications}
                onValueChange={value =>
                  updateNotificationSettings({ milestoneNotifications: value })
                }
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text
              style={[
                styles.notificationDescription,
                { color: colors.textSecondary },
              ]}
            >
              Celebrate when you reach savings goals and spending milestones
            </Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Expense Reminders
              </Text>
              <Switch
                value={notificationSettings.expenseReminders}
                onValueChange={value =>
                  updateNotificationSettings({ expenseReminders: value })
                }
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text
              style={[
                styles.notificationDescription,
                { color: colors.textSecondary },
              ]}
            >
              Get reminded about upcoming expenses automatically
            </Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Weekly Insights
              </Text>
              <Switch
                value={notificationSettings.insightAlerts}
                onValueChange={value =>
                  updateNotificationSettings({ insightAlerts: value })
                }
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <Text
              style={[
                styles.notificationDescription,
                { color: colors.textSecondary },
              ]}
            >
              Receive weekly spending insights on Sunday evenings
            </Text>
              </View>
            )}
          </Card>

          {/* Data Management */}
          <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Data Management
            </Text>
            <SettingsItem
              title='Import expenses (CSV)'
              icon={<Upload size={18} color={colors.primary} />}
              onPress={() => setShowCsvImport(true)}
            />
            <SettingsItem
              title='Reset Personal Data'
              icon={<RefreshCw size={18} color={colors.warning} />}
              onPress={handleResetData}
            />
            <SettingsItem
              title='Reset All App Data'
              icon={<RefreshCw size={18} color={colors.warning} />}
              onPress={handleResetData}
              isLast
            />
          </Card>

          {/* Account Management */}
          {user && (
            <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Account
              </Text>
              <SettingsItem
                title='Signed in as'
                subtitle={user.email}
                icon={<Mail size={18} color={colors.primary} />}
                disabled={true}
              />
              <SettingsItem
                title='Sign Out'
                icon={<LogOut size={18} color={colors.textSecondary} />}
                onPress={handleSignOut}
              />
              <SettingsItem
                title='Delete Account'
                icon={<Shield size={18} color={colors.error} />}
                onPress={handleDeleteAccount}
                isLast
              />
            </Card>
          )}

          {/* Help & Support */}
          <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Support
            </Text>
            <SettingsItem
              title='Privacy Policy'
              icon={<Shield size={18} color={colors.primary} />}
              onPress={handlePrivacyPolicy}
            />
            <SettingsItem
              title='Contact Support'
              icon={<Mail size={18} color={colors.primary} />}
              onPress={handleContactSupport}
              isLast
            />
          </Card>

          <Text style={[styles.versionText, { color: colors.inactive }]}>
            Version 1.0.0 — Data stored locally
          </Text>
        </ScrollView>
      </SafeAreaView>

      <AlertModal {...alertState} onClose={hideAlert} />

      <NameEditModal
        visible={showNameEditModal}
        currentName={nickname}
        onSave={handleNameSave}
        onClose={() => setShowNameEditModal(false)}
      />

      {/* CSV Import Modal */}
      <CsvImportModal visible={showCsvImport} onClose={() => setShowCsvImport(false)} />

      {/* Theme Selection Modal */}
      <ModalWrapper
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        animationType='fade'
      >
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          Choose Theme
        </Text>
        {(['system', 'light', 'dark'] as const).map(themeOption => (
          <Pressable
            key={themeOption}
            style={[
              styles.modalOption,
              theme === themeOption && [
                styles.modalOptionSelected,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={async () => {
              await setTheme(themeOption);
              setShowThemeModal(false);
            }}
          >
            <Text
              style={[
                styles.modalOptionText,
                { color: colors.text },
                theme === themeOption && [
                  styles.modalOptionTextSelected,
                  { color: colors.card },
                ],
              ]}
            >
              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ModalWrapper>
      
      {/* Badge Gallery Modal */}
      <BadgeGalleryModal
        visible={showBadgeGallery}
        onClose={() => setShowBadgeGallery(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Space for tab bar
    gap: Spacing.xxl, // 24px between sections
  },
  header: {
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  card: {
    padding: SpacingValues.cardPadding, // Standard 16px padding
    borderRadius: BorderRadius.lg, // Standard 12px border radius
    ...Shadow.card, // Standard card shadow
  },
  cardTitle: {
    ...Typography.h3, // Using new typography system
    marginBottom: Spacing.md, // Reduced from lg
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: SpacingValues.rowMinHeight, // 44px minimum row height
    paddingVertical: Spacing.sm,
  },
  itemLabel: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '400', // Regular weight
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
    ...Typography.currencyMedium, // Using new typography system
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
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '600', // Medium weight
    flexShrink: 1,
  },
  editIcon: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: SpacingValues.minTouchTarget,
    minHeight: SpacingValues.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDescription: {
    ...Typography.caption, // Using new typography system
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingLeft: 0,
  },
  expandedContent: {
    paddingTop: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  versionText: {
    textAlign: 'center',
    ...Typography.caption, // Using new typography system
    paddingVertical: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3, // Using new typography system
    marginBottom: Spacing.lg,
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  modalOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    position: 'relative',
    zIndex: 1,
  },
  modalOptionSelected: {
    // backgroundColor will be set dynamically
  },
  modalOptionText: {
    ...Typography.body, // Using new typography system
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
  },
  // Badge section styles
  badgeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badgeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelDetails: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  levelPoints: {
    fontSize: 14,
    fontWeight: '400',
  },
  recentBadgesSection: {
    marginTop: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  badgesScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  recentBadgeItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
    minWidth: 60,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  noBadgesContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noBadgesText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
