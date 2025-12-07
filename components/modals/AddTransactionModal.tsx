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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Edit3, Trash2, Plus } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import CategoryPicker from '@/components/forms/CategoryPicker';
import DayPicker from '@/components/forms/DayPicker';
import DatePicker from '@/components/forms/DatePicker';
import WeekDayPicker from '@/components/forms/WeekDayPicker';
import PayCadencePicker from '@/components/forms/PayCadencePicker';
import MonthlyDaysPicker from '@/components/forms/MonthlyDaysPicker';
import GivenExpenseFrequencyPicker from '@/components/forms/GivenExpenseFrequencyPicker';
import { calculateNextGivenExpenseDate } from '@/utils/givenExpenseUtils';
import Button from '@/components/layout/Button';
import AlertModal from '@/components/modals/AlertModal';
import { useAlert } from '@/hooks/useAlert';
import { useThemeColors } from '@/constants/colors';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
} from '@/constants/spacing';
import {
  CategoryType,
  TransactionType,
  PayCadence,
  PaySchedule,
  Transaction,
  GivenExpenseFrequency,
  GivenExpenseSchedule,
} from '@/types/finance';

// Type for a draft expense entry
interface DraftExpense {
  id: string;
  name: string;
  amount: string;
  category: CategoryType;
  isRecurring: boolean;
  selectedDay: number;
  givenExpenseFrequency?: GivenExpenseFrequency;
  givenExpenseDayOfWeek?: number;
  givenExpenseStartDate?: Date;
}
import { calculateNextPayDate } from '@/utils/payScheduleUtils';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  editTransaction?: Transaction;
  initialTransactionType?: 'income' | 'expense';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AddTransactionModal({
  visible,
  onClose,
  editTransaction,
  initialTransactionType = 'expense',
}: AddTransactionModalProps) {
  const { addTransaction, updateTransaction } = useFinance();
  const { alertState, showAlert, hideAlert } = useAlert();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  const [transactionType, setTransactionType] = useState<TransactionType>(
    initialTransactionType
  );
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
  const [givenExpenseFrequency, setGivenExpenseFrequency] =
    useState<GivenExpenseFrequency>('every_week');
  const [givenExpenseDayOfWeek, setGivenExpenseDayOfWeek] = useState(
    new Date().getDay() // Default to today's day of week
  );
  // Keep startDate for backward compatibility and once_a_month frequency
  const [givenExpenseStartDate, setGivenExpenseStartDate] = useState(
    new Date()
  );

  const [isLoading, setIsLoading] = useState(false);

  // Multi-expense state
  const [draftExpenses, setDraftExpenses] = useState<DraftExpense[]>([]);
  const [currentExpenseIndex, setCurrentExpenseIndex] = useState<number | null>(
    null
  );

  // Reset form when modal opens or populate with edit data
  useEffect(() => {
    if (visible) {
      if (editTransaction) {
        // Populate form with existing transaction data
        setTransactionType(editTransaction.type);
        setName(editTransaction.name);
        setAmount(editTransaction.amount.toString());
        setCategory(editTransaction.category);
        // For one-time expenses, always set to not recurring
        if (editTransaction.category === 'one_time_expense') {
          setIsRecurring(false);
        } else if (editTransaction.type === 'income') {
          setIsRecurring(true); // Income is always recurring
        } else {
          setIsRecurring(editTransaction.isRecurring);
        }

        if (editTransaction.type === 'income' && editTransaction.paySchedule) {
          setLastPaidDate(new Date(editTransaction.paySchedule.lastPaidDate));
          setPayCadence(editTransaction.paySchedule.cadence);
          setMonthlyDays(editTransaction.paySchedule.monthlyDays || []);
          setCustomDays(editTransaction.paySchedule.customDays || []);
        } else if (
          editTransaction.category === 'given_expenses' &&
          editTransaction.givenExpenseSchedule
        ) {
          setGivenExpenseFrequency(
            editTransaction.givenExpenseSchedule.frequency
          );
          // Use dayOfWeek if available, otherwise extract from startDate for backward compatibility
          if (editTransaction.givenExpenseSchedule.dayOfWeek !== undefined) {
            setGivenExpenseDayOfWeek(editTransaction.givenExpenseSchedule.dayOfWeek);
          } else {
            // Extract day of week from startDate for backward compatibility
            const startDate = new Date(editTransaction.givenExpenseSchedule.startDate);
            setGivenExpenseDayOfWeek(startDate.getDay());
          }
          setGivenExpenseStartDate(
            new Date(editTransaction.givenExpenseSchedule.startDate)
          );
        } else {
          const transactionDate = new Date(editTransaction.date);
          setSelectedDay(transactionDate.getDate());
        }
      } else {
        // Reset form for new transaction
        setTransactionType(initialTransactionType);
        setName('');
        setAmount('');
        setSelectedDay(new Date().getDate());
        setLastPaidDate(new Date());
        setPayCadence('every_2_weeks');
        // Default to recurring for income, not recurring for expenses
        setIsRecurring(initialTransactionType === 'income');
        setMonthlyDays([]);
        setCustomDays([]);
        setGivenExpenseFrequency('every_week');
        const today = new Date();
        setGivenExpenseDayOfWeek(today.getDay());
        setGivenExpenseStartDate(today);
      }
      setIsLoading(false);
    }
  }, [visible, editTransaction, initialTransactionType]);

  useEffect(() => {
    if (transactionType === 'income') {
      setCategory('income');
      setIsRecurring(true); // Income is always recurring
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
    } else if (category === 'one_time_expense') {
      setIsRecurring(false); // One-time expenses are never recurring
    } else if (transactionType === 'income') {
      setIsRecurring(true); // Income is always recurring
    }
  }, [category, transactionType]);

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
        // Calculate the next occurrence date based on frequency and day of week
        const tempSchedule: GivenExpenseSchedule = {
          frequency: givenExpenseFrequency,
          dayOfWeek: givenExpenseDayOfWeek,
          startDate: givenExpenseStartDate.toISOString(), // Keep for backward compatibility
        };
        
        // Calculate the actual next occurrence date
        const nextDate = calculateNextGivenExpenseDate(tempSchedule);
        
        // For once_a_month, use the day of month from startDate
        if (givenExpenseFrequency === 'once_a_month') {
          const startDate = new Date(givenExpenseStartDate);
          const dayOfMonth = startDate.getDate();
          const today = new Date();
          let expenseDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
          
          // If the date has passed this month, go to next month
          if (expenseDate <= today) {
            expenseDate.setMonth(expenseDate.getMonth() + 1);
            // Handle edge case where day doesn't exist in next month
            if (expenseDate.getDate() !== dayOfMonth) {
              expenseDate.setDate(0); // Move to last day of previous month
            }
          }
          transactionDate = expenseDate.toISOString();
        } else {
          // For weekly/bi-weekly, use the calculated next date
          transactionDate = nextDate.toISOString();
        }
        
        givenExpenseSchedule = tempSchedule;
      } else {
        // Use day of month for regular expenses - resolve to appropriate date
        const today = new Date();
        let expenseDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          selectedDay
        );

        // For savings category: always use current month regardless of whether day has passed
        // For other categories with recurring: create monthly pay schedule
        if (category === 'savings') {
          // Always use current month for savings
          expenseDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            selectedDay
          );
          
          // If recurring, create a monthly pay schedule
          if (isRecurring) {
            paySchedule = {
              cadence: 'monthly',
              lastPaidDate: expenseDate.toISOString(),
            };
          }
        } else if (isRecurring) {
          // For other recurring expenses, use the selected day in the current month
          // Create a monthly pay schedule
          expenseDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            selectedDay
          );
          paySchedule = {
            cadence: 'monthly',
            lastPaidDate: expenseDate.toISOString(),
          };
        } else {
          // For non-recurring expenses, try to place them in the most logical date
          // If the date is in the past for this month, try next month
          if (expenseDate < today) {
            const nextMonthDate = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              selectedDay
            );
            expenseDate = nextMonthDate;
          }
        }

        transactionDate = expenseDate.toISOString();
      }

      if (editTransaction) {
        try {
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
        } catch (updateError) {
          console.error('Error updating transaction:', updateError);
          const errorMessage =
            updateError instanceof Error
              ? updateError.message
              : 'Unknown error';
          throw new Error(`Failed to update transaction: ${errorMessage}`);
        }
      } else {
        try {
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
        } catch (addError) {
          console.error('Error adding transaction:', addError);
          const errorMessage =
            addError instanceof Error ? addError.message : 'Unknown error';
          throw new Error(`Failed to add transaction: ${errorMessage}`);
        }
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
      console.error('Error saving transaction:', error);
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
    const hasData = name.trim() || amount.trim() || draftExpenses.length > 0;

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

    // Reset draft expenses
    setDraftExpenses([]);
    setCurrentExpenseIndex(null);

    if (hasData) {
      showAlert({
        title: 'Fields Cleared',
        message: 'All fields and added expenses have been cleared',
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const handleClose = () => {
    resetModalState();

    // Always close immediately - Cancel should be immediate
    onClose();
  };

  const handleXButtonClose = () => {
    try {
      // For editing, always allow immediate close without confirmation
      if (editTransaction) {
        onClose();
        return;
      }

      // For new transactions, show confirmation if there are changes
      if (name.trim() || amount.trim() || draftExpenses.length > 0) {
        showAlert({
          title: 'Discard Changes',
          message:
            'Are you sure you want to discard this transaction and any added expenses?',
          type: 'warning',
          actions: [
            { text: 'Keep Editing', onPress: () => {}, style: 'cancel' },
            {
              text: 'Discard',
              onPress: () => {
                resetModalState();
                onClose();
              },
              style: 'destructive',
            },
          ],
        });
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error in handleXButtonClose:', error);
      onClose(); // Always close even if there's an error
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

  // Helper functions for multi-expense management
  const addNewExpense = () => {
    const newExpense: DraftExpense = {
      id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      amount: '',
      category: 'one_time_expense',
      isRecurring: false,
      selectedDay: new Date().getDate(),
      givenExpenseFrequency: 'every_week',
      givenExpenseStartDate: new Date(),
    };

    setDraftExpenses(prev => [...prev, newExpense]);
    setCurrentExpenseIndex(null); // Reset to null since we're adding a new one

    // Reset current form
    setName('');
    setAmount('');
    setCategory('one_time_expense');
    setIsRecurring(false);
    setSelectedDay(new Date().getDate());
    setGivenExpenseFrequency('every_week');
    setGivenExpenseStartDate(new Date());
  };

  const saveCurrentExpense = () => {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      return false;
    }

    const currentExpense: DraftExpense = {
      id:
        currentExpenseIndex !== null
          ? draftExpenses[currentExpenseIndex].id
          : `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      amount,
      category,
      isRecurring,
      selectedDay,
      givenExpenseFrequency:
        category === 'given_expenses' ? givenExpenseFrequency : undefined,
      givenExpenseStartDate:
        category === 'given_expenses' ? givenExpenseStartDate : undefined,
    };

    if (currentExpenseIndex !== null) {
      // Update existing expense
      setDraftExpenses(prev =>
        prev.map((expense, index) =>
          index === currentExpenseIndex ? currentExpense : expense
        )
      );
      setCurrentExpenseIndex(null); // Clear the edit mode
    } else {
      // Add new expense
      setDraftExpenses(prev => [...prev, currentExpense]);
    }

    return true;
  };

  const editExpense = (index: number) => {
    const expense = draftExpenses[index];
    setCurrentExpenseIndex(index);

    // Populate form with expense data
    setName(expense.name);
    setAmount(expense.amount);
    setCategory(expense.category);
    setIsRecurring(expense.isRecurring);
    setSelectedDay(expense.selectedDay);
    if (expense.givenExpenseFrequency) {
      setGivenExpenseFrequency(expense.givenExpenseFrequency);
    }
    if (expense.givenExpenseStartDate) {
      setGivenExpenseStartDate(expense.givenExpenseStartDate);
    }
  };

  const deleteExpense = (index: number) => {
    setDraftExpenses(prev => prev.filter((_, i) => i !== index));
    if (currentExpenseIndex === index) {
      setCurrentExpenseIndex(null);
      // Reset form
      setName('');
      setAmount('');
      setCategory('one_time_expense');
      setIsRecurring(false);
      setSelectedDay(new Date().getDate());
    } else if (currentExpenseIndex !== null && currentExpenseIndex > index) {
      setCurrentExpenseIndex(currentExpenseIndex - 1);
    }
  };

  // Helper functions for improved UX
  const isExpenseValid = (expense: DraftExpense) => {
    return (
      expense.name.trim() && expense.amount && parseFloat(expense.amount) > 0
    );
  };

  const isCurrentFormValid = () => {
    return name.trim() && amount && parseFloat(amount) > 0;
  };

  const getTotalExpenseCount = () => {
    const draftCount = draftExpenses.filter(isExpenseValid).length;
    const currentFormCount = isCurrentFormValid() ? 1 : 0;
    return draftCount + currentFormCount;
  };

  const resetModalState = () => {
    try {
      setName('');
      setAmount('');
      setCategory('one_time_expense');
      setIsRecurring(false);
      setSelectedDay(new Date().getDate());
      setGivenExpenseFrequency('every_week');
      setGivenExpenseStartDate(new Date());
      setDraftExpenses([]);
      setCurrentExpenseIndex(null);
    } catch (error) {
      console.error('Error resetting modal state:', error);
    }
  };

  const getExpenseCardStyle = (expense: DraftExpense) => {
    const baseStyle = dynamicStyles.multiExpenseCard;
    if (!isExpenseValid(expense)) {
      return [baseStyle, dynamicStyles.expenseCardWarning];
    }
    return baseStyle;
  };

  const handleSaveAllExpenses = async () => {
    // Create a list of all expenses to save (draft expenses + current form if valid)
    const allExpensesToSave = [...draftExpenses.filter(isExpenseValid)];

    // If current form is valid, add it to the list
    if (isCurrentFormValid()) {
      const currentExpense: DraftExpense = {
        id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        amount,
        category,
        isRecurring,
        selectedDay,
        givenExpenseFrequency:
          category === 'given_expenses' ? givenExpenseFrequency : undefined,
        givenExpenseStartDate:
          category === 'given_expenses' ? givenExpenseStartDate : undefined,
      };
      allExpensesToSave.push(currentExpense);
    }

    // Check if we have any expenses to save
    if (allExpensesToSave.length === 0) {
      showAlert({
        title: 'No Expenses to Save',
        message: 'Please add at least one complete expense before saving',
        type: 'warning',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    // Validate all expenses before saving
    const invalidExpenses = allExpensesToSave.filter(
      expense =>
        !expense.name.trim() ||
        !expense.amount ||
        parseFloat(expense.amount) <= 0
    );

    if (invalidExpenses.length > 0) {
      showAlert({
        title: 'Incomplete Expenses',
        message: `Please complete all expense entries. ${invalidExpenses.length} expense${invalidExpenses.length > 1 ? 's' : ''} ${invalidExpenses.length > 1 ? 'are' : 'is'} incomplete.`,
        type: 'warning',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }

    setIsLoading(true);

    try {
      let savedCount = 0;

      // Save all expenses individually
      for (let i = 0; i < allExpensesToSave.length; i++) {
        const expense = allExpensesToSave[i];

        const numAmount = parseFloat(expense.amount);
        let transactionDate: string;
        let paySchedule: PaySchedule | undefined;
        let givenExpenseSchedule: GivenExpenseSchedule | undefined;

        if (expense.category === 'given_expenses') {
          // Handle given expenses with frequency schedule
          givenExpenseSchedule = {
            frequency: expense.givenExpenseFrequency!,
            startDate: expense.givenExpenseStartDate!.toISOString(),
          };
          transactionDate = expense.givenExpenseStartDate!.toISOString();
        } else {
          // Use day of month for regular expenses - resolve to appropriate date
          const today = new Date();
          let expenseDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            expense.selectedDay
          );

          // For non-recurring expenses, try to place them in the most logical date
          if (!expense.isRecurring) {
            // If the date is in the past for this month, try next month
            if (expenseDate < today) {
              const nextMonthDate = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                expense.selectedDay
              );
              expenseDate = nextMonthDate;
            }
          } else {
            // For recurring expenses, use the selected day in the current month
            // The pay period logic will handle the proper scheduling
            expenseDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              expense.selectedDay
            );
          }

          transactionDate = expenseDate.toISOString();
        }

        try {
          await addTransaction({
            name: expense.name.trim(),
            amount: numAmount,
            category: expense.category,
            date: transactionDate,
            type: 'expense',
            isRecurring:
              expense.category === 'given_expenses'
                ? true
                : expense.isRecurring,
            paySchedule,
            givenExpenseSchedule,
          });

          savedCount++;
        } catch (addError) {
          console.error(`Error adding expense ${i + 1}:`, addError);
          const errorMessage =
            addError instanceof Error ? addError.message : 'Unknown error';
          throw new Error(
            `Failed to add expense "${expense.name}": ${errorMessage}`
          );
        }
      }

      // Check if all expenses were saved successfully
      if (savedCount !== allExpensesToSave.length) {
        showAlert({
          title: 'Partial Save',
          message: `Only ${savedCount} of ${allExpensesToSave.length} expenses were saved successfully. Please try again.`,
          type: 'warning',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
        return;
      }

      // Reset form and draft expenses
      resetModalState();

      // Close modal and show success message
      onClose();
      setTimeout(() => {
        showAlert({
          title: 'Success!',
          message: `${savedCount} expense${savedCount > 1 ? 's' : ''} added successfully! All expenses have been saved and will appear in both Budget and Overview tabs based on their dates and categories.`,
          type: 'success',
          actions: [{ text: 'OK', onPress: () => {} }],
        });
      }, 100);
    } catch (error) {
      console.error('Error saving expenses:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      showAlert({
        title: 'Error',
        message: `Failed to save expenses: ${errorMessage}`,
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPayScheduleInputs = () => {
    if (payCadence === 'twice_monthly') {
      return (
        <MonthlyDaysPicker
          selectedDays={monthlyDays}
          onDaysChange={setMonthlyDays}
          maxDays={2}
          label='Pay Days (Twice Monthly)'
        />
      );
    }

    if (payCadence === 'custom') {
      return (
        <MonthlyDaysPicker
          selectedDays={customDays}
          onDaysChange={setCustomDays}
          maxDays={10}
          label='Custom Pay Days'
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
      width: Math.max(40, SpacingValues.minTouchTarget),
      height: Math.max(40, SpacingValues.minTouchTarget),
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
      borderRadius: BorderRadius.modern,
      padding: 4,
      marginVertical: Spacing.lg,
      gap: 8,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderRadius: BorderRadius.modern,
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
      padding: 20, // ENFORCED: 20px padding
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12, // ENFORCED: 12pt spacing between buttons
      backgroundColor: colors.background,
    },
    resetButton: {
      flex: 1, // Responsive sizing - takes available space
      minWidth: 0, // Allow shrinking below content size
    },
    cancelButton: {
      flex: 1, // Responsive sizing - takes available space
      minWidth: 0, // Allow shrinking below content size
    },
    submitButton: {
      flex: 2, // Primary button gets more space
      minWidth: 0, // Allow shrinking below content size
    },
    multiExpenseCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadow.light,
    },
    expenseCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    expenseCardTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    expenseCardSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    expenseCardActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    expenseCardAction: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addExpenseButtonContainer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: Spacing.md,
    },
    addExpenseButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      ...Shadow.light,
    },
    addExpenseButtonText: {
      color: colors.card,
      fontSize: 16,
      fontWeight: '600',
    },
    addExpenseButtonTextDisabled: {
      color: colors.textSecondary,
    },
    addExpenseButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },

    savedExpensesSection: {
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    savedExpensesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    expenseCardWarning: {
      borderLeftWidth: 3,
      borderLeftColor: colors.error,
      backgroundColor: colors.cardSecondary,
    },
    expenseCardWarningText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
    expenseCardAnimated: {
      transform: [{ scale: 1 }],
      opacity: 1,
      marginBottom: Spacing.sm,
    },
  });

  return (
    <>
      <Modal
        visible={visible}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={handleClose}
        transparent={false}
        statusBarTranslucent={false}
        animationDuration={200}
      >
        <SafeAreaView style={dynamicStyles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={dynamicStyles.container}
          >
            {/* Header */}
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.title}>
                {editTransaction ? 'Edit Transaction' : 'Add Expense / Income'}
              </Text>
              <TouchableOpacity
                onPress={handleXButtonClose}
                style={dynamicStyles.closeButton}
                activeOpacity={0.7}
                testID='close-modal-button'
                accessibilityLabel='Close modal'
              >
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={dynamicStyles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
              contentContainerStyle={dynamicStyles.scrollContent}
            >
              {/* Transaction Type Toggle */}
              <View style={dynamicStyles.typeToggle}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.typeButton,
                    transactionType === 'expense' &&
                      dynamicStyles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('expense')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      dynamicStyles.typeButtonText,
                      transactionType === 'expense' &&
                        dynamicStyles.typeButtonTextActive,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    dynamicStyles.typeButton,
                    transactionType === 'income' &&
                      dynamicStyles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('income')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      dynamicStyles.typeButtonText,
                      transactionType === 'income' &&
                        dynamicStyles.typeButtonTextActive,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.label}>
                  {transactionType === 'income'
                    ? 'Income Source'
                    : 'Expense Name'}{' '}
                  *
                </Text>
                <TextInput
                  style={dynamicStyles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={
                    transactionType === 'income'
                      ? 'e.g., Salary, Freelance'
                      : 'e.g., Groceries, Netflix'
                  }
                  placeholderTextColor={colors.inactive}
                  returnKeyType='next'
                  autoCapitalize='words'
                  maxLength={50}
                />
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.label}>Amount *</Text>
                <View style={dynamicStyles.amountContainer}>
                  <Text
                    style={[
                      dynamicStyles.currencySymbol,
                      { color: colors.text },
                    ]}
                  >
                    $
                  </Text>
                  <TextInput
                    style={dynamicStyles.amountInput}
                    value={amount}
                    onChangeText={text => setAmount(formatAmount(text))}
                    placeholder='0.00'
                    placeholderTextColor={colors.inactive}
                    keyboardType='decimal-pad'
                    returnKeyType='done'
                    maxLength={10}
                  />
                </View>
              </View>

              {transactionType === 'expense' && (
                <CategoryPicker
                  selectedCategory={category}
                  onCategorySelect={setCategory}
                  excludeCategories={['income']}
                  label='Category *'
                />
              )}

              {/* Date/Schedule Selection */}
              {transactionType === 'income' ? (
                <View style={dynamicStyles.formGroup}>
                  <DatePicker
                    selectedDate={lastPaidDate}
                    onDateSelect={setLastPaidDate}
                    label='Most Recent Pay Date'
                    maximumDate={new Date()}
                    variant='income'
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
                    label='Apply to *'
                  />

                  {givenExpenseFrequency === 'once_a_month' ? (
                    <DatePicker
                      selectedDate={givenExpenseStartDate}
                      onDateSelect={(date) => {
                        setGivenExpenseStartDate(date);
                        setGivenExpenseDayOfWeek(date.getDay());
                      }}
                      label='Date *'
                      minimumDate={new Date()}
                      variant='default'
                    />
                  ) : (
                    <WeekDayPicker
                      selectedDay={givenExpenseDayOfWeek}
                      onDaySelect={(day) => {
                        setGivenExpenseDayOfWeek(day);
                        // Update startDate to next occurrence of selected day for reference
                        const today = new Date();
                        const currentDayOfWeek = today.getDay();
                        let daysUntilNext = day - currentDayOfWeek;
                        if (daysUntilNext <= 0) {
                          daysUntilNext += 7;
                        }
                        const nextDate = new Date(today);
                        nextDate.setDate(today.getDate() + daysUntilNext);
                        setGivenExpenseStartDate(nextDate);
                      }}
                      label='Start Day *'
                    />
                  )}
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

              {/* Only show recurring toggle for non-given expenses, non-one-time expenses, and non-income */}
              {category !== 'given_expenses' &&
                category !== 'one_time_expense' &&
                transactionType !== 'income' && (
                  <View style={dynamicStyles.switchContainer}>
                    <View style={dynamicStyles.switchTextContainer}>
                      <Text style={dynamicStyles.switchLabel}>
                        Recurring Expense
                      </Text>
                      <Text style={dynamicStyles.switchSubtitle}>
                        {isRecurring
                          ? 'This expense repeats monthly (subscriptions, bills)'
                          : 'One-time expense (purchases, dining out)'}
                      </Text>
                    </View>
                    <Switch
                      value={isRecurring}
                      onValueChange={setIsRecurring}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={colors.card}
                    />
                  </View>
                )}

              {/* Add Expense Button (Inline Multi-Expense) */}
              {transactionType === 'expense' && !editTransaction && (
                <View style={dynamicStyles.addExpenseButtonContainer}>
                  <TouchableOpacity
                    style={[
                      dynamicStyles.addExpenseButton,
                      !isCurrentFormValid() &&
                        dynamicStyles.addExpenseButtonDisabled,
                    ]}
                    onPress={() => {
                      // Validate all required fields before adding
                      if (!isCurrentFormValid()) {
                        showAlert({
                          title: 'Incomplete Form',
                          message:
                            'Please fill in all required fields before adding another expense',
                          type: 'warning',
                          actions: [{ text: 'OK', onPress: () => {} }],
                        });
                        return;
                      }

                      // Save current expense and add new one
                      const saved = saveCurrentExpense();
                      if (saved) {
                        addNewExpense();
                        // Show success feedback
                        showAlert({
                          title: 'Expense Added',
                          message:
                            'Expense added to list. Continue adding or save all expenses.',
                          type: 'success',
                          actions: [{ text: 'OK', onPress: () => {} }],
                        });
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={!isCurrentFormValid()}
                  >
                    <Text
                      style={[
                        dynamicStyles.addExpenseButtonText,
                        !isCurrentFormValid() &&
                          dynamicStyles.addExpenseButtonTextDisabled,
                      ]}
                    >
                      Add Expense
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Inline Multi-Expense Flow */}
              {transactionType === 'expense' &&
                !editTransaction &&
                draftExpenses.filter(isExpenseValid).length > 0 && (
                  <View style={dynamicStyles.savedExpensesSection}>
                    <Text style={dynamicStyles.savedExpensesTitle}>
                      Added Expenses (
                      {draftExpenses.filter(isExpenseValid).length})
                    </Text>
                    {draftExpenses
                      .filter(isExpenseValid)
                      .map((expense, index) => {
                        const originalIndex = draftExpenses.findIndex(
                          e => e.id === expense.id
                        );
                        return (
                          <View
                            key={expense.id}
                            style={[
                              getExpenseCardStyle(expense),
                              dynamicStyles.expenseCardAnimated,
                            ]}
                          >
                            <View style={dynamicStyles.expenseCardHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={dynamicStyles.expenseCardTitle}>
                                  {expense.name || 'Unnamed Expense'}
                                </Text>
                                <Text style={dynamicStyles.expenseCardSubtitle}>
                                  ${expense.amount || '0.00'} •{' '}
                                  {expense.category.replace('_', ' ')}
                                </Text>
                              </View>
                              <View style={dynamicStyles.expenseCardActions}>
                                <TouchableOpacity
                                  style={dynamicStyles.expenseCardAction}
                                  onPress={() => editExpense(originalIndex)}
                                  activeOpacity={0.7}
                                >
                                  <Edit3
                                    size={16}
                                    color={colors.textSecondary}
                                    strokeWidth={2}
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={dynamicStyles.expenseCardAction}
                                  onPress={() => deleteExpense(originalIndex)}
                                  activeOpacity={0.7}
                                >
                                  <Trash2
                                    size={16}
                                    color={colors.error}
                                    strokeWidth={2}
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                  </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={dynamicStyles.footer}>
              <Button
                title='Reset'
                onPress={handleReset}
                variant='ghost'
                size='medium'
                disabled={false}
                style={dynamicStyles.resetButton}
              />
              <Button
                title='Cancel'
                onPress={handleClose}
                variant='outline'
                size='medium'
                disabled={false}
                style={dynamicStyles.cancelButton}
                testID='cancel-transaction-button'
                accessibilityLabel='Cancel transaction'
              />
              {transactionType === 'expense' &&
              !editTransaction &&
              getTotalExpenseCount() > 0 ? (
                <Button
                  title={`Save All Expenses (${getTotalExpenseCount()})`}
                  onPress={handleSaveAllExpenses}
                  variant='primary'
                  size='medium'
                  loading={isLoading}
                  disabled={false}
                  style={dynamicStyles.submitButton}
                  testID='save-all-expenses-button'
                  accessibilityLabel='Save all expenses'
                />
              ) : (
                <Button
                  title={`Save ${transactionType === 'income' ? 'Income' : 'Expense'}`}
                  onPress={handleSubmit}
                  variant='primary'
                  size='medium'
                  loading={isLoading}
                  disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
                  style={dynamicStyles.submitButton}
                  testID='save-transaction-button'
                  accessibilityLabel={`Save ${transactionType === 'income' ? 'Income' : 'Expense'}`}
                />
              )}
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
