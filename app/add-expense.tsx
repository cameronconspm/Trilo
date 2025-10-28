import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import CategoryPicker from '@/components/forms/CategoryPicker';
import Button from '@/components/layout/Button';
import Colors from '@/constants/colors';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
} from '@/constants/spacing';
import { CategoryType } from '@/types/finance';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { addTransaction } = useFinance();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('one_time_expense');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter an expense name');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount greater than 0'
      );
      return;
    }

    // Validate day of month
    if (selectedDay < 1 || selectedDay > 31) {
      Alert.alert(
        'Invalid Day',
        'Please select a valid day of the month (1-31)'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Calculate the transaction date based on selected day
      const today = new Date();
      let transactionDate = new Date(today.getFullYear(), today.getMonth(), selectedDay);
      
      // If the selected day has already passed this month, use next month
      if (transactionDate < today) {
        transactionDate = new Date(today.getFullYear(), today.getMonth() + 1, selectedDay);
      }

      await addTransaction({
        name: name.trim(),
        amount: numAmount,
        category,
        date: transactionDate.toISOString(),
        type: 'expense',
        isRecurring,
      });

      // Show success message
      Alert.alert(
        'Expense Added',
        `${name} for $${numAmount.toFixed(2)} has been added successfully.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (name.trim() || amount.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard this expense?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Expense Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder='Enter expense name'
                placeholderTextColor={Colors.inactive}
                returnKeyType='next'
                autoCapitalize='words'
                maxLength={50}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={text => setAmount(formatAmount(text))}
                  placeholder='0.00'
                  placeholderTextColor={Colors.inactive}
                  keyboardType='decimal-pad'
                  returnKeyType='done'
                  maxLength={10}
                />
              </View>
            </View>

            <CategoryPicker
              selectedCategory={category}
              onCategorySelect={setCategory}
              excludeCategories={['income']}
              label='Category *'
            />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Day of Month *</Text>
              <TouchableOpacity
                style={styles.dayPicker}
                onPress={() => setShowDayPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dayPickerText}>
                  {selectedDay}th of the month
                </Text>
                <ChevronDown size={20} color={Colors.inactive} />
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Choose which day this expense occurs each month
              </Text>
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Recurring Expense</Text>
                <Text style={styles.switchSubtitle}>
                  {isRecurring
                    ? 'This expense repeats monthly (subscriptions, bills)'
                    : 'One-Time Expenses (purchases, dining out)'}
                </Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.card}
              />
            </View>
          </View>
        </ScrollView>

        {/* Day Picker Modal */}
        <Modal
          visible={showDayPicker}
          transparent
          animationType='fade'
          onRequestClose={() => setShowDayPicker(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowDayPicker(false)}
          >
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Day of Month</Text>
                <Text style={styles.modalSubtitle}>
                  Choose when this expense occurs each month
                </Text>
              </View>
              
              <ScrollView 
                style={styles.daysList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.daysContent}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayOption,
                      selectedDay === day && styles.selectedDayOption,
                    ]}
                    onPress={() => {
                      setSelectedDay(day);
                      setShowDayPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selectedDay === day && styles.selectedDayText,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.buttonContainer}>
          <Button
            title='Cancel'
            onPress={handleCancel}
            variant='outline'
            size='medium'
          />
          <Button
            title='Add Expense'
            onPress={handleSubmit}
            variant='primary'
            size='medium'
            loading={isLoading}
            disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
            fullWidth={true}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 24,
    paddingBottom: 30,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: SpacingValues.screenHorizontal,
    paddingBottom: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    ...Shadow.light,
  },
  helperText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  dayPicker: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.light,
  },
  dayPickerText: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    width: '100%',
    maxHeight: '70%',
    ...Shadow.heavy,
  },
  modalHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  daysList: {
    maxHeight: 400,
  },
  daysContent: {
    padding: Spacing.md,
  },
  dayOption: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDayOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedDayText: {
    color: Colors.card,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.lg,
    ...Shadow.light,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    padding: Spacing.lg,
    paddingLeft: 0,
    fontSize: 17,
    color: Colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
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
    color: Colors.text,
    letterSpacing: -0.2,
  },
  switchSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20, // ENFORCED: 20px padding
    paddingBottom:
      Platform.OS === 'ios' ? SpacingValues.screenBottom : 24, // ENFORCED: 24pt minimum
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12, // ENFORCED: 12pt spacing between buttons
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
