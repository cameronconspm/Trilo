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
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface WeekDayPickerProps {
  selectedDay: string;
  onDaySelect: (day: string) => void;
}

const weekDays = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function WeekDayPicker({
  selectedDay,
  onDaySelect,
}: WeekDayPickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (day: string) => {
    onDaySelect(day);
    setIsVisible(false);
  };

  const selectedDayLabel =
    weekDays.find(d => d.key === selectedDay)?.label || 'Monday';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectedText}>{selectedDayLabel}</Text>
        <ChevronDown size={20} color={Colors.inactive} />
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
                Choose which day you receive income
              </Text>
            </View>

            <ScrollView
              style={styles.daysList}
              showsVerticalScrollIndicator={false}
            >
              {weekDays.map(day => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayOption,
                    selectedDay === day.key && styles.selectedDayOption,
                  ]}
                  onPress={() => handleSelect(day.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDay === day.key && styles.selectedDayText,
                    ]}
                  >
                    {day.label}
                  </Text>
                  {selectedDay === day.key && (
                    <Check size={20} color={Colors.income} strokeWidth={2.5} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  picker: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.light,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    width: '100%',
    maxHeight: '60%',
    ...Shadow.heavy,
  },
  modalHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
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
    maxHeight: 300,
  },
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedDayOption: {
    backgroundColor: Colors.cardSecondary,
    borderLeftWidth: 4,
    borderLeftColor: Colors.income,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedDayText: {
    color: Colors.income,
    fontWeight: '600',
  },
});
