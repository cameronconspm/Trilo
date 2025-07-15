import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

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
  label = "Date",
  minimumDate,
  maximumDate,
  variant = 'default'
}: DatePickerProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [isVisible, setIsVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  
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
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    
    // Check if date is within bounds
    if (minimumDate && newDate < minimumDate) return;
    if (maximumDate && newDate > maximumDate) return;
    
    onDateSelect(newDate);
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
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isDisabled = (minimumDate && date < minimumDate) || (maximumDate && date > maximumDate);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            isSelected && styles.selectedDay,
            isDisabled && styles.disabledDay,
            isToday && !isSelected && styles.todayDay,
          ]}
          onPress={() => handleDateSelect(day)}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isDisabled && styles.disabledDayText,
            isToday && !isSelected && styles.todayDayText,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const styles = createStyles(colors, variant);

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
            <Text style={styles.selectedText}>{formatShortDate(selectedDate)}</Text>
            <Text style={styles.selectedDescription}>{formatDate(selectedDate)}</Text>
          </View>
        </View>
        <ChevronDown size={20} color={colors.inactive} />
      </TouchableOpacity>
      
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
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
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              
              <View style={styles.calendar}>
                {renderCalendar()}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, variant: 'default' | 'income') => StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: colors.text,
    letterSpacing: -0.2,
  },
  picker: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.light,
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dateContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  selectedDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xxl,
    width: '100%',
    maxHeight: '80%',
    ...Shadow.heavy,
  },
  modalHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarContainer: {
    padding: Spacing.lg,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    width: '100%',
  },
  weekDayText: {
    width: '14.285714%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  emptyDay: {
    width: '14.285714%',
    aspectRatio: 1,
  },
  dayButton: {
    width: '14.285714%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    marginVertical: 1,
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  disabledDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  selectedDayText: {
    color: colors.card,
    fontWeight: '600',
  },
  disabledDayText: {
    color: colors.inactive,
  },
  todayDayText: {
    color: colors.primary,
    fontWeight: '600',
  },
});