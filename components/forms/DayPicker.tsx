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

interface DayPickerProps {
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

export default function DayPicker({
  selectedDay,
  onDaySelect,
}: DayPickerProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [isVisible, setIsVisible] = useState(false);

  // Generate days 1-31
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSelect = (day: number) => {
    onDaySelect(day);
    setIsVisible(false);
  };

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectedText}>
          {selectedDay}
          {getOrdinalSuffix(selectedDay)} of the month
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
              <Text style={styles.modalTitle}>Select Day of Month</Text>
              <Text style={styles.modalSubtitle}>
                Choose when this transaction occurs each month
              </Text>
            </View>

            <ScrollView
              style={styles.daysList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.daysContent}
            >
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayOption,
                    selectedDay === day && styles.selectedDayOption,
                  ]}
                  onPress={() => handleSelect(day)}
                  activeOpacity={0.6}
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
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      width: '100%',
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
      maxWidth: 360,
      maxHeight: '65%',
      ...Shadow.heavy,
    },
    modalHeader: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '400',
    },
    daysList: {
      maxHeight: 400,
    },
    daysContent: {
      paddingVertical: Spacing.xs,
    },
    dayOption: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    selectedDayOption: {
      backgroundColor: colors.primary + '15',
    },
    dayText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    selectedDayText: {
      color: colors.primary,
      fontWeight: '600',
    },

  });
