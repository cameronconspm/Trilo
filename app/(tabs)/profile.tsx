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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Header from '@/components/layout/Header';
import Card from '@/components/layout/Card';
import SettingsItem from '@/components/SettingsItem';
import AlertModal from '@/components/modals/AlertModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { CsvImportModal } from '@/components/modals';
import { BadgeGalleryModal, LevelBadge } from '@/components/badges';
import { useSettings } from '@/context/SettingsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineIndicator from '@/components/feedback/OfflineIndicator';
import { useNotifications } from '@/context/NotificationContext';
import { useFinance } from '@/context/FinanceContext';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { usePlaid } from '@/context/PlaidContext';
import MFASetupScreen from '@/components/auth/MFASetupScreen';
import { isMFAEnabled, disableMFA, getMFAPhoneNumber, wasMFASetupSkipped } from '@/services/mfaService';
import { showManageSubscriptions } from '@/lib/revenuecat';
import { SUBSCRIPTIONS_ENABLED } from '@/constants/features';
import { useAlert } from '@/hooks/useAlert';
import { useThemeColors } from '@/constants/colors';
import { error as logError } from '@/utils/logger';
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
  MessageSquare,
  AlertCircle,
} from 'lucide-react-native';
import NameEditModal from '@/components/modals/NameEditModal';
import { ModalWrapper } from '@/components/modals/ModalWrapper';
import { PaywallModal } from '@/components/modals/PaywallModal';
import { Transaction, CategoryType } from '@/types/finance';
import { diagnoseRevenueCat, formatDiagnostics } from '@/lib/revenuecat-diagnostics';

