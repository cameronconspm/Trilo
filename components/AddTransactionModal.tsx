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
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
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

interface TransactionEntry {
  id: string;
  name: string;
  amount: string;
  category: CategoryType;
  isRecurring: boolean;
  selectedDay: number;
  lastPaidDate: Date;
  payCadence: PayCadence;
  monthlyDays: number[];
  customDays: number[];
  givenExpenseFrequency: GivenExpenseFrequency;
  isCollapsed: boolean;
}

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  editTransaction?: Transaction;
  preselectedCategory?: CategoryType;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AddTransactionModal({ visible, onClose, editTransaction, preselectedCategory }: AddTransactionModalProps) {
  const { addTransaction, updateTransaction } = useFinance();
  const { alertState, showAlert, hideAlert } = useAlert();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [entries, setEntries] = useState<TransactionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createEmptyEntry = (): TransactionEntry => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: '',
    amount: '',
    category: transactionType === 'income' ? 'income' : (preselectedCategory || 'one_time_expense'),
    isRecurring: transactionType === 'income',
    selectedDay: new Date().getDate(),
    lastPaidDate: new Date(),
    payCadence: 'every_2_weeks',
    monthlyDays: [],
    customDays: [],
    givenExpenseFrequency: 'every_week',
    isCollapsed: false,
  });
  
  // Reset form when modal opens or populate with edit data
  useEffect(() => {
    if (visible) {
      if (editTransaction) {
        // For editing, create a single entry with existing transaction data
        const entry: TransactionEntry = {
          id: editTransaction.id,
          name: editTransaction.name,
          amount: editTransaction.amount.toString(),
          category: editTransaction.category,
          isRecurring: editTransaction.isRecurring,
          selectedDay: new Date(editTransaction.date).getDate(),
          lastPaidDate: editTransaction.paySchedule ? new Date(editTransaction.paySchedule.lastPaidDate) : new Date(),
          payCadence: editTransaction.paySchedule?.cadence || 'every_2_weeks',
          monthlyDays: editTransaction.paySchedule?.monthlyDays || [],
          customDays: editTransaction.paySchedule?.customDays || [],
          givenExpenseFrequency: editTransaction.givenExpenseSchedule?.frequency || 'every_week',
          isCollapsed: false,
        };
        
        setTransactionType(editTransaction.type);
        setEntries([entry]);
      } else {
        // Reset form for new transaction - start with one empty entry
        setEntries([createEmptyEntry()]);
        
        // Set preselected category if provided
        if (preselectedCategory) {
          setTransactionType('expense');
        }
      }
      setIsLoading(false);
    }
  }, [visible, editTransaction, preselectedCategory]);
  
  useEffect(() => {
    // Update all entries when transaction type changes
    setEntries(prevEntries => 
      prevEntries.map(entry => ({
        ...entry,
        category: transactionType === 'income' ? 'income' : (preselectedCategory || 'one_time_expense'),
        isRecurring: transactionType === 'income',
      }))
    );
  }, [transactionType, preselectedCategory]);

  // Helper functions for managing entries
  const addNewEntry = () => {
    const newEntry = createEmptyEntry();
    setEntries(prev => [...prev, newEntry]);
  };

  const removeEntry = (entryId: string) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    }
  };

  const updateEntry = (entryId: string, updates: Partial<TransactionEntry>) => {
    setEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { 
              ...entry, 
              ...updates,
              // Handle given expenses recurring state
              isRecurring: updates.category === 'given_expenses' ? true : (updates.isRecurring ?? entry.isRecurring)
            }
          : entry
      )
    );
  };

  const toggleEntryCollapse = (entryId: string) => {
    setEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, isCollapsed: !entry.isCollapsed }
          : entry
      )
    );
  };
  
  const handleSubmit = async () => {
    console.log('Submit button pressed'); // Debug log
    
    // Validate all entries
    const validEntries = entries.filter(entry => entry.name.trim() && entry.amount.trim());
    
    if (validEntries.length === 0) {
      showAlert({
        title: 'No Valid Entries',
        message: 'Please add at least one complete entry with name and amount',
        type: 'warning',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // Validate each entry
    for (const entry of validEntries) {
      const numAmount = parseFloat(entry.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        showAlert({
          title: 'Invalid Amount',
          message: `Please enter a valid amount greater than 0 for "${entry.name}"`,
          type: 'warning',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
        return;
      }

      // Validate pay schedule for income
      if (transactionType === 'income' && entry.isRecurring) {
        if (entry.payCadence === 'twice_monthly' && entry.monthlyDays.length === 0) {
          showAlert({
            title: 'Missing Pay Days',
            message: `Please add at least one pay day for twice monthly schedule for "${entry.name}"`,
            type: 'warning',
            actions: [{ text: 'OK', onPress: () => {} }],
          });
          return;
        }
        
        if (entry.payCadence === 'custom' && entry.customDays.length === 0) {
          showAlert({
            title: 'Missing Pay Days',
            message: `Please add at least one pay day for custom schedule for "${entry.name}"`,
            type: 'warning',
            actions: [{ text: 'OK', onPress: () => {} }],
          });
          return;
        }
      }
    }
    
    setIsLoading(true);
    
    try {
      if (editTransaction && validEntries.length === 1) {
        // Single entry edit mode
        const entry = validEntries[0];
        const { transactionDate, paySchedule, givenExpenseSchedule } = processEntryData(entry);
        
        await updateTransaction(editTransaction.id, {
          name: entry.name.trim(),
          amount: parseFloat(entry.amount),
          category: entry.category,
          date: transactionDate,
          type: transactionType,
          isRecurring: entry.category === 'given_expenses' ? true : entry.isRecurring,
          paySchedule,
          givenExpenseSchedule,
        });
      } else {
        // Multiple entries or new transactions
        for (const entry of validEntries) {
          const { transactionDate, paySchedule, givenExpenseSchedule } = processEntryData(entry);
          
          await addTransaction({
            name: entry.name.trim(),
            amount: parseFloat(entry.amount),
            category: entry.category,
            date: transactionDate,
            type: transactionType,
            isRecurring: entry.category === 'given_expenses' ? true : entry.isRecurring,
            paySchedule,
            givenExpenseSchedule,
          });
        }
      }
      
      // Close modal immediately after successful save
      onClose();
      
      // Show success message after modal is closed
      setTimeout(() => {
        const isMultiple = validEntries.length > 1;
        const typeText = transactionType === 'income' ? 'Income' : 'Expense';
        const actionText = editTransaction ? 'updated' : 'added';
        
        showAlert({
          title: 'Success!',
          message: isMultiple 
            ? `${validEntries.length} ${typeText.toLowerCase()} entries ${actionText} successfully!`
            : `${typeText} ${actionText} successfully!`,
          type: 'success',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
      }, 100);
      
    } catch (error) {
      console.error('Error saving transactions:', error);
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

  const processEntryData = (entry: TransactionEntry) => {
    let transactionDate: string;
    let paySchedule: PaySchedule | undefined;
    let givenExpenseSchedule: GivenExpenseSchedule | undefined;
    
    if (transactionType === 'income' && entry.isRecurring) {
      paySchedule = {
        cadence: entry.payCadence,
        lastPaidDate: entry.lastPaidDate.toISOString(),
        monthlyDays: entry.payCadence === 'twice_monthly' ? entry.monthlyDays : undefined,
        customDays: entry.payCadence === 'custom' ? entry.customDays : undefined,
      };
      transactionDate = entry.lastPaidDate.toISOString();
    } else if (transactionType === 'income' && !entry.isRecurring) {
      transactionDate = entry.lastPaidDate.toISOString();
    } else if (entry.category === 'given_expenses') {
      const today = new Date();
      givenExpenseSchedule = {
        frequency: entry.givenExpenseFrequency,
        startDate: new Date(today.getFullYear(), today.getMonth(), entry.selectedDay).toISOString(),
      };
      
      let expenseDate = new Date(today.getFullYear(), today.getMonth(), entry.selectedDay);
      if (expenseDate < today) {
        expenseDate = new Date(today.getFullYear(), today.getMonth() + 1, entry.selectedDay);
      }
      transactionDate = expenseDate.toISOString();
    } else {
      const today = new Date();
      let expenseDate = new Date(today.getFullYear(), today.getMonth(), entry.selectedDay);
      
      if (!entry.isRecurring && expenseDate < today) {
        expenseDate = new Date(today.getFullYear(), today.getMonth() + 1, entry.selectedDay);
      }
      
      transactionDate = expenseDate.toISOString();
    }

    return { transactionDate, paySchedule, givenExpenseSchedule };
  };
  
  const handleReset = () => {
    const hasData = entries.some(entry => entry.name.trim() || entry.amount.trim());
    
    // Reset to single empty entry
    setEntries([createEmptyEntry()]);
    
    if (hasData) {
      showAlert({
        title: 'Fields Cleared',
        message: 'All entries have been cleared',
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleClose = () => {
    const hasData = entries.some(entry => entry.name.trim() || entry.amount.trim());
    
    if (hasData) {
      const entryCount = entries.filter(entry => entry.name.trim() || entry.amount.trim()).length;
      const message = entryCount > 1 
        ? `Are you sure you want to discard ${entryCount} transaction entries?`
        : 'Are you sure you want to discard this transaction?';
        
      showAlert({
        title: 'Discard Changes',
        message,
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

  const renderPayScheduleInputs = (entry: TransactionEntry) => {
    if (entry.payCadence === 'twice_monthly') {
      return (
        <MonthlyDaysPicker
          selectedDays={entry.monthlyDays}
          onDaysChange={(days) => updateEntry(entry.id, { monthlyDays: days })}
          maxDays={2}
          label="Pay Days (Twice Monthly)"
        />
      );
    }
    
    if (entry.payCadence === 'custom') {
      return (
        <MonthlyDaysPicker
          selectedDays={entry.customDays}
          onDaysChange={(days) => updateEntry(entry.id, { customDays: days })}
          maxDays={10}
          label="Custom Pay Days"
        />
      );
    }
    
    return null;
  };

  const renderEntryForm = (entry: TransactionEntry, index: number) => {
    const isOnlyEntry = entries.length === 1;
    const canDelete = !isOnlyEntry && !editTransaction;
    
    return (
      <View key={entry.id} style={dynamicStyles.entryContainer}>
        {/* Entry Header */}
        <View style={dynamicStyles.entryHeader}>
          <TouchableOpacity
            style={dynamicStyles.entryHeaderLeft}
            onPress={() => toggleEntryCollapse(entry.id)}
            activeOpacity={0.7}
          >
            {entry.isCollapsed && (entry.name.trim() || entry.amount.trim()) ? (
              <View style={dynamicStyles.entrySummary}>
                <Text style={dynamicStyles.entrySummaryText}>
                  {entry.name.trim() || 'Unnamed'} – ${entry.amount || '0.00'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </View>
            ) : (
              <View style={dynamicStyles.entryTitle}>
                <Text style={dynamicStyles.entryTitleText}>
                  {isOnlyEntry ? `${transactionType === 'income' ? 'Income' : 'Expense'} Details` : `Entry ${index + 1}`}
                </Text>
                {!isOnlyEntry && <ChevronUp size={20} color={colors.textSecondary} />}
              </View>
            )}
          </TouchableOpacity>
          
          {canDelete && (
            <TouchableOpacity
              style={dynamicStyles.deleteButton}
              onPress={() => removeEntry(entry.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Entry Form - Show if not collapsed or if it's the only entry */}
        {(!entry.isCollapsed || isOnlyEntry) && (
          <View style={dynamicStyles.entryForm}>
            {/* Name Field */}
            <View style={dynamicStyles.formGroup}>
              <Text style={dynamicStyles.label}>
                {transactionType === 'income' ? 'Income Source' : 'Expense Name'} *
              </Text>
              <TextInput
                style={dynamicStyles.input}
                value={entry.name}
                onChangeText={(text) => updateEntry(entry.id, { name: text })}
                placeholder={transactionType === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Groceries, Netflix'}
                placeholderTextColor={colors.inactive}
                returnKeyType="next"
                autoCapitalize="words"
                maxLength={50}
              />
            </View>
            
            {/* Amount Field */}
            <View style={dynamicStyles.formGroup}>
              <Text style={dynamicStyles.label}>Amount *</Text>
              <View style={dynamicStyles.amountContainer}>
                <Text style={[dynamicStyles.currencySymbol, { color: colors.text }]}>$</Text>
                <TextInput
                  style={dynamicStyles.amountInput}
                  value={entry.amount}
                  onChangeText={(text) => updateEntry(entry.id, { amount: formatAmount(text) })}
                  placeholder="0.00"
                  placeholderTextColor={colors.inactive}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={10}
                />
              </View>
            </View>
            
            {/* Category Field for Expenses */}
            {transactionType === 'expense' && (
              <CategoryPicker
                selectedCategory={entry.category}
                onCategorySelect={(category) => updateEntry(entry.id, { category })}
                excludeCategories={['income']}
                label="Category *"
              />
            )}
            
            {/* Date/Schedule Selection */}
            {transactionType === 'income' ? (
              <View style={dynamicStyles.formGroup}>
                <DatePicker
                  selectedDate={entry.lastPaidDate}
                  onDateSelect={(date) => updateEntry(entry.id, { lastPaidDate: date })}
                  label="Most Recent Pay Date"
                  maximumDate={new Date()}
                  variant="income"
                />
                
                <PayCadencePicker
                  selectedCadence={entry.payCadence}
                  onCadenceSelect={(cadence) => updateEntry(entry.id, { payCadence: cadence })}
                />
                
                {renderPayScheduleInputs(entry)}
              </View>
            ) : (
              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.label}>Day of Month *</Text>
                <DayPicker
                  selectedDay={entry.selectedDay}
                  onDaySelect={(day) => updateEntry(entry.id, { selectedDay: day })}
                />
              </View>
            )}
            
            {/* Recurring Toggle for Expenses */}
            {transactionType === 'expense' && (
              <View style={dynamicStyles.switchContainer}>
                <View style={dynamicStyles.switchTextContainer}>
                  <Text style={dynamicStyles.switchLabel}>Recurring Expense</Text>
                  <Text style={dynamicStyles.switchSubtitle}>
                    {entry.category === 'given_expenses'
                      ? 'Given expenses are always recurring'
                      : (entry.isRecurring 
                          ? 'This expense repeats monthly (subscriptions, bills)' 
                          : 'One-time expense (purchases, dining out)')}
                  </Text>
                </View>
                <Switch
                  value={entry.isRecurring}
                  onValueChange={(value) => entry.category !== 'given_expenses' && updateEntry(entry.id, { isRecurring: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                  disabled={entry.category === 'given_expenses'}
                />
              </View>
            )}
            
            {/* Recurring Toggle for Income */}
            {transactionType === 'income' && (
              <View style={dynamicStyles.switchContainer}>
                <View style={dynamicStyles.switchTextContainer}>
                  <Text style={dynamicStyles.switchLabel}>Recurring Income</Text>
                  <Text style={dynamicStyles.switchSubtitle}>
                    {entry.isRecurring 
                      ? 'This income repeats based on your pay schedule' 
                      : 'One-time income (bonus, gift, freelance project)'}
                  </Text>
                </View>
                <Switch
                  value={entry.isRecurring}
                  onValueChange={(value) => updateEntry(entry.id, { isRecurring: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            )}
          </View>
        )}
      </View>
    );
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

    typeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    typeButtonTextActive: {
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
    entryContainer: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadow.light,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryHeaderLeft: {
      flex: 1,
    },
    entrySummary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    entrySummaryText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    entryTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    entryTitleText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    deleteButton: {
      width: Math.max(36, Spacing.minTouchTarget),
      height: Math.max(36, Spacing.minTouchTarget),
      borderRadius: BorderRadius.md,
      backgroundColor: colors.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.md,
    },
    entryForm: {
      padding: Spacing.lg,
      paddingTop: 0,
    },
    addEntryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardSecondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    addEntryText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: Spacing.sm,
    },
    entriesBadge: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      marginLeft: Spacing.sm,
    },
    entriesBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.card,
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={dynamicStyles.title}>
                  {editTransaction ? 'Edit Transaction' : 'Add Expense / Income'}
                </Text>
                {!editTransaction && entries.length > 1 && (
                  <View style={dynamicStyles.entriesBadge}>
                    <Text style={dynamicStyles.entriesBadgeText}>{entries.length}</Text>
                  </View>
                )}
              </View>
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
                    transactionType === 'income' && dynamicStyles.typeButtonActive
                  ]}
                  onPress={() => setTransactionType('income')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    dynamicStyles.typeButtonText,
                    transactionType === 'income' && dynamicStyles.typeButtonTextActive
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Form Fields */}
              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.label}>
                  {transactionType === 'income' ? 'Income Source' : 'Expense Name'} *
                </Text>
                <TextInput
                  style={dynamicStyles.input}
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
                <Text style={dynamicStyles.label}>
                  Amount *
                </Text>
                <View style={dynamicStyles.amountContainer}>
                  <Text style={[
                    dynamicStyles.currencySymbol,
                    { color: colors.text }
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
              ) : (
                <View style={dynamicStyles.formGroup}>
                  <Text style={dynamicStyles.label}>Day of Month *</Text>
                  <DayPicker
                    selectedDay={selectedDay}
                    onDaySelect={setSelectedDay}
                  />
                </View>
              )}
              
              {/* Recurring toggle - show for all expense types */}
              {transactionType === 'expense' && (
                <View style={dynamicStyles.switchContainer}>
                  <View style={dynamicStyles.switchTextContainer}>
                    <Text style={dynamicStyles.switchLabel}>
                      Recurring Expense
                    </Text>
                    <Text style={dynamicStyles.switchSubtitle}>
                      {category === 'given_expenses'
                        ? 'Given expenses are always recurring'
                        : (isRecurring 
                            ? 'This expense repeats monthly (subscriptions, bills)' 
                            : 'One-time expense (purchases, dining out)')
                      }
                    </Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={category === 'given_expenses' ? undefined : setIsRecurring}
                    trackColor={{ 
                      false: colors.border, 
                      true: colors.primary 
                    }}
                    thumbColor={colors.card}
                    disabled={category === 'given_expenses'}
                  />
                </View>
              )}
              

              
              {/* Show recurring toggle for income */}
              {transactionType === 'income' && (
                <View style={dynamicStyles.switchContainer}>
                  <View style={dynamicStyles.switchTextContainer}>
                    <Text style={dynamicStyles.switchLabel}>
                      Recurring Income
                    </Text>
                    <Text style={dynamicStyles.switchSubtitle}>
                      {isRecurring 
                        ? 'This income repeats based on your pay schedule' 
                        : 'One-time income (bonus, gift, freelance project)'}
                    </Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ 
                      false: colors.border, 
                      true: colors.primary 
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
                style={dynamicStyles.submitButton}
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

