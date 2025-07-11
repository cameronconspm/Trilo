import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface DayPickerProps {
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

export default function DayPicker({ selectedDay, onDaySelect }: DayPickerProps) {
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
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
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
          {selectedDay}{getOrdinalSuffix(selectedDay)} of the month
        </Text>
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
              <Text style={styles.modalTitle}>Select Day of Month</Text>
              <Text style={styles.modalSubtitle}>
                Choose when this transaction occurs each month
              </Text>
            </View>
            
            <ScrollView style={styles.daysList} showsVerticalScrollIndicator={false}>
              <View style={styles.daysGrid}>
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayOption,
                      selectedDay === day && styles.selectedDayOption
                    ]}
                    onPress={() => handleSelect(day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dayText,
                      selectedDay === day && styles.selectedDayText
                    ]}>
                      {day}
                    </Text>
                    {selectedDay === day && (
                      <View style={styles.checkContainer}>
                        <Check size={16} color={colors.primary} strokeWidth={2.5} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
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
    maxHeight: '70%',
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
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  daysList: {
    maxHeight: 400,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
  },
  dayOption: {
    width: '14.28%', // 7 days per row
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    margin: 2,
    backgroundColor: colors.background,
    position: 'relative',
  },
  selectedDayOption: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedDayText: {
    color: colors.card,
  },
  checkContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});