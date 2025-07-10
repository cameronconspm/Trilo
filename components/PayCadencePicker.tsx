import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check, HelpCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { PayCadence } from '@/types/finance';

interface PayCadencePickerProps {
  selectedCadence: PayCadence;
  onCadenceSelect: (cadence: PayCadence) => void;
}

const cadenceOptions = [
  {
    key: 'weekly' as PayCadence,
    label: 'Weekly',
    description: 'Paid every week (52 times per year)',
  },
  {
    key: 'every_2_weeks' as PayCadence,
    label: 'Every 2 Weeks',
    description: 'Paid every other week (26 times per year)',
  },
  {
    key: 'twice_monthly' as PayCadence,
    label: 'Twice a Month',
    description: 'Paid on specific days each month (24 times per year)',
  },
  {
    key: 'monthly' as PayCadence,
    label: 'Monthly',
    description: 'Paid once per month (12 times per year)',
  },
  {
    key: 'custom' as PayCadence,
    label: 'Custom',
    description: 'Set your own pay schedule',
  },
];

export default function PayCadencePicker({ selectedCadence, onCadenceSelect }: PayCadencePickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const selectedOption = cadenceOptions.find(option => option.key === selectedCadence);
  
  const handleSelect = (cadence: PayCadence) => {
    onCadenceSelect(cadence);
    setIsVisible(false);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Pay Frequency *</Text>
        <TouchableOpacity 
          onPress={() => setShowHelp(!showHelp)}
          style={styles.helpButton}
          activeOpacity={0.7}
        >
          <HelpCircle size={16} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      
      {showHelp && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Choose how often you receive this income. This helps calculate when your next payments will arrive.
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.selectedOption}>
          <Text style={styles.selectedText}>{selectedOption?.label}</Text>
          <Text style={styles.selectedDescription}>{selectedOption?.description}</Text>
        </View>
        <ChevronDown size={20} color={Colors.inactive} />
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
              <Text style={styles.modalTitle}>Select Pay Frequency</Text>
              <Text style={styles.modalSubtitle}>
                How often do you receive this income?
              </Text>
            </View>
            
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {cadenceOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.option,
                    selectedCadence === option.key && styles.selectedOptionStyle
                  ]}
                  onPress={() => handleSelect(option.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionText,
                      selectedCadence === option.key && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      selectedCadence === option.key && styles.selectedOptionDescription
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {selectedCadence === option.key && (
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
    marginBottom: Spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.income,
    letterSpacing: -0.2,
    flex: 1,
  },
  helpButton: {
    padding: Spacing.xs,
  },
  helpContainer: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.income,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  picker: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.income,
    ...Shadow.light,
  },
  selectedOption: {
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  selectedDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    width: '100%',
    maxHeight: '80%',
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
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedOptionStyle: {
    backgroundColor: Colors.cardSecondary,
    borderLeftWidth: 4,
    borderLeftColor: Colors.income,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  selectedOptionText: {
    color: Colors.income,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedOptionDescription: {
    color: Colors.income,
    opacity: 0.8,
  },
});