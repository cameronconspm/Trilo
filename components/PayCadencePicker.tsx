import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check, HelpCircle } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
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
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const selectedOption = cadenceOptions.find(option => option.key === selectedCadence);
  
  const handleSelect = (cadence: PayCadence) => {
    onCadenceSelect(cadence);
    setIsVisible(false);
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
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
      color: colors.text,
      letterSpacing: -0.2,
      flex: 1,
    },
    helpButton: {
      padding: Spacing.xs,
    },
    helpContainer: {
      backgroundColor: colors.cardSecondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.border,
    },
    helpText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      fontWeight: '500',
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
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
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
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    selectedOptionDescription: {
      color: colors.primary,
      opacity: 0.8,
    },
  });
  
  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.labelContainer}>
        <Text style={dynamicStyles.label}>Pay Frequency *</Text>
        <TouchableOpacity 
          onPress={() => setShowHelp(!showHelp)}
          style={dynamicStyles.helpButton}
          activeOpacity={0.7}
        >
          <HelpCircle size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      
      {showHelp && (
        <View style={dynamicStyles.helpContainer}>
          <Text style={dynamicStyles.helpText}>
            Choose how often you receive this income. This helps calculate when your next payments will arrive.
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <View style={dynamicStyles.selectedOption}>
          <Text style={dynamicStyles.selectedText}>{selectedOption?.label}</Text>
          <Text style={dynamicStyles.selectedDescription}>{selectedOption?.description}</Text>
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
          style={dynamicStyles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={dynamicStyles.modal}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Select Pay Frequency</Text>
              <Text style={dynamicStyles.modalSubtitle}>
                How often do you receive this income?
              </Text>
            </View>
            
            <ScrollView style={dynamicStyles.optionsList} showsVerticalScrollIndicator={false}>
              {cadenceOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    dynamicStyles.option,
                    selectedCadence === option.key && dynamicStyles.selectedOptionStyle
                  ]}
                  onPress={() => handleSelect(option.key)}
                  activeOpacity={0.7}
                >
                  <View style={dynamicStyles.optionContent}>
                    <Text style={[
                      dynamicStyles.optionText,
                      selectedCadence === option.key && dynamicStyles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      dynamicStyles.optionDescription,
                      selectedCadence === option.key && dynamicStyles.selectedOptionDescription
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {selectedCadence === option.key && (
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