function ProfileScreenContent() {
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

  const router = useRouter();

  const {
    clearAllData: clearFinanceData,
    reloadData: reloadFinanceData,
    addTransaction,
  } = useFinance();

  const { state: plaidState, disconnectBank, dispatch: plaidDispatch } = usePlaid();
  const { signOut, deleteAccount, user, checkMFAStatus } = useAuth();

  const { alertState, showAlert, hideAlert } = useAlert();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  const [subscriptionExpanded, setSubscriptionExpanded] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<string>('');
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [mfaSetupSkipped, setMfaSetupSkipped] = useState(false);
  const [showDisableMFAConfirm, setShowDisableMFAConfirm] = useState(false);

  const { status, subscriptionDetails, trialDaysRemaining, monthlyPackage, annualPackage, purchaseSubscription, checkAccess } = useSubscription();

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

  // Check MFA status on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      checkMFAStatus()
        .then((enabled) => {
          setMfaEnabled(enabled);
        })
        .catch((error) => {
          console.error('Failed to check MFA status:', error);
          // Default to disabled on error (secure default)
          setMfaEnabled(false);
        });
      
      // Check if MFA setup was skipped
      wasMFASetupSkipped(user.id)
        .then((skipped) => {
          setMfaSetupSkipped(skipped);
        })
        .catch((error) => {
          console.error('Failed to check if MFA setup was skipped:', error);
          setMfaSetupSkipped(false);
        });
      
      // Also load phone number if MFA is enabled
      import('@/services/mfaService')
        .then(({ getMFAPhoneNumber }) => {
          getMFAPhoneNumber(user.id)
            .then((phone) => {
              if (phone) setPhoneNumber(phone);
            })
            .catch((error) => {
              console.error('Failed to load MFA phone number:', error);
              // Silently fail - phone number is optional
            });
        })
        .catch((error) => {
          console.error('Failed to import MFA service:', error);
          // Silently fail - MFA service import error
        });
    }
  }, [user?.id]);

  const handleEnableMFA = () => {
    setShowMFASetup(true);
  };

  const handleMFASetupComplete = async () => {
    setShowMFASetup(false);
    const enabled = await checkMFAStatus();
    setMfaEnabled(enabled);
    setMfaSetupSkipped(false); // Clear skip flag when MFA is enabled
  };

  const handleMFASetupCancel = () => {
    setShowMFASetup(false);
  };

  const handleDisableMFA = () => {
    setShowDisableMFAConfirm(true);
  };

  const handleDisableMFAConfirm = async () => {
    if (user?.id) {
      try {
        await disableMFA(user.id);
        setMfaEnabled(false);
        setShowDisableMFAConfirm(false);
        showAlert({
          title: 'MFA Disabled',
          message: 'Two-factor authentication has been disabled for your account.',
          type: 'success',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
      } catch (error) {
        setShowDisableMFAConfirm(false);
        showAlert({
          title: 'Error',
          message: 'Failed to disable MFA. Please try again.',
          type: 'error',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
      }
    }
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

    try {
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
    } catch (error) {
      logError('Error requesting permissions:', error);
      Alert.alert(
        'Error',
        'Failed to request permissions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const openCamera = async () => {
    try {
      // Double-check camera permission before launching
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        const requestResult = await ImagePicker.requestCameraPermissionsAsync();
        if (requestResult.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to take photos. Please enable it in Settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        await setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      logError('Error opening camera:', error);
      Alert.alert(
        'Error',
        'Failed to open camera. Please check that camera permissions are granted in Settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const openImagePicker = async () => {
    try {
      // Double-check media library permission before launching
      const mediaPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        const requestResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (requestResult.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Photo library permission is required to select photos. Please enable it in Settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        await setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      logError('Error opening image picker:', error);
      Alert.alert(
        'Error',
        'Failed to open photo library. Please check that photo library permissions are granted in Settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const removeAvatar = async () => {
    try {
      await setAvatarUri(null);
    } catch (error) {
      logError('Error removing avatar:', error);
      Alert.alert(
        'Error',
        'Failed to remove photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNameSave = async (name: string) => {
    await setNickname(name);
  };


  const handleResetPersonalData = () => {
    showAlert({
      title: 'Reset Personal Data',
      message:
        'This will remove all your transactions, income, expenses, and bank connections. Your achievements, badges, challenges, and goals will be preserved.',
      type: 'warning',
      actions: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // Disconnect all Plaid bank accounts first
              for (const account of plaidState.accounts) {
                try {
                  await disconnectBank(account.id);
                } catch (error) {
                  // Continue even if individual account disconnect fails
                  logError('Error disconnecting account:', error);
                }
              }

              // Reset Plaid state to clear in-memory data
              plaidDispatch({ type: 'RESET_STATE' });

              // Clear financial data (transactions, income, expenses)
              await clearFinanceData();

              // Clear settings and preferences (but preserve achievements)
              await resetDataSelective();

              // Reload financial data to reset state
              await reloadFinanceData();

              showAlert({
                title: 'Data Reset Complete',
                message:
                  'Personal data has been reset. Your achievements, badges, and goals have been preserved.',
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
              logError('Reset data error:', error);
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

  const handleProvideFeedback = async () => {
    const email = 'feedback@thetriloapp.com';
    const subject = 'Feedback';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Email Not Available',
          'Please send an email to feedback@thetriloapp.com'
        );
      }
    } catch {
      Alert.alert(
        'Email Not Available',
        'Please send an email to feedback@thetriloapp.com'
      );
    }
  };

  const handleOpenSubscriptionSettings = async () => {
    try {
      await showManageSubscriptions();
    } catch (error) {
      // Fallback to browser if native method fails
      try {
        if (Platform.OS === 'ios') {
          const url = 'https://apps.apple.com/account/subscriptions';
          await Linking.openURL(url);
        } else if (Platform.OS === 'android') {
          const url = 'https://play.google.com/store/account/subscriptions';
          await Linking.openURL(url);
        }
      } catch (linkError) {
        Alert.alert(
          'Unable to Open',
          Platform.OS === 'ios'
            ? 'Please go to Settings > Apple ID > Subscriptions to manage your subscription.'
            : 'Please go to Google Play Store > Subscriptions to manage your subscription.'
        );
      }
    }
  };

  const formatRenewalDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'To cancel your subscription, please use the subscription management settings. Your subscription will remain active until the end of the current billing period.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Manage Subscription', 
          onPress: handleOpenSubscriptionSettings 
        },
      ]
    );
  };

  const handleChangePlan = async (newPlan: 'monthly' | 'annual') => {
    if (!monthlyPackage || !annualPackage) {
      Alert.alert('Error', 'Subscription packages not available. Please try again later.');
      return;
    }

    try {
      setIsChangingPlan(true);
      const targetPackage = newPlan === 'annual' ? annualPackage : monthlyPackage;
      await purchaseSubscription(targetPackage);
      
      // Refresh subscription details
      await checkAccess();
      
      Alert.alert(
        'Plan Changed',
        `Your subscription has been changed to ${newPlan === 'annual' ? 'annual' : 'monthly'}. The change will take effect at the end of your current billing period.`
      );
    } catch (error) {
      console.error('Plan change error:', error);
      Alert.alert(
        'Error',
        'Unable to change plan. Please try again or manage your subscription in settings.'
      );
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleUpgradeToAnnual = () => {
    if (!subscriptionDetails.productId?.includes('annual')) {
      handleChangePlan('annual');
    } else {
      Alert.alert('Already Annual', 'You are already subscribed to the annual plan.');
    }
  };

  const handleDowngradeToMonthly = () => {
    if (!subscriptionDetails.productId?.includes('monthly') && !subscriptionDetails.productId?.includes('month')) {
      Alert.alert(
        'Switch to Monthly',
        'Are you sure you want to switch to the monthly plan?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch', onPress: () => handleChangePlan('monthly') },
        ]
      );
    } else {
      Alert.alert('Already Monthly', 'You are already subscribed to the monthly plan.');
    }
  };

  const handleShowSubscriptionBanner = () => {
    // Show paywall modal instead of just restoring banner
    setShowPaywall(true);
  };

  const handleRunRevenueCatDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticsResult('');
    
    try {
      const diagnostics = await diagnoseRevenueCat();
      const formatted = formatDiagnostics(diagnostics);
      setDiagnosticsResult(formatted);
      setShowDiagnostics(true);
    } catch (error: any) {
      setDiagnosticsResult(`❌ Error running diagnostics:\n${error?.message || 'Unknown error'}`);
      setShowDiagnostics(true);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleSignOut = () => {
    showAlert({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              showAlert({
                title: 'Error',
                message: 'Failed to sign out. Please try again.',
                type: 'error',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
          style: 'destructive',
        },
      ],
    });
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: 'Delete Account',
      message: 'This will permanently delete your account and all your data. This action cannot be undone.',
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteAccount();
              showAlert({
                title: 'Account Deleted',
                message: 'Your account has been deleted.',
                type: 'success',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            } catch (error) {
              showAlert({
                title: 'Error',
                message: 'Failed to delete account. Please try again.',
                type: 'error',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
          style: 'destructive',
        },
      ],
    });
  };

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
              onPress={handleResetPersonalData}
              isLast={!SUBSCRIPTIONS_ENABLED}
            />
            {/* Test RevenueCat Products - DISABLED when subscriptions are disabled */}
            {SUBSCRIPTIONS_ENABLED && (
              <SettingsItem
                title='Test RevenueCat Products'
                icon={<RefreshCw size={18} color={colors.primary} />}
                onPress={handleRunRevenueCatDiagnostics}
                disabled={isRunningDiagnostics}
                subtitle={isRunningDiagnostics ? 'Running diagnostics...' : 'Verify product configuration'}
                isLast
              />
            )}
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
              
              {/* Subscription Section - DISABLED when subscriptions are disabled */}
              {SUBSCRIPTIONS_ENABLED && (status === 'active' || status === 'trial' || status === 'expired') && (
                <>
                  <TouchableOpacity
                    onPress={() => setSubscriptionExpanded(!subscriptionExpanded)}
                    style={styles.subscriptionHeaderItem}
                  >
                    <Text style={[styles.subscriptionHeaderTitle, { color: colors.text }]}>
                      Subscription
                    </Text>
                    {subscriptionExpanded ? (
                      <ChevronDown size={18} color={colors.textSecondary} />
                    ) : (
                      <ChevronRight size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  
                  {subscriptionExpanded && (
                    <View style={[styles.subscriptionContent, { borderTopColor: colors.textSecondary + '20' }]}>
                      {status === 'trial' && trialDaysRemaining !== null && (
                        <View style={styles.subscriptionRow}>
                          <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>
                            Trial Status
                          </Text>
                          <Text style={[styles.subscriptionValue, { color: colors.text }]}>
                            {trialDaysRemaining} days remaining
                          </Text>
                        </View>
                      )}
                      
                      {status === 'active' && subscriptionDetails.renewalDate && (
                        <View style={styles.subscriptionRow}>
                          <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>
                            Renews On
                          </Text>
                          <Text style={[styles.subscriptionValue, { color: colors.text }]}>
                            {formatRenewalDate(subscriptionDetails.renewalDate)}
                          </Text>
                        </View>
                      )}
                      
                      {subscriptionDetails.price && (
                        <View style={styles.subscriptionRow}>
                          <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>
                            Price
                          </Text>
                          <Text style={[styles.subscriptionValue, { color: colors.text }]}>
                            {subscriptionDetails.price}
                            {subscriptionDetails.productId?.includes('annual') || subscriptionDetails.productId?.includes('year') ? ' / year' : ' / month'}
                          </Text>
                        </View>
                      )}
                      
                      {/* Plan Management Actions */}
                      {status === 'active' && (
                        <View style={styles.subscriptionActions}>
                          {subscriptionDetails.productId && 
                           !subscriptionDetails.productId.includes('annual') && 
                           !subscriptionDetails.productId.includes('year') && (
                            <TouchableOpacity
                              onPress={handleUpgradeToAnnual}
                              disabled={isChangingPlan}
                              style={[styles.subscriptionActionButton, { backgroundColor: colors.primary }]}
                            >
                              <Text style={styles.subscriptionActionButtonText}>
                                Upgrade to Annual
                              </Text>
                            </TouchableOpacity>
                          )}
                          
                          {subscriptionDetails.productId && 
                           (subscriptionDetails.productId.includes('annual') || subscriptionDetails.productId.includes('year')) && (
                            <TouchableOpacity
                              onPress={handleDowngradeToMonthly}
                              disabled={isChangingPlan}
                              style={[styles.subscriptionActionButton, { borderColor: colors.primary, borderWidth: 1 }]}
                            >
                              <Text style={[styles.subscriptionActionButtonText, { color: colors.primary }]}>
                                Switch to Monthly
                              </Text>
                            </TouchableOpacity>
                          )}
                          
                          <TouchableOpacity
                            onPress={handleCancelSubscription}
                            style={[styles.subscriptionActionButton, { borderColor: colors.error, borderWidth: 1 }]}
                          >
                            <Text style={[styles.subscriptionActionButtonText, { color: colors.error }]}>
                              Cancel Subscription
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      <TouchableOpacity
                        onPress={handleOpenSubscriptionSettings}
                        style={[styles.subscriptionButton, { borderColor: colors.primary }]}
                      >
                        <Text style={[styles.subscriptionButtonText, { color: colors.primary }]}>
                          Manage in Settings
                        </Text>
                        <ExternalLink size={16} color={colors.primary} />
                      </TouchableOpacity>
                      
                      {/* Show Banner Again Option - allow restoring banner if dismissed */}
                      <TouchableOpacity
                        onPress={handleShowSubscriptionBanner}
                        style={[styles.subscriptionActionButton, { borderColor: colors.textSecondary + '40', borderWidth: 1, marginTop: Spacing.sm }]}
                      >
                        <Text style={[styles.subscriptionActionButtonText, { color: colors.textSecondary }]}>
                          Show Plans
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={[styles.subscriptionDivider, { backgroundColor: colors.textSecondary + '20' }]} />
                </>
              )}
              
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

          {/* MFA Setup Skipped Notice */}
          {user && mfaSetupSkipped && !mfaEnabled && (
            <Card style={[styles.card, { backgroundColor: `${colors.warning || colors.primary}15`, borderWidth: 1, borderColor: `${colors.warning || colors.primary}40` }] as any}>
              <View style={styles.noticeContainer}>
                <AlertCircle size={20} color={colors.warning || colors.primary} style={{ marginRight: Spacing.sm }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.noticeTitle, { color: colors.text }]}>
                    Enable Two-Factor Authentication
                  </Text>
                  <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                    Protect your account and connect bank accounts securely.
                  </Text>
                  <TouchableOpacity
                    onPress={handleEnableMFA}
                    style={[styles.noticeButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.noticeButtonText}>Enable MFA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}

          {/* Security */}
          {user && (
            <Card style={[styles.card, { backgroundColor: colors.card }] as any}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Security
              </Text>
              {!mfaEnabled ? (
                <SettingsItem
                  title='Enable Two-Factor Authentication'
                  subtitle='Add an extra layer of security via SMS'
                  icon={<Shield size={18} color={colors.primary} />}
                  onPress={handleEnableMFA}
                  isLast
                />
              ) : (
                <>
                  <SettingsItem
                    title='Two-Factor Authentication'
                    subtitle={phoneNumber ? `Enabled - ${phoneNumber}` : 'Enabled - Your account is protected'}
                    icon={<Shield size={18} color={colors.success || colors.primary} />}
                    disabled={true}
                  />
                  <SettingsItem
                    title='Disable Two-Factor Authentication'
                    subtitle='Remove SMS verification from your account'
                    icon={<Shield size={18} color={colors.error} />}
                    onPress={handleDisableMFA}
                    isLast
                  />
                </>
              )}
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
            />
            <SettingsItem
              title='Provide Feedback'
              icon={<MessageSquare size={18} color={colors.primary} />}
              onPress={handleProvideFeedback}
              isLast
            />
          </Card>

          <Text style={[styles.versionText, { color: colors.inactive }]}>
            Version 1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>

      <AlertModal {...alertState} onClose={hideAlert} />
      
      <ConfirmationModal
        visible={showDisableMFAConfirm}
        title="Disable Two-Factor Authentication"
        message="Are you sure you want to disable two-factor authentication? This will make your account less secure."
        actions={[
          { text: 'Cancel', style: 'cancel', onPress: () => setShowDisableMFAConfirm(false) },
          { text: 'Disable', style: 'destructive', onPress: handleDisableMFAConfirm },
        ]}
        onClose={() => setShowDisableMFAConfirm(false)}
      />

      {showMFASetup && (
        <Modal
          visible={showMFASetup}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleMFASetupCancel}
        >
          <MFASetupScreen
            onComplete={handleMFASetupComplete}
            onCancel={handleMFASetupCancel}
          />
        </Modal>
      )}

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
        maxWidth={400}
      >
        <View style={[styles.themeModalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitleBase, { color: colors.text }]}>
            Choose Theme
          </Text>
          <View style={styles.themeOptions}>
            {(['system', 'light', 'dark'] as const).map((themeOption, index) => (
              <Pressable
                key={themeOption}
                style={[
                  styles.modalOption,
                  theme === themeOption && [
                    styles.modalOptionSelected,
                    { backgroundColor: colors.primary },
                  ],
                  index < 2 && styles.modalOptionSpacing, // Add spacing between options
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
          </View>
        </View>
      </ModalWrapper>
      
      {/* Badge Gallery Modal */}
      <BadgeGalleryModal
        visible={showBadgeGallery}
        onClose={() => setShowBadgeGallery(false)}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
      
      {/* RevenueCat Diagnostics Modal */}
      <ModalWrapper
        visible={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        animationType="slide"
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            RevenueCat Diagnostics
          </Text>
          <ScrollView 
            style={styles.diagnosticsScroll}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.diagnosticsText, { color: colors.text }]}>
              {diagnosticsResult || 'Running diagnostics...'}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowDiagnostics(false)}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ModalWrapper>
      <OfflineIndicator />
    </>
  );
}

export default function ProfileScreen() {
  return (
    <ErrorBoundary context="Profile Screen">
      <ProfileScreenContent />
    </ErrorBoundary>
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
    gap: Spacing.lg, // 16px between sections (reduced from 24px)
  },
  header: {
    paddingVertical: Spacing.md, // Reduced from lg for tighter spacing
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
  themeModalContent: {
    width: '100%',
    paddingHorizontal: Spacing.xxl, // 24px horizontal padding - standard modal padding
    paddingTop: Spacing.xxl, // 24px top padding - matches modal standards
    paddingBottom: Spacing.xxl, // 24px bottom padding - matches modal standards
  },
  modalTitleBase: {
    ...Typography.h3, // 20pt - Apple HIG standard for modal titles
    marginBottom: Spacing.xl, // 20px spacing before options - standard content spacing
    textAlign: 'center',
  },
  themeOptions: {
    gap: Spacing.md, // 12px gap between options - standard spacing (matches Apple HIG minimum)
    width: '100%',
  },
  modalOption: {
    paddingVertical: Spacing.md + Spacing.sm, // 14px vertical padding - comfortable touch target
    paddingHorizontal: Spacing.xl, // 20px horizontal padding - standard button padding
    borderRadius: BorderRadius.modern, // 12px - modern iOS style
    backgroundColor: 'transparent',
    minHeight: SpacingValues.minTouchTarget, // 44px minimum touch target (Apple HIG standard)
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionSelected: {
    // backgroundColor will be set dynamically
  },
  modalOptionSpacing: {
    marginBottom: 0, // Spacing handled by parent gap
  },
  modalOptionText: {
    ...Typography.bodyMedium, // 17pt, medium weight - Apple HIG standard
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    fontWeight: '600', // Semibold for selected state
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
  subscriptionDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  noticeText: {
    ...Typography.caption,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  noticeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  noticeButtonText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subscriptionHeaderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: -Spacing.md,
  },
  subscriptionHeaderTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  subscriptionContent: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: -Spacing.md,
    borderTopWidth: 1,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subscriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  subscriptionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionActions: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  subscriptionActionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  modalContent: {
    padding: Spacing.lg,
    minHeight: 300,
    maxHeight: 600,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  diagnosticsScroll: {
    maxHeight: 400,
    marginBottom: Spacing.md,
  },
  diagnosticsText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  modalButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
