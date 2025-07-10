import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Switch, 
  TouchableOpacity,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { X } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import CategoryPicker from '@/components/CategoryPicker';
import DayPicker from '@/components/DayPicker';
import WeekDayPicker from '@/components/WeekDayPicker';
import WeekNumberPicker from '@/components/WeekNumberPicker';
import Button from '@/components/Button';
import AlertModal from '@/components/AlertModal';
import { useAlert } from '@/hooks/useAlert';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { CategoryType, TransactionType } from '@/types/finance';
import { calculateIncomeDate } from '@/utils/dateUtils';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
  const { addTransaction } = useFinance();
  const { alertState, showAlert, hideAlert } = useAlert();
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('miscellaneous');
  const [isRecurring, setIsRecurring] = useState(false);
  
  // For expenses (day of month)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  // For income (week and day)
  const [selectedWeekDay, setSelectedWeekDay] = useState('friday');
  const [selectedWeekNumber, setSelectedWeekNumber] = useState(2);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setName('');
      setAmount('');
      setSelectedDay(new Date().getDate());
      setSelectedWeekDay('friday');
      setSelectedWeekNumber(2);
      setIsLoading(false);
    }
  }, [visible]);
  
  useEffect(() => {
    if (transactionType === 'income') {
      setCategory('income');
      setIsRecurring(true);
    } else {
      setCategory('miscellaneous');
      setIsRecurring(false);
    }
  }, [transactionType]);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert({
        title: 'Missing Information',
        message: `Please enter a ${transactionType} name`,
        type: 'warning',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount greater than 0',
        type: 'warning',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let transactionDate: string;
      let weekDay: string | undefined;
      let weekNumber: number | undefined;
      
      if (transactionType === 'income') {
        // Calculate date from week and day
        transactionDate = calculateIncomeDate(selectedWeekNumber, selectedWeekDay);
        weekDay = selectedWeekDay;
        weekNumber = selectedWeekNumber;
      } else {
        // Use day of month for expenses
        const today = new Date();
        const expenseDate = new Date(today.getFullYear(), today.getMonth(), selectedDay);
        transactionDate = expenseDate.toISOString();
      }

      await addTransaction({
        name: name.trim(),
        amount: numAmount,
        category,
        date: transactionDate,
        type: transactionType,
        isRecurring,
        weekDay,
        weekNumber,
      });
      
      showAlert({
        title: 'Success!',
        message: `${transactionType === 'income' ? 'Income' : 'Expense'} added successfully!`,
        type: 'success',
        actions: [{ 
          text: 'OK', 
          onPress: () => {
            onClose();
          }
        }],
      });
    } catch (error) {
      showAlert({
        title: 'Error',
        message: `Failed to add ${transactionType}. Please try again.`,
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (name.trim() || amount.trim()) {
      showAlert({
        title: 'Discard Changes',
        message: 'Are you sure you want to discard this transaction?',
        type: 'warning',
        actions: [
          { text: 'Keep Editing', onPress: () => {}, style: 'cancel' },
          { text: 'Discard', onPress: onClose, style: 'destructive' }
        ],
      });
    } else {
      onClose();
    }
  };

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Transaction</Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X size={24} color={Colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Transaction Type Toggle */}
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'expense' && styles.typeButtonActive
                  ]}
                  onPress={() => setTransactionType('expense')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'income' && styles.typeButtonActive,
                    transactionType === 'income' && styles.incomeTypeButtonActive
                  ]}
                  onPress={() => setTransactionType('income')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.incomeTypeButtonTextActive
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={[
                  styles.label,
                  transactionType === 'income' && styles.incomeLabel
                ]}>
                  {transactionType === 'income' ? 'Income Source' : 'Expense Name'} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    transactionType === 'income' && styles.incomeInput
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder={transactionType === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Groceries, Netflix'}
                  placeholderTextColor={Colors.inactive}
                  returnKeyType="next"
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[
                  styles.label,
                  transactionType === 'income' && styles.incomeLabel
                ]}>
                  Amount *
                </Text>
                <View style={[
                  styles.amountContainer,
                  transactionType === 'income' && styles.incomeAmountContainer
                ]}>
                  <Text style={[
                    styles.currencySymbol,
                    { color: transactionType === 'income' ? Colors.income : Colors.text }
                  ]}>
                    $
                  </Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => setAmount(formatAmount(text))}
                    placeholder="0.00"
                    placeholderTextColor={Colors.inactive}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    maxLength={10}
                  />
                </View>
              </View>
              
              {transactionType === 'expense' && (
                <CategoryPicker
                  selectedCategory={category}
                  onCategorySelect={setCategory}
                  excludeCategories={['income']}
                  label="Category *"
                />
              )}
              
              {/* Date/Time Selection */}
              {transactionType === 'income' ? (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, styles.incomeLabel]}>
                    Income Schedule *
                  </Text>
                  <Text style={styles.scheduleSubtitle}>
                    Choose when you receive this income each month
                  </Text>
                  
                  <View style={styles.weekPickerContainer}>
                    <View style={styles.weekPickerRow}>
                      <View style={styles.weekPickerItem}>
                        <Text style={styles.weekPickerLabel}>Week</Text>
                        <WeekNumberPicker
                          selectedWeek={selectedWeekNumber}
                          onWeekSelect={setSelectedWeekNumber}
                        />
                      </View>
                      
                      <View style={styles.weekPickerItem}>
                        <Text style={styles.weekPickerLabel}>Day</Text>
                        <WeekDayPicker
                          selectedDay={selectedWeekDay}
                          onDaySelect={setSelectedWeekDay}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Day of Month *</Text>
                  <DayPicker
                    selectedDay={selectedDay}
                    onDaySelect={setSelectedDay}
                  />
                </View>
              )}
              
              <View style={[
                styles.switchContainer,
                transactionType === 'income' && styles.incomeSwitchContainer
              ]}>
                <View style={styles.switchTextContainer}>
                  <Text style={[
                    styles.switchLabel,
                    transactionType === 'income' && styles.incomeSwitchLabel
                  ]}>
                    {transactionType === 'income' ? 'Recurring Income' : 'Recurring Expense'}
                  </Text>
                  <Text style={styles.switchSubtitle}>
                    {transactionType === 'income' 
                      ? (isRecurring 
                          ? 'This income repeats monthly (salary, pension)' 
                          : 'One-time income (bonus, gift, freelance project)')
                      : (isRecurring 
                          ? 'This expense repeats monthly (subscriptions, bills)' 
                          : 'One-time expense (purchases, dining out)')
                    }
                  </Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ 
                    false: Colors.border, 
                    true: transactionType === 'income' ? Colors.income : Colors.primary 
                  }}
                  thumbColor={Colors.card}
                />
              </View>
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="outline"
                size="large"
                style={styles.cancelButton}
              />
              <Button
                title={`Add ${transactionType === 'income' ? 'Income' : 'Expense'}`}
                onPress={handleSubmit}
                variant="primary"
                size="large"
                loading={isLoading}
                disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
                style={[
                  styles.submitButton,
                  transactionType === 'income' && styles.incomeSubmitButton
                ]}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginVertical: Spacing.lg,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  typeButtonActive: {
    backgroundColor: Colors.card,
    ...Shadow.light,
  },
  incomeTypeButtonActive: {
    backgroundColor: Colors.income,
    borderWidth: 1,
    borderColor: Colors.income,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.text,
  },
  incomeTypeButtonTextActive: {
    color: Colors.card,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  incomeLabel: {
    color: Colors.income,
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
  incomeInput: {
    borderColor: Colors.income,
    borderWidth: 2,
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
  incomeAmountContainer: {
    borderColor: Colors.income,
    borderWidth: 2,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    padding: Spacing.lg,
    paddingLeft: 0,
    fontSize: 17,
    color: Colors.text,
  },
  scheduleSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontWeight: '500',
    lineHeight: 20,
  },
  weekPickerContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.income,
    ...Shadow.light,
  },
  weekPickerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  weekPickerItem: {
    flex: 1,
  },
  weekPickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.income,
    marginBottom: Spacing.sm,
    letterSpacing: -0.1,
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
  incomeSwitchContainer: {
    borderWidth: 2,
    borderColor: Colors.income,
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
  incomeSwitchLabel: {
    color: Colors.income,
  },
  switchSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  incomeSubmitButton: {
    backgroundColor: Colors.income,
  },
});