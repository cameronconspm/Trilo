import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';
import { Transaction, PaySchedule, PayCadence } from '@/types/finance';
import { generateCalendarGrid } from '@/utils/dateUtils';

interface CalendarProps {
  onDatePress?: (date: Date) => void;
}

export default function Calendar({ onDatePress }: CalendarProps) {
  const { transactions } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month's data
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar grid for current month
  const calendarGrid = useMemo(() => {
    // Hardcode week start to Sunday (0) since week start functionality is removed
    const weekStartNumeric = 0;
    return generateCalendarGrid(currentYear, currentMonth, weekStartNumeric);
  }, [currentYear, currentMonth]);

  // Get day headers based on week start configuration
  const dayHeaders = useMemo(() => {
    // Hardcode to Sunday start since week start functionality is removed
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  }, []);

  // Get all expenses for a specific date (including recurring)
  const getExpensesForDate = (date: Date): Transaction[] => {
    const expenses: Transaction[] = [];

    transactions.forEach(transaction => {
      if (transaction.type !== 'expense') return;

      const transactionDate = new Date(transaction.date);

      // Check if this is a one-time expense on this exact date
      if (
        transactionDate.getDate() === date.getDate() &&
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      ) {
        expenses.push(transaction);
        return;
      }

      // Check if this is a recurring expense that should appear on this date
      if (
        transaction.isRecurring &&
        transaction.category !== 'given_expenses'
      ) {
        const dayOfMonth = transactionDate.getDate();
        if (dayOfMonth === date.getDate()) {
          expenses.push(transaction);
        }
      }
    });

    return expenses;
  };

  // Get all income occurrences for a specific date (including recurring)
  const getIncomeForDate = (date: Date): Transaction[] => {
    const income: Transaction[] = [];

    transactions.forEach(transaction => {
      if (transaction.type !== 'income') return;

      const transactionDate = new Date(transaction.date);

      // Check if this is a one-time income on this exact date
      if (
        transactionDate.getDate() === date.getDate() &&
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      ) {
        income.push(transaction);
        return;
      }

      // Check if this is recurring income that should appear on this date
      if (transaction.isRecurring && transaction.paySchedule) {
        const paySchedule = transaction.paySchedule;

        // Weekly income
        if (paySchedule.cadence === 'weekly') {
          const lastPaidDate = new Date(paySchedule.lastPaidDate);
          const daysSinceLastPaid = Math.floor(
            (date.getTime() - lastPaidDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastPaid >= 0 && daysSinceLastPaid % 7 === 0) {
            income.push(transaction);
          }
        }

        // Every 2 weeks income
        else if (paySchedule.cadence === 'every_2_weeks') {
          const lastPaidDate = new Date(paySchedule.lastPaidDate);
          const daysSinceLastPaid = Math.floor(
            (date.getTime() - lastPaidDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastPaid >= 0 && daysSinceLastPaid % 14 === 0) {
            income.push(transaction);
          }
        }

        // Twice a month income
        else if (
          paySchedule.cadence === 'twice_monthly' &&
          paySchedule.monthlyDays
        ) {
          if (paySchedule.monthlyDays.includes(date.getDate())) {
            income.push(transaction);
          }
        }

        // Monthly income
        else if (paySchedule.cadence === 'monthly') {
          const lastPaidDate = new Date(paySchedule.lastPaidDate);
          if (date.getDate() === lastPaidDate.getDate()) {
            income.push(transaction);
          }
        }

        // Custom income
        else if (paySchedule.cadence === 'custom' && paySchedule.customDays) {
          if (paySchedule.customDays.includes(date.getDate())) {
            income.push(transaction);
          }
        }
      }
    });

    return income;
  };

  // Navigation functions with proper year boundary handling
  const goToPreviousMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(newDate);
    
    // Handle selection when switching months
    if (selectedDate) {
      const newMonth = newDate.getMonth();
      const newYear = newDate.getFullYear();
      
      // If selected date is in the new month, keep it; otherwise clear selection
      if (selectedDate.getMonth() === newMonth && selectedDate.getFullYear() === newYear) {
        // Keep selection if it's still valid
      } else {
        setSelectedDate(null);
      }
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(newDate);
    
    // Handle selection when switching months
    if (selectedDate) {
      const newMonth = newDate.getMonth();
      const newYear = newDate.getFullYear();
      
      // If selected date is in the new month, keep it; otherwise clear selection
      if (selectedDate.getMonth() === newMonth && selectedDate.getFullYear() === newYear) {
        // Keep selection if it's still valid
      } else {
        setSelectedDate(null);
      }
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(null);
  };

  // Format month/year
  const monthYearText = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Check if date is payday (has income)
  const isPayday = (date: Date) => {
    const incomeForDate = getIncomeForDate(date);
    return incomeForDate.length > 0;
  };

  const handleDatePress = (date: Date) => {
    // Only allow selection of current month dates
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      setSelectedDate(date);
      if (onDatePress) {
        onDatePress(date);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.cardSecondary }]}
          onPress={goToPreviousMonth}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.monthButton,
            { backgroundColor: colors.cardSecondary },
          ]}
          onPress={goToCurrentMonth}
          activeOpacity={0.7}
        >
          <CalendarIcon
            size={16}
            color={colors.textSecondary}
            strokeWidth={2}
          />
          <Text style={[styles.monthText, { color: colors.text }]}>
            {monthYearText}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.cardSecondary }]}
          onPress={goToNextMonth}
          activeOpacity={0.7}
        >
          <ChevronRight
            size={20}
            color={colors.textSecondary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {dayHeaders.map((day, index) => (
          <View key={`day-header-${index}`} style={styles.dayHeader}>
            <Text
              style={[styles.dayHeaderText, { color: colors.textSecondary }]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarGrid.map((dayData, index) => {
          const { day, date, isCurrentMonth, isOtherMonth } = dayData;
          const expenses = getExpensesForDate(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const isPaydayDate = isPayday(date);

          // Priority rules: selected day takes precedence
          const showPaydayBorder = isPaydayDate && !isTodayDate && !isSelectedDate;
          const showExpenseBadge = expenses.length > 0;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                {
                  backgroundColor: isSelectedDate 
                    ? colors.primary 
                    : isTodayDate 
                      ? '#007AFF' 
                      : colors.card,
                  borderColor: showPaydayBorder 
                    ? '#34C759' 
                    : isSelectedDate 
                      ? colors.primary 
                      : colors.border,
                  borderWidth: showPaydayBorder || isSelectedDate ? 2 : 1,
                },
                isOtherMonth && styles.otherMonthCell,
              ]}
              onPress={() => handleDatePress(date)}
              activeOpacity={0.7}
              disabled={isOtherMonth}
              accessibilityLabel={`${date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}${isOtherMonth ? ' (not in current month)' : ''}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.dateText,
                  {
                    color: isSelectedDate
                      ? '#FFFFFF'
                      : isTodayDate
                        ? '#FFFFFF'
                        : isCurrentMonth
                          ? colors.text
                          : colors.textSecondary,
                    fontWeight: isSelectedDate || isTodayDate ? '700' : '500',
                  },
                ]}
              >
                {day}
              </Text>

              {/* Expense Badge */}
              {showExpenseBadge && (
                <View
                  style={[
                    styles.expenseIndicator,
                    {
                      backgroundColor: '#FF3B30',
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.modern,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.modern,
    gap: Spacing.sm,
  },
  monthText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingHorizontal: SpacingValues.screenHorizontal,
    justifyContent: 'space-between',
  },
  dayHeader: {
    width: 40,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginHorizontal: 2,
  },
  dayHeaderText: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SpacingValues.screenHorizontal,
    justifyContent: 'space-between',
    width: '100%',
  },
  dateCell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    margin: 2,
    position: 'relative',
    overflow: 'visible',
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  dateText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  expenseIndicator: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
