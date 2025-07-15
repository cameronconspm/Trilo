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
  SafeAreaView,
  Alert
} from 'react-native';
import { X } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import CategoryPicker from '@/components/CategoryPicker';
import DayPicker from '@/components/DayPicker';
import DatePicker from '@/components/DatePicker';
import PayCadencePicker from '@/components/PayCadencePicker';
import MonthlyDaysPicker from '@/components/MonthlyDaysPicker';
import GivenExpenseFrequencyPicker from '@/components/GivenExpenseFrequencyPicker';
import Button from '@/components/Button';
import AlertModal from '@/components/AlertModal';
import { useAlert } from '@/hooks/useAlert';
import { useThemeColors } from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { CategoryType, TransactionType, PayCadence, PaySchedule, Transaction, GivenExpenseFrequency, GivenExpenseSchedule } from '@/types/finance';
import { calculateNextPayDate } from '@/utils/payScheduleUtils';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  editTransaction?: Transaction;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AddTransactionModal({ visible, onClose, editTransaction }: AddTransactionModalProps) {
  const { addTransaction, updateTransaction } = useFinance();
  const { alertState, showAlert, hideAlert } = useAlert();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('one_time_expense');
  const [isRecurring, setIsRecurring] = useState(false);
  
  // For expenses (day of month)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  // For income (pay schedule)
  const [lastPaidDate, setLastPaidDate] = useState(new Date());
  const [payCadence, setPayCadence] = useState<PayCadence>('every_2_weeks');
  const [monthlyDays, setMonthlyDays] = useState<number[]>([]);
  const [customDays, setCustomDays] = useState<number[]>([]);
  
  // For given expenses
  const [givenExpenseFrequency, setGivenExpenseFrequency] = useState<GivenExpenseFrequency>('every_week');
  const [givenExpenseStartDate, setGivenExpenseStartDate] = useState(new Date());
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset form when modal opens or populate with edit data
  useEffect(() => {
    if (visible) {
      if (editTransaction) {
        // Populate form with existing transaction data
        setTransactionType(editTransaction.type);
        setName(editTransaction.name);
        setAmount(editTransaction.amount.toString());
        setCategory(editTransaction.category);
        setIsRecurring(editTransaction.isRecurring);
        
        if (editTransaction.type === 'income' && editTransaction.paySchedule) {
          setLastPaidDate(new Date(editTransaction.paySchedule.lastPaidDate));
          setPayCadence(editTransaction.paySchedule.cadence);
          setMonthlyDays(editTransaction.paySchedule.monthlyDays || []);
          setCustomDays(editTransaction.paySchedule.customDays || []);
        } else if (editTransaction.category === 'given_expenses' && editTransaction.givenExpenseSchedule) {
          setGivenExpenseFrequency(editTransaction.givenExpenseSchedule.frequency);
          setGivenExpenseStartDate(new Date(editTransaction.givenExpenseSchedule.startDate));
        } else {
          const transactionDate = new Date(editTransaction.date);
          setSelectedDay(transactionDate.getDate());
        }
      } else {
        // Reset form for new transaction
        setName('');
        setAmount('');
        setSelectedDay(new Date().getDate());
        setLastPaidDate(new Date());
        setPayCadence('every_2_weeks');
        setMonthlyDays([]);
        setCustomDays([]);
        setGivenExpenseFrequency('every_week');
        setGivenExpenseStartDate(new Date());
      }
      setIsLoading(false);
    }
  }, [visible, editTransaction]);
  
  useEffect(() => {
    if (transactionType === 'income') {
      setCategory('income');
      if (!editTransaction) {
        setIsRecurring(true);
      }
    } else {
      if (!editTransaction) {
        setCategory('one_time_expense');
        setIsRecurring(false);
      }
    }
  }, [transactionType, editTransaction]);

  // Handle given expenses recurring state
  useEffect(() => {
    if (category === 'given_expenses') {
      setIsRecurring(true); // Given expenses are always recurring
    }
  }, [category]);
  
  const handleSubmit = async () => {
    console.log('Submit button pressed'); // Debug log
    
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
    
    // Validate pay schedule for income
    if (transactionType === 'income' && isRecurring) {
      if (payCadence === 'twice_monthly' && monthlyDays.length === 0) {
        showAlert({
          title: 'Missing Pay Days',
          message: 'Please add at least one pay day for twice monthly schedule',
          type: 'warning',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
        return;
      }
      
      if (payCadence === 'custom' && customDays.length === 0) {
        showAlert({
          title: 'Missing Pay Days',
          message: 'Please add at least one pay day for custom schedule',
          type: 'warning',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      let transactionDate: string;
      let paySchedule: PaySchedule | undefined;
      let givenExpenseSchedule: GivenExpenseSchedule | undefined;
      
      if (transactionType === 'income' && isRecurring) {
        // Create pay schedule for recurring income
        paySchedule = {
          cadence: payCadence,
          lastPaidDate: lastPaidDate.toISOString(),
          monthlyDays: payCadence === 'twice_monthly' ? monthlyDays : undefined,
          customDays: payCadence === 'custom' ? customDays : undefined,
        };
        
        // Use the last paid date as the transaction date (when income was received)
        transactionDate = lastPaidDate.toISOString();
      } else if (transactionType === 'income' && !isRecurring) {
        // For one-time income, use the last paid date as the transaction date
        transactionDate = lastPaidDate.toISOString();
      } else if (category === 'given_expenses') {
        // Handle given expenses with frequency schedule
        givenExpenseSchedule = {
          frequency: givenExpenseFrequency,
          startDate: givenExpenseStartDate.toISOString(),
        };
        
        // Use the start date as the transaction date
        transactionDate = givenExpenseStartDate.toISOString();
      } else {
        // Use day of month for regular expenses - resolve to appropriate date
        const today = new Date();
        let expenseDate = new Date(today.getFullYear(), today.getMonth(), selectedDay);
        
        // For non-recurring expenses, try to place them in the most logical date
        if (!isRecurring) {
          // If the date is in the past for this month, try next month
          if (expenseDate < today) {
            const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, selectedDay);
            expenseDate = nextMonthDate;
          }
        } else {
          // For recurring expenses, use the selected day in the current month
          // The pay period logic will handle the proper scheduling
          expenseDate = new Date(today.getFullYear(), today.getMonth(), selectedDay);
        }
        
        transactionDate = expenseDate.toISOString();
      }

      if (editTransaction) {
        console.log('Updating transaction:', editTransaction.id);
        await updateTransaction(editTransaction.id, {
          name: name.trim(),
          amount: numAmount,
          category,
          date: transactionDate,
          type: transactionType,
          isRecurring: category === 'given_expenses' ? true : isRecurring, // Given expenses are always recurring
          paySchedule,
          givenExpenseSchedule,
        });
        console.log('Transaction updated successfully');
      } else {
        console.log('Adding transaction:', {
          name: name.trim(),
          amount: numAmount,
          category,
          date: transactionDate,
          type: transactionType,
          isRecurring: category === 'given_expenses' ? true : isRecurring, // Given expenses are always recurring
          paySchedule,
          givenExpenseSchedule,
        });

        await addTransaction({
          name: name.trim(),
          amount: numAmount,
          category,
          date: transactionDate,
          type: transactionType,
          isRecurring: category === 'given_expenses' ? true : isRecurring, // Given expenses are always recurring
          paySchedule,
          givenExpenseSchedule,
        });
        
        console.log('Transaction added successfully');
      }
      
      // Close modal immediately after successful save
      onClose();
      
      // Show success message after modal is closed
      setTimeout(() => {
        showAlert({
          title: 'Success!',
          message: `${transactionType === 'income' ? 'Income' : 'Expense'} ${editTransaction ? 'updated' : 'added'} successfully!`,
          type: 'success',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
      }, 100);
      
    } catch (error) {
      console.error('Error saving transaction:', error); // Debug log
      showAlert({
        title: 'Error',
        message: `Failed to ${editTransaction ? 'update' : 'add'} ${transactionType}. Please try again.`,
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    const hasData = name.trim() || amount.trim();
    
    // Reset all fields
    setName('');
    setAmount('');
    setCategory(transactionType === 'income' ? 'income' : 'one_time_expense');
    setSelectedDay(new Date().getDate());
    setLastPaidDate(new Date());
    setPayCadence('every_2_weeks');
    setMonthlyDays([]);
    setCustomDays([]);
    setGivenExpenseFrequency('every_week');
    setGivenExpenseStartDate(new Date());
    setIsRecurring(transactionType === 'income');
    
    if (hasData) {
      showAlert({
        title: 'Fields Cleared',
        message: 'All fields have been cleared',
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
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

  const renderPayScheduleInputs = () => {
    if (payCadence === 'twice_monthly') {
      return (
        <MonthlyDaysPicker
          selectedDays={monthlyDays}
          onDaysChange={setMonthlyDays}
          maxDays={2}
          label="Pay Days (Twice Monthly)"
        />
      );
    }
    
    if (payCadence === 'custom') {
      return (
        <MonthlyDaysPicker
          selectedDays={customDays}
          onDaysChange={setCustomDays}
          maxDays={10}
          label="Custom Pay Days"
        />
      );
    }
    
    return null;
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.4,
    },
    closeButton: {
      width: Math.max(40, Spacing.minTouchTarget),
      height: Math.max(40, Spacing.minTouchTarget),
      borderRadius: BorderRadius.full,
      backgroundColor: colors.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    typeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.cardSecondary,
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
      backgroundColor: colors.card,
      ...Shadow.light,
    },
    incomeTypeButtonActive: {
      backgroundColor: colors.card,
      ...Shadow.light,
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    typeButtonTextActive: {
      color: colors.text,
    },
    incomeTypeButtonTextActive: {
      color: colors.text,
    },
    formGroup: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: 17,
      fontWeight: '600',
      marginBottom: Spacing.md,
      color: colors.text,
      letterSpacing: -0.2,
    },
    incomeLabel: {
      color: colors.income,
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
    incomeInput: {
      borderColor: colors.income,
      borderWidth: 2,
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
    incomeAmountContainer: {
      borderColor: colors.income,
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
      color: colors.text,
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
    incomeSwitchContainer: {
      borderWidth: 2,
      borderColor: colors.income,
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
    incomeSwitchLabel: {
      color: colors.income,
    },
    switchSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 4,
      fontWeight: '500',
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: Spacing.sm,
      backgroundColor: colors.background,
    },
    resetButton: {
      flex: 1,
    },
    cancelButton: {
      flex: 1,
    },
    submitButton: {
      flex: 2,
    },
    incomeSubmitButton: {
      backgroundColor: colors.income,
    },
  });

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={dynamicStyles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={dynamicStyles.container}
          >
            {/* Header */}
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.title}>{editTransaction ? 'Edit Transaction' : 'Add Expense / Income'}</Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={dynamicStyles.closeButton}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={dynamicStyles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={dynamicStyles.scrollContent}
            >
              {/* Transaction Type Toggle */}
              <View style={dynamicStyles.typeToggle}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.typeButton,
                    transactionType === 'expense' && dynamicStyles.typeButtonActive
                  ]}
                  onPress={() => setTransactionType('expense')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    dynamicStyles.typeButtonText,
                    transactionType === 'expense' && dynamicStyles.typeButtonTextActive
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    dynamicStyles.typeButton,
                    transactionType === 'income' && dynamicStyles.typeButtonActive,
                    transactionType === 'income' && dynamicStyles.incomeTypeButtonActive
                  ]}
                  onPress={() => setTransactionType('income')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    dynamicStyles.typeButtonText,
                    transactionType === 'income' && dynamicStyles.incomeTypeButtonTextActive
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Form Fields */}
              <View style={dynamicStyles.formGroup}>
                <Text style={[
                  dynamicStyles.label,
                  transactionType === 'income' && dynamicStyles.incomeLabel
                ]}>
                  {transactionType === 'income' ? 'Income Source' : 'Expense Name'} *
                </Text>
                <TextInput
                  style={[
                    dynamicStyles.input,
                    transactionType === 'income' && dynamicStyles.incomeInput
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder={transactionType === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Groceries, Netflix'}
                  placeholderTextColor={colors.inactive}
                  returnKeyType="next"
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>
              
              <View style={dynamicStyles.formGroup}>
                <Text style={[
                  dynamicStyles.label,
                  transactionType === 'income' && dynamicStyles.incomeLabel
                ]}>
                  Amount *
                </Text>
                <View style={[
                  dynamicStyles.amountContainer,
                  transactionType === 'income' && dynamicStyles.incomeAmountContainer
                ]}>
                  <Text style={[
                    dynamicStyles.currencySymbol,
                    { color: transactionType === 'income' ? colors.income : colors.text }
                  ]}>
                    $
                  </Text>
                  <TextInput
                    style={dynamicStyles.amountInput}
                    value={amount}
                    onChangeText={(text) => setAmount(formatAmount(text))}
                    placeholder="0.00"
                    placeholderTextColor={colors.inactive}
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
              
              {/* Date/Schedule Selection */}
              {transactionType === 'income' ? (
                <View style={dynamicStyles.formGroup}>
                  <DatePicker
                    selectedDate={lastPaidDate}
                    onDateSelect={setLastPaidDate}
                    label="Most Recent Pay Date"
                    maximumDate={new Date()}
                    variant="income"
                  />
                  
                  <PayCadencePicker
                    selectedCadence={payCadence}
                    onCadenceSelect={setPayCadence}
                  />
                  
                  {renderPayScheduleInputs()}
                </View>
              ) : category === 'given_expenses' ? (
                <View style={dynamicStyles.formGroup}>
                  <GivenExpenseFrequencyPicker
                    selectedFrequency={givenExpenseFrequency}
                    onFrequencySelect={setGivenExpenseFrequency}
                    label="Apply to *"
                  />
                  
                  <DatePicker
                    selectedDate={givenExpenseStartDate}
                    onDateSelect={setGivenExpenseStartDate}
                    label="Start Date"
                    minimumDate={new Date()}
                    variant="default"
                  />
                </View>
              ) : (
                <View style={dynamicStyles.formGroup}>
                  <Text style={dynamicStyles.label}>Day of Month *</Text>
                  <DayPicker
                    selectedDay={selectedDay}
                    onDaySelect={setSelectedDay}
                  />
                </View>
              )}
              
              {/* Only show recurring toggle for non-given expenses */}
              {category !== 'given_expenses' && (
                <View style={[
                  dynamicStyles.switchContainer,
                  transactionType === 'income' && dynamicStyles.incomeSwitchContainer
                ]}>
                  <View style={dynamicStyles.switchTextContainer}>
                    <Text style={[
                      dynamicStyles.switchLabel,
                      transactionType === 'income' && dynamicStyles.incomeSwitchLabel
                    ]}>
                      {transactionType === 'income' ? 'Recurring Income' : 'Recurring Expense'}
                    </Text>
                    <Text style={dynamicStyles.switchSubtitle}>
                      {transactionType === 'income' 
                        ? (isRecurring 
                            ? 'This income repeats based on your pay schedule' 
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
                      false: colors.border, 
                      true: transactionType === 'income' ? colors.income : colors.primary 
                    }}
                    thumbColor={colors.card}
                  />
                </View>
              )}
            </ScrollView>
            
            {/* Footer */}
            <View style={dynamicStyles.footer}>
              <Button
                title="Reset"
                onPress={handleReset}
                variant="ghost"
                size="large"
                style={dynamicStyles.resetButton}
              />
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="outline"
                size="large"
                style={dynamicStyles.cancelButton}
              />
              <Button
                title={`Save ${transactionType === 'income' ? 'Income' : 'Expense'}`}
                onPress={handleSubmit}
                variant="primary"
                size="large"
                loading={isLoading}
                disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
                style={[
                  dynamicStyles.submitButton,
                  transactionType === 'income' && dynamicStyles.incomeSubmitButton
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

