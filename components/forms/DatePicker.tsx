import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import { generateCalendarGrid } from '@/utils/dateUtils';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  variant?: 'default' | 'income';
}

export default function DatePicker({
  selectedDate,
  onDateSelect,
  label = 'Date',
  minimumDate,
  maximumDate,
  variant = 'default',
}: DatePickerProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { spacing, typography } = useResponsiveDesign();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // Generate calendar grid for current month
  const calendarGrid = useMemo(() => {
    // Hardcode week start to Sunday (0) since week start functionality is removed
    const weekStartNumeric = 0;
    return generateCalendarGrid(currentYear, currentMonth, weekStartNumeric);
  }, [currentYear, currentMonth]);

  // Get day headers based on week start configuration
  const dayHeaders = useMemo(() => {
    // The grid will automatically align based on the weekStart parameter
    // Since we're hardcoding to Sunday start, always return Sunday-first headers
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDateSelect = (date: Date) => {
    // Check if date is within bounds
    if (minimumDate && date < minimumDate) return;
    if (maximumDate && date > maximumDate) return;

    onDateSelect(date);
    setIsVisible(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const rows = [];
    const cellsPerRow = 7;
    
    for (let i = 0; i < calendarGrid.length; i += cellsPerRow) {
      const rowCells = calendarGrid.slice(i, i + cellsPerRow);
      const row = (
        <View key={`row-${i / cellsPerRow}`} style={styles.calendarRow}>
          {rowCells.map((dayData, index) => {
            const { day, date, isCurrentMonth, isOtherMonth } = dayData;
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const isDisabled =
              isOtherMonth ||
              (minimumDate && date < minimumDate) ||
              (maximumDate && date > maximumDate);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <TouchableOpacity
                key={`cell-${i + index}`}
                style={[
                  styles.dayButton,
                  isSelected && styles.selectedDay,
                  isDisabled && styles.disabledDay,
                  isToday && !isSelected && styles.todayDay,
                  isOtherMonth && styles.otherMonthDay,
                ]}
                onPress={() => handleDateSelect(date)}
                disabled={isDisabled}
                activeOpacity={0.7}
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
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isDisabled && styles.disabledDayText,
                    isToday && !isSelected && styles.todayDayText,
                    isOtherMonth && styles.otherMonthDayText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
      rows.push(row);
    }
    
    return rows;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Styles with responsive values
  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 17,
      fontWeight: '600',
      marginBottom: spacing.md,
      color: colors.text,
      letterSpacing: -0.2,
    },
    picker: {
      backgroundColor: colors.card,
      borderRadius: 12, // BorderRadius.lg
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    selectedOption: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 90, // BorderRadius.full
      backgroundColor: colors.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    dateContainer: {
      flex: 1,
    },
    selectedText: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    selectedDescription: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modal: {
      backgroundColor: colors.card,
      borderRadius: 28, // BorderRadius.xxl
      width: '100%',
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    modalHeader: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    modalTitle: {
      ...typography.h3,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4, // spacing.xs
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    calendarContainer: {
      padding: spacing.lg,
    },
    monthNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 90, // BorderRadius.full
      backgroundColor: colors.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navButtonText: {
      ...typography.h3,
      fontWeight: '600',
      color: colors.text,
    },
    monthYear: {
      ...typography.h3,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.3,
    },
    weekDaysHeader: {
      flexDirection: 'row',
      marginBottom: spacing.md,
      width: '100%',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
    },
    weekDayText: {
      width: 40,
      textAlign: 'center',
      ...typography.bodySmall,
      fontWeight: '600',
      color: colors.textSecondary,
      marginHorizontal: 1,
    },
    calendar: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
    },
    calendarRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    dayButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12, // BorderRadius.modern - match Calendar component
      margin: 1, // Reduced margin to extend towards edges
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
      overflow: 'visible',
    },
    selectedDay: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    disabledDay: {
      opacity: 0.3,
    },
    todayDay: {
      backgroundColor: '#007AFF', // Match Calendar component's today color
      borderColor: '#007AFF',
      borderWidth: 2,
    },
    otherMonthDay: {
      opacity: 0.4,
    },
    dayText: {
      ...typography.bodySmall,
      textAlign: 'center',
      lineHeight: 20,
      fontWeight: '500',
      color: colors.text,
    },
    selectedDayText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    disabledDayText: {
      color: colors.inactive,
    },
    todayDayText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    otherMonthDayText: {
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label} *</Text>

      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.selectedOption}>
          <View style={styles.iconContainer}>
            <Calendar size={18} color={colors.textSecondary} strokeWidth={2} />
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.selectedText}>
              {formatShortDate(selectedDate)}
            </Text>
            <Text style={styles.selectedDescription}>
              {formatDate(selectedDate)}
            </Text>
          </View>
        </View>
        <ChevronDown size={20} color={colors.inactive} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <Text style={styles.modalSubtitle}>
                Choose your most recent pay date
              </Text>
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth('prev')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.monthYear}>
                  {monthNames[currentMonth]} {currentYear}
                </Text>

                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth('next')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysHeader}>
                {dayHeaders.map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendar}>{renderCalendar()}</View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
