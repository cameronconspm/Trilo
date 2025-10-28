import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Typography } from '@/constants/spacing';
import {
  CategoryType,
  TransactionType,
  PayCadence,
  GivenExpenseFrequency,
} from '@/types/finance';
import CategoryPicker from './CategoryPicker';
import DayPicker from './DayPicker';
import DatePicker from './DatePicker';
import PayCadencePicker from './PayCadencePicker';
import MonthlyDaysPicker from './MonthlyDaysPicker';
import GivenExpenseFrequencyPicker from './GivenExpenseFrequencyPicker';
import { Transaction } from '@/types/finance';

interface TransactionFormProps {
  transactionType: TransactionType;
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
  givenExpenseStartDate: Date;
  onNameChange: (name: string) => void;
  onAmountChange: (amount: string) => void;
  onCategoryChange: (category: CategoryType) => void;
  onRecurringChange: (isRecurring: boolean) => void;
  onSelectedDayChange: (day: number) => void;
  onLastPaidDateChange: (date: Date) => void;
  onPayCadenceChange: (cadence: PayCadence) => void;
  onMonthlyDaysChange: (days: number[]) => void;
  onCustomDaysChange: (days: number[]) => void;
  onGivenExpenseFrequencyChange: (frequency: GivenExpenseFrequency) => void;
  onGivenExpenseStartDateChange: (date: Date) => void;
  editTransaction?: Transaction;
}

export default function TransactionForm({
  transactionType,
  name,
  amount,
  category,
  isRecurring,
  selectedDay,
  lastPaidDate,
  payCadence,
  monthlyDays,
  customDays,
  givenExpenseFrequency,
  givenExpenseStartDate,
  onNameChange,
  onAmountChange,
  onCategoryChange,
  onRecurringChange,
  onSelectedDayChange,
  onLastPaidDateChange,
  onPayCadenceChange,
  onMonthlyDaysChange,
  onCustomDaysChange,
  onGivenExpenseFrequencyChange,
  onGivenExpenseStartDateChange,
  editTransaction,
}: TransactionFormProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

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
          onDaysChange={onMonthlyDaysChange}
          maxDays={2}
          label='Pay Days (Twice Monthly)'
        />
      );
    }

    if (payCadence === 'custom') {
      return (
        <MonthlyDaysPicker
          selectedDays={customDays}
          onDaysChange={onCustomDaysChange}
          maxDays={10}
          label='Custom Pay Days'
        />
      );
    }

    return null;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Transaction Type Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Transaction Type
          </Text>
          <View
            style={[
              styles.typeToggle,
              { backgroundColor: colors.cardSecondary },
            ]}
          >
            <View
              style={[
                styles.typeOption,
                transactionType === 'expense' && [
                  styles.typeOptionActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: colors.text },
                  transactionType === 'expense' && [
                    styles.typeOptionTextActive,
                    { color: colors.card },
                  ],
                ]}
              >
                Expense
              </Text>
            </View>
            <View
              style={[
                styles.typeOption,
                transactionType === 'income' && [
                  styles.typeOptionActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  { color: colors.text },
                  transactionType === 'income' && [
                    styles.typeOptionTextActive,
                    { color: colors.card },
                  ],
                ]}
              >
                Income
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Basic Information
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.cardSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={name}
              onChangeText={onNameChange}
              placeholder='Enter transaction name'
              placeholderTextColor={colors.textSecondary}
              autoCapitalize='words'
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Amount
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.cardSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={amount}
              onChangeText={text => onAmountChange(formatAmount(text))}
              placeholder='0.00'
              placeholderTextColor={colors.textSecondary}
              keyboardType='decimal-pad'
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Category
            </Text>
            <CategoryPicker
              selectedCategory={category}
              onCategorySelect={onCategoryChange}
            />
          </View>
        </View>

        {/* Recurring Toggle */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Recurring
            </Text>
            <Switch
              value={isRecurring}
              onValueChange={onRecurringChange}
              trackColor={{ false: colors.inactive, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        {/* Conditional Fields */}
        {transactionType === 'expense' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Expense Details
            </Text>

            {category === 'given_expenses' ? (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Frequency
                  </Text>
                  <GivenExpenseFrequencyPicker
                    selectedFrequency={givenExpenseFrequency}
                    onFrequencySelect={onGivenExpenseFrequencyChange}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Start Date
                  </Text>
                  <DatePicker
                    selectedDate={givenExpenseStartDate}
                    onDateSelect={onGivenExpenseStartDateChange}
                    label='Start Date'
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Day of Month
                </Text>
                <DayPicker
                  selectedDay={selectedDay}
                  onDaySelect={onSelectedDayChange}
                />
              </View>
            )}
          </View>
        )}

        {transactionType === 'income' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Income Details
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Last Paid Date
              </Text>
              <DatePicker
                selectedDate={lastPaidDate}
                onDateSelect={onLastPaidDateChange}
                label='Last Paid Date'
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Pay Cadence
              </Text>
              <PayCadencePicker
                selectedCadence={payCadence}
                onCadenceSelect={onPayCadenceChange}
              />
            </View>

            {renderPayScheduleInputs()}
          </View>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.modern,
    padding: 2,
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.modern,
    alignItems: 'center',
  },
  typeOptionActive: {
    // backgroundColor will be set dynamically
  },
  typeOptionText: {
    ...Typography.bodyMedium,
    fontWeight: '500',
  },
  typeOptionTextActive: {
    fontWeight: '600',
  },
});
