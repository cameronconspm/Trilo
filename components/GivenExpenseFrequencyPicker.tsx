import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { GivenExpenseFrequency } from '@/types/finance';

interface GivenExpenseFrequencyPickerProps {
  selectedFrequency: GivenExpenseFrequency;
  onFrequencySelect: (frequency: GivenExpenseFrequency) => void;
  label?: string;
}

const frequencyOptions: { id: GivenExpenseFrequency; name: string; description: string }[] = [
  {
    id: 'every_week',
    name: 'Every Week',
    description: 'Occurs weekly on the same day'
  },
  {
    id: 'every_other_week',
    name: 'Every Other Week',
    description: 'Occurs bi-weekly on the same day'
  },
  {
    id: 'once_a_month',
    name: 'Once a Month',
    description: 'Occurs monthly on the same date'
  },
];

export default function GivenExpenseFrequencyPicker({
  selectedFrequency,
  onFrequencySelect,
  label = "Frequency",
}: GivenExpenseFrequencyPickerProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [isVisible, setIsVisible] = useState(false);
  
  const selectedOption = frequencyOptions.find(option => option.id === selectedFrequency) || frequencyOptions[0];
  
  const handleSelect = (frequency: GivenExpenseFrequency) => {
    onFrequencySelect(frequency);
    setIsVisible(false);
  };
  
  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.selectedOption}>
          <View>
            <Text style={styles.selectedText}>{selectedOption.name}</Text>
            <Text style={styles.selectedDescription}>{selectedOption.description}</Text>
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
              <Text style={styles.modalTitle}>Select Frequency</Text>
            </View>
            
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    selectedFrequency === option.id && styles.selectedOptionStyle
                  ]}
                  onPress={() => handleSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View>
                      <Text style={[
                        styles.optionText,
                        selectedFrequency === option.id && styles.selectedOptionText
                      ]}>
                        {option.name}
                      </Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {selectedFrequency === option.id && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
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

// Create dynamic styles based on theme
const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
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
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  selectedDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
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
    letterSpacing: -0.3,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOptionStyle: {
    backgroundColor: colors.cardSecondary,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
});