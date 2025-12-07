import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useFinance } from '@/context/FinanceContext';
import { SyncService } from '@/services/SyncService';
import { useThemeColors } from '@/constants/colors';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { SetupStepper } from '@/components/onboarding/SetupStepper';
import { Camera, ArrowRight, Upload } from 'lucide-react-native';
import CategoryPicker from '@/components/forms/CategoryPicker';
import DayPicker from '@/components/forms/DayPicker';
import DatePicker from '@/components/forms/DatePicker';
import PayCadencePicker from '@/components/forms/PayCadencePicker';
import MonthlyDaysPicker from '@/components/forms/MonthlyDaysPicker';
import { CsvImportModal } from '@/components/modals';
import { CategoryType, PayCadence, PaySchedule } from '@/types/finance';

const SETUP_STORAGE_KEY_PREFIX = '@trilo:setup_completed_';

const SETUP_STEPS = [
  { label: 'Username', key: 'username' },
  { label: 'Photo', key: 'photo' },
  { label: 'Income', key: 'income' },
  { label: 'Expense', key: 'expense' },
];

export default function SetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { setNickname, setAvatarUri } = useSettings();
  const { addTransaction, reloadData } = useFinance();

  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUriLocal] = useState<string | null>(null);
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeLastPaidDate, setIncomeLastPaidDate] = useState(new Date());
  const [incomePayCadence, setIncomePayCadence] = useState<PayCadence>('every_2_weeks');
  const [incomeMonthlyDays, setIncomeMonthlyDays] = useState<number[]>([]);
  const [incomeCustomDays, setIncomeCustomDays] = useState<number[]>([]);
  const [incomeIsRecurring, setIncomeIsRecurring] = useState(true);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<CategoryType>('one_time_expense');
  const [expenseSelectedDay, setExpenseSelectedDay] = useState(new Date().getDate());
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [expenseSkipped, setExpenseSkipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    stepContent: {
      flex: 1,
      paddingHorizontal: Spacing.xxl,
      paddingTop: Spacing.xl,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.xxxl,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: Spacing.xl,
    },
    formGroup: {
      marginBottom: Spacing.xl,
    },
    incomeTypeContainer: {
      marginBottom: Spacing.xl,
      padding: Spacing.lg,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.border,
      ...Shadow.light,
    },
    incomeTypeTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
      letterSpacing: -0.2,
    },
    incomeTypeSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    label: {
      fontSize: 17,
      fontWeight: '600',
      marginBottom: Spacing.md,
      color: colors.text,
      letterSpacing: -0.2,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      fontSize: 17,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      ...Shadow.light,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: Spacing.lg,
      ...Shadow.light,
    },
    currencySymbol: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginRight: Spacing.sm,
    },
    amountInput: {
      flex: 1,
      padding: Spacing.lg,
      paddingLeft: 0,
      fontSize: 17,
      color: colors.text,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.innerCard,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      marginBottom: Spacing.lg,
    },
    avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      gap: Spacing.xs,
    },
    avatarButtonText: {
      ...Typography.bodyMedium,
      color: '#FFFFFF',
    },
    skipButton: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    skipButtonText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    buttonContainer: {
      paddingHorizontal: Spacing.xxl,
      paddingBottom: Spacing.xxxl,
      gap: Spacing.md,
    },
    nextButton: {
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      gap: Spacing.xs,
      ...Shadow.light,
    },
    nextButtonText: {
      ...Typography.bodyMedium,
      color: '#FFFFFF',
    },
    validationText: {
      ...Typography.caption,
      color: colors.error,
      marginTop: Spacing.xs,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      ...Shadow.light,
    },
    switchTextContainer: {
      flex: 1,
    },
    switchLabel: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.2,
    },
    switchSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 4,
      fontWeight: '500',
      lineHeight: 20,
    },
    helperText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: Spacing.sm,
      fontWeight: '500',
    },
    recurringNote: {
      backgroundColor: colors.cardSecondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    recurringNoteText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      fontWeight: '500',
    },
    importButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.innerCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.sm,
    },
    importButtonText: {
      ...Typography.bodyMedium,
      color: colors.text,
    },
    skipExpenseButton: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    skipExpenseButtonText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
  });

  const handleAvatarPress = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Avatar Upload',
        'Avatar upload is not available on web. This feature works on mobile devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const [mediaLibraryStatus, cameraStatus] = await Promise.all([
        ImagePicker.requestMediaLibraryPermissionsAsync(),
        ImagePicker.requestCameraPermissionsAsync(),
      ]);

      if (mediaLibraryStatus.status !== 'granted' && cameraStatus.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera or photo library.',
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
        options.push({
          text: 'Camera',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setAvatarUriLocal(result.assets[0].uri);
            }
          },
        });
      }

      if (mediaLibraryStatus.status === 'granted') {
        options.push({
          text: 'Photo Library',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setAvatarUriLocal(result.assets[0].uri);
            }
          },
        });
      }

      Alert.alert('Choose Photo', 'Select a photo source', options);
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Username
        if (username.trim().length < 2 || username.trim().length > 30) {
          Alert.alert(
            'Invalid Username',
            'Username must be between 2 and 30 characters.'
          );
          return false;
        }
        return true;
      case 1: // Photo (optional)
        return true;
      case 2: // Income
        if (!incomeName.trim()) {
          Alert.alert('Missing Information', 'Please enter an income source.');
          return false;
        }
        const incomeAmt = parseFloat(incomeAmount);
        if (!incomeAmount || isNaN(incomeAmt) || incomeAmt <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
          return false;
        }
        // Validate pay schedule for recurring income
        if (incomeIsRecurring) {
          if (incomePayCadence === 'twice_monthly' && incomeMonthlyDays.length === 0) {
            Alert.alert(
              'Missing Pay Days',
              'Please add at least one pay day for twice monthly schedule'
            );
            return false;
          }
          if (incomePayCadence === 'custom' && incomeCustomDays.length === 0) {
            Alert.alert(
              'Missing Pay Days',
              'Please add at least one pay day for custom schedule'
            );
            return false;
          }
        }
        return true;
      case 3: // Expense
        // Allow skipping expense step (explicit or implicit)
        if (expenseSkipped || (!expenseName.trim() && !expenseAmount.trim())) {
          return true;
        }
        // If user started entering data, validate it
        if (!expenseName.trim()) {
          Alert.alert('Missing Information', 'Please enter an expense name.');
          return false;
        }
        const expenseAmt = parseFloat(expenseAmount);
        if (!expenseAmount || isNaN(expenseAmt) || expenseAmt <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleSkipExpense = async () => {
    setExpenseSkipped(true);
    await handleComplete();
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Save username
      await setNickname(username.trim());

      // Save avatar if provided
      if (avatarUri) {
        await setAvatarUri(avatarUri);
      }

      // Add income - using same logic as AddTransactionModal
      const incomeAmt = parseFloat(incomeAmount);
      let incomeTransactionDate: string;
      let incomePaySchedule: PaySchedule | undefined;

      if (incomeIsRecurring) {
        // Create pay schedule for recurring income
        incomePaySchedule = {
          cadence: incomePayCadence,
          lastPaidDate: incomeLastPaidDate.toISOString(),
          monthlyDays: incomePayCadence === 'twice_monthly' ? incomeMonthlyDays : undefined,
          customDays: incomePayCadence === 'custom' ? incomeCustomDays : undefined,
        };
        // Use the last paid date as the transaction date
        incomeTransactionDate = incomeLastPaidDate.toISOString();
      } else {
        // For one-time income, use the last paid date as the transaction date
        incomeTransactionDate = incomeLastPaidDate.toISOString();
      }

      // Add income transaction
      try {
        await addTransaction({
          name: incomeName.trim(),
          amount: incomeAmt,
          category: 'income',
          date: incomeTransactionDate,
          type: 'income',
          isRecurring: incomeIsRecurring,
          paySchedule: incomePaySchedule,
        });
        console.log('Setup: Income transaction added successfully');
      } catch (error) {
        console.error('Setup: Failed to add income transaction:', error);
        setIsLoading(false);
        Alert.alert(
          'Error',
          'Failed to save your income. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add expense (only if not skipped and has data) - using same logic as AddTransactionModal
      if (!expenseSkipped && expenseName.trim() && expenseAmount.trim()) {
        const expenseAmt = parseFloat(expenseAmount);
        const today = new Date();
        let expenseTransactionDate: string;
        let expensePaySchedule: PaySchedule | undefined;

        if (expenseCategory === 'savings') {
          // Always use current month for savings
          const expenseDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            expenseSelectedDay
          );
          expenseTransactionDate = expenseDate.toISOString();
          
          // If recurring, create a monthly pay schedule
          if (expenseIsRecurring) {
            expensePaySchedule = {
              cadence: 'monthly',
              lastPaidDate: expenseDate.toISOString(),
            };
          }
        } else if (expenseIsRecurring) {
          // For other recurring expenses, use the selected day in the current month
          const expenseDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            expenseSelectedDay
          );
          expenseTransactionDate = expenseDate.toISOString();
          expensePaySchedule = {
            cadence: 'monthly',
            lastPaidDate: expenseDate.toISOString(),
          };
        } else {
          // For non-recurring expenses, try to place them in the most logical date
          let expenseDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            expenseSelectedDay
          );
          // If the date is in the past for this month, try next month
          if (expenseDate < today) {
            expenseDate = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              expenseSelectedDay
            );
          }
          expenseTransactionDate = expenseDate.toISOString();
        }

        try {
          await addTransaction({
            name: expenseName.trim(),
            amount: expenseAmt,
            category: expenseCategory,
            date: expenseTransactionDate,
            type: 'expense',
            isRecurring: expenseIsRecurring,
            paySchedule: expensePaySchedule,
          });
          console.log('Setup: Expense transaction added successfully');
        } catch (error) {
          console.error('Setup: Failed to add expense transaction:', error);
          setIsLoading(false);
          Alert.alert(
            'Error',
            'Failed to save your expense. Please try again.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Wait longer for all state updates and saves to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify data was saved to storage BEFORE reload
      // Use the same storage key format as FinanceContext
      const storageKey = `finance_transactions_v2_${user.id}`;
      console.log(`[SETUP] Checking storage with key: ${storageKey}`);
      console.log(`[SETUP] User ID: ${user.id}`);
      
      // Wait a bit more to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check all possible storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const transactionKeys = allKeys.filter(k => k.includes('finance_transactions'));
      console.log(`[SETUP] All transaction-related keys found:`, transactionKeys);
      
      const savedData = await AsyncStorage.getItem(storageKey);
      console.log(`[SETUP] Data found for key ${storageKey}:`, savedData ? 'YES' : 'NO');
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log(`[SETUP] Verified ${parsed.length} transactions saved to storage before reload`);
        console.log('[SETUP] Transaction details:', parsed.map((t: any) => ({
          name: t.name,
          type: t.type,
          amount: t.amount,
          date: t.date
        })));
      } else {
        // Try to find data in any transaction key
        console.error('[SETUP] CRITICAL - No transactions found in storage after save!');
        console.error(`[SETUP] Storage key used: ${storageKey}`);
        console.error(`[SETUP] All transaction keys:`, transactionKeys);
        
        // Try to read from any transaction key
        for (const key of transactionKeys) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            console.log(`[SETUP] Found ${parsed.length} transactions in key: ${key}`);
            if (parsed.length > 0) {
              // Data exists but in wrong key - this is the issue!
              console.error(`[SETUP] MISMATCH: Data saved to ${key} but checking ${storageKey}`);
              // Copy data to correct key
              await AsyncStorage.setItem(storageKey, data);
              console.log(`[SETUP] Copied data from ${key} to ${storageKey}`);
              break;
            }
          }
        }
        
        // Check again after potential copy
        const recheck = await AsyncStorage.getItem(storageKey);
        if (!recheck) {
          // Don't proceed if data isn't saved - this is a critical error
          setIsLoading(false);
          Alert.alert(
            'Error',
            'Failed to save your data. Please try again.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Sync all data to Supabase cloud (for UUID users only)
      // For test accounts (non-UUID), this will skip gracefully
      try {
        const syncService = new SyncService(user.id);
        await syncService.syncToCloud();
        console.log('Setup: Cloud sync completed (or skipped for test account)');
      } catch (syncError) {
        console.error('Setup: Error syncing to cloud:', syncError);
        // Continue even if sync fails - data is saved locally
      }

      // Mark setup as completed FIRST (before navigation)
      await AsyncStorage.setItem(`${SETUP_STORAGE_KEY_PREFIX}${user.id}`, 'true');

      // Force FinanceContext to reload and recalculate
      console.log('Setup: Reloading FinanceContext data...');
      await reloadData();
      console.log('Setup: FinanceContext reloaded');
      
      // Wait longer to ensure all calculations complete and state updates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Final verification after reload - check storage
      const finalCheck = await AsyncStorage.getItem(storageKey);
      
      if (finalCheck) {
        const finalParsed = JSON.parse(finalCheck);
        console.log(`Setup: Final check - ${finalParsed.length} transactions in storage after reload`);
        
        if (finalParsed.length === 0) {
          console.error('Setup: CRITICAL - Storage was cleared during reload!');
          console.error(`Setup: Storage key: ${storageKey}`);
          // Try to recover - check if data exists in a different format
          const allKeys = await AsyncStorage.getAllKeys();
          const transactionKeys = allKeys.filter(key => key.includes('finance_transactions'));
          console.log('Setup: All transaction-related keys:', transactionKeys);
        } else {
          console.log('Setup: Transaction details after reload:', finalParsed.map((t: any) => ({
            name: t.name,
            type: t.type,
            amount: t.amount,
            date: t.date
          })));
        }
      } else {
        console.error('Setup: CRITICAL - No transactions in storage after reload!');
        console.error(`Setup: Storage key checked: ${storageKey}`);
        // Debug: List all keys to see what's in storage
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('Setup: All storage keys:', allKeys.filter(key => key.includes('finance') || key.includes('transaction')));
      }

      // Navigate to main app
      // The FinanceContext will reload on mount and should find the data
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
      console.error('Setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }

    return cleaned;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Username
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>
              Choose a nickname that will appear in your profile
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                maxLength={30}
                autoFocus
              />
              <Text style={styles.validationText}>
                {username.length > 0 && (username.length < 2 || username.length > 30)
                  ? 'Username must be between 2 and 30 characters'
                  : ''}
              </Text>
            </View>
          </View>
        );

      case 1: // Photo
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Add a Profile Picture</Text>
            <Text style={styles.subtitle}>
              Choose a photo to personalize your profile (optional)
            </Text>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Camera size={40} color={colors.textSecondary} />
                </View>
              )}
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handleAvatarPress}
                activeOpacity={0.8}
              >
                <Camera size={20} color="#FFFFFF" />
                <Text style={styles.avatarButtonText}>
                  {avatarUri ? 'Change Photo' : 'Choose Photo'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      case 2: // Income
        return (
          <View style={styles.stepContent}>
            <View style={styles.incomeTypeContainer}>
              <Text style={styles.incomeTypeTitle}>Add Income Source</Text>
              <Text style={styles.incomeTypeSubtitle}>
                Track your salary, freelance work, or other income sources to
                get accurate budget insights
              </Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Income Source *</Text>
              <TextInput
                style={styles.input}
                value={incomeName}
                onChangeText={setIncomeName}
                placeholder="e.g., Salary, Freelance, Side Hustle"
                placeholderTextColor={colors.inactive}
                returnKeyType="next"
                autoCapitalize="words"
                maxLength={50}
                autoFocus
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={incomeAmount}
                  onChangeText={(text) => setIncomeAmount(formatAmount(text))}
                  placeholder="0.00"
                  placeholderTextColor={colors.inactive}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={10}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <DatePicker
                selectedDate={incomeLastPaidDate}
                onDateSelect={setIncomeLastPaidDate}
                label='Most Recent Pay Date *'
                maximumDate={new Date()}
                variant='income'
              />
            </View>
            <View style={styles.formGroup}>
              <PayCadencePicker
                selectedCadence={incomePayCadence}
                onCadenceSelect={setIncomePayCadence}
              />
            </View>
            {incomePayCadence === 'twice_monthly' && (
              <View style={styles.formGroup}>
                <MonthlyDaysPicker
                  selectedDays={incomeMonthlyDays}
                  onDaysChange={setIncomeMonthlyDays}
                  maxDays={2}
                  label='Pay Days (Twice Monthly) *'
                />
              </View>
            )}
            {incomePayCadence === 'custom' && (
              <View style={styles.formGroup}>
                <MonthlyDaysPicker
                  selectedDays={incomeCustomDays}
                  onDaysChange={setIncomeCustomDays}
                  maxDays={10}
                  label='Custom Pay Days *'
                />
              </View>
            )}
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Recurring Income</Text>
                <Text style={styles.switchSubtitle}>
                  {incomeIsRecurring
                    ? 'This income repeats regularly (salary, pension)'
                    : 'One-time income (bonus, gift, freelance project)'}
                </Text>
              </View>
              <Switch
                value={incomeIsRecurring}
                onValueChange={setIncomeIsRecurring}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            {incomeIsRecurring && (
              <View style={styles.recurringNote}>
                <Text style={styles.recurringNoteText}>
                  💡 Recurring income helps with accurate budget planning and
                  weekly overviews
                </Text>
              </View>
            )}
          </View>
        );

      case 3: // Expense
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Add Your First Expense</Text>
            <Text style={styles.subtitle}>
              Track your expenses to get accurate budget insights
            </Text>
            <TouchableOpacity
              style={styles.importButton}
              onPress={() => setShowCsvImport(true)}
              activeOpacity={0.8}
            >
              <Upload size={20} color={colors.primary} />
              <Text style={styles.importButtonText}>Import expenses (CSV)</Text>
            </TouchableOpacity>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Expense Name *</Text>
              <TextInput
                style={styles.input}
                value={expenseName}
                onChangeText={setExpenseName}
                placeholder="e.g., Groceries, Netflix"
                placeholderTextColor={colors.inactive}
                returnKeyType="next"
                autoCapitalize="words"
                maxLength={50}
                autoFocus
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={expenseAmount}
                  onChangeText={(text) => setExpenseAmount(formatAmount(text))}
                  placeholder="0.00"
                  placeholderTextColor={colors.inactive}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={10}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <CategoryPicker
                selectedCategory={expenseCategory}
                onCategorySelect={setExpenseCategory}
                excludeCategories={['income']}
                label="Category *"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Day of Month *</Text>
              <DayPicker
                selectedDay={expenseSelectedDay}
                onDaySelect={setExpenseSelectedDay}
              />
            </View>
            {expenseCategory !== 'given_expenses' &&
              expenseCategory !== 'one_time_expense' && (
                <View style={styles.switchContainer}>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchLabel}>Recurring Expense</Text>
                    <Text style={styles.switchSubtitle}>
                      {expenseIsRecurring
                        ? 'This expense repeats monthly (subscriptions, bills)'
                        : 'One-time expense (purchases, dining out)'}
                    </Text>
                  </View>
                  <Switch
                    value={expenseIsRecurring}
                    onValueChange={setExpenseIsRecurring}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor={colors.card}
                  />
                </View>
              )}
            <TouchableOpacity
              style={styles.skipExpenseButton}
              onPress={handleSkipExpense}
              activeOpacity={0.7}
            >
              <Text style={styles.skipExpenseButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SetupStepper
          currentStep={currentStep}
          totalSteps={SETUP_STEPS.length}
          stepLabels={SETUP_STEPS.map((s) => s.label)}
        />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === SETUP_STEPS.length - 1
                    ? 'Complete Setup'
                    : 'Next'}
                </Text>
                {currentStep < SETUP_STEPS.length - 1 && (
                  <ArrowRight size={20} color="#FFFFFF" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <CsvImportModal
        visible={showCsvImport}
        onClose={() => setShowCsvImport(false)}
      />
    </SafeAreaView>
  );
}

