import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface WeekDayPickerProps {
  selectedDay: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  onDaySelect: (day: number) => void;
  label?: string;
}

const weekDays = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export default function WeekDayPicker({
  selectedDay,
  onDaySelect,
  label = 'Day of Week',
}: WeekDayPickerProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [isVisible, setIsVisible] = useState(false);

  const selectedDayInfo = weekDays.find(d => d.value === selectedDay) || weekDays[1];

  const handleSelect = (day: number) => {
    onDaySelect(day);
    setIsVisible(false);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectedText}>
          {selectedDayInfo.label}
        </Text>
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
              <Text style={styles.modalTitle}>Select Day of Week</Text>
              <Text style={styles.modalSubtitle}>
                Choose when this expense occurs each week
              </Text>
            </View>

            <ScrollView
              style={styles.daysList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.daysContent}
            >
              {weekDays.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayOption,
                    selectedDay === day.value && styles.selectedDayOption,
                  ]}
                  onPress={() => handleSelect(day.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDay === day.value && styles.selectedDayText,
                    ]}
                  >
                    {day.label}
                  </Text>
                  {selectedDay === day.value && (
                    <Check size={20} color={colors.surface} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      width: '100%',
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
    selectedText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
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
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxl,
      width: '100%',
      maxHeight: '80%',
      ...Shadow.heavy,
    },
    modalHeader: {
      padding: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.sm,
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 20,
    },
    daysList: {
      maxHeight: 500,
    },
    daysContent: {
      padding: Spacing.lg,
      paddingTop: Spacing.md,
    },
    dayOption: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 56,
      ...Shadow.light,
    },
    selectedDayOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 2,
      ...Shadow.medium,
    },
    dayText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 24,
    },
    selectedDayText: {
      color: colors.surface,
      fontWeight: '700',
    },
  });
