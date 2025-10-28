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

interface WeekNumberPickerProps {
  selectedWeek: number;
  onWeekSelect: (week: number) => void;
}

const weeks = [
  { number: 1, label: 'Week 1', description: 'First week of the month' },
  { number: 2, label: 'Week 2', description: 'Second week of the month' },
  { number: 3, label: 'Week 3', description: 'Third week of the month' },
  { number: 4, label: 'Week 4', description: 'Fourth week of the month' },
];

export default function WeekNumberPicker({
  selectedWeek,
  onWeekSelect,
}: WeekNumberPickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (week: number) => {
    onWeekSelect(week);
    setIsVisible(false);
  };

  const selectedWeekLabel =
    weeks.find(w => w.number === selectedWeek)?.label || 'Week 1';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectedText}>{selectedWeekLabel}</Text>
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
              <Text style={styles.modalTitle}>Select Week of Month</Text>
              <Text style={styles.modalSubtitle}>
                Choose which week of the month you receive income
              </Text>
            </View>

            <ScrollView
              style={styles.weeksList}
              showsVerticalScrollIndicator={false}
            >
              {weeks.map(week => (
                <TouchableOpacity
                  key={week.number}
                  style={[
                    styles.weekOption,
                    selectedWeek === week.number && styles.selectedWeekOption,
                  ]}
                  onPress={() => handleSelect(week.number)}
                  activeOpacity={0.7}
                >
                  <View style={styles.weekContent}>
                    <Text
                      style={[
                        styles.weekText,
                        selectedWeek === week.number && styles.selectedWeekText,
                      ]}
                    >
                      {week.label}
                    </Text>
                    <Text
                      style={[
                        styles.weekDescription,
                        selectedWeek === week.number &&
                          styles.selectedWeekDescription,
                      ]}
                    >
                      {week.description}
                    </Text>
                  </View>
                  {selectedWeek === week.number && (
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
    maxHeight: '50%',
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
  weeksList: {
    maxHeight: 250,
  },
  weekOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedWeekOption: {
    backgroundColor: Colors.cardSecondary,
    borderLeftWidth: 4,
    borderLeftColor: Colors.income,
  },
  weekContent: {
    flex: 1,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  selectedWeekText: {
    color: Colors.income,
    fontWeight: '600',
  },
  weekDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedWeekDescription: {
    color: Colors.income,
    opacity: 0.8,
  },
});
