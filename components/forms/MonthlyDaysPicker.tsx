import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface MonthlyDaysPickerProps {
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  maxDays?: number;
  label?: string;
}

export default function MonthlyDaysPicker({
  selectedDays,
  onDaysChange,
  maxDays = 2,
  label = 'Pay Days',
}: MonthlyDaysPickerProps) {
  const [inputValue, setInputValue] = useState('');

  const addDay = () => {
    const day = parseInt(inputValue);
    if (
      day >= 1 &&
      day <= 31 &&
      !selectedDays.includes(day) &&
      selectedDays.length < maxDays
    ) {
      onDaysChange([...selectedDays, day].sort((a, b) => a - b));
      setInputValue('');
    }
  };

  const removeDay = (dayToRemove: number) => {
    onDaysChange(selectedDays.filter(day => day !== dayToRemove));
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      addDay();
    }
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label} *</Text>
      <Text style={styles.subtitle}>
        Enter the day numbers when you get paid each month (e.g., 7, 23)
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder='Enter day (1-31)'
          placeholderTextColor={Colors.inactive}
          keyboardType='number-pad'
          returnKeyType='done'
          onSubmitEditing={handleInputSubmit}
          maxLength={2}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            !inputValue.trim() && styles.addButtonDisabled,
          ]}
          onPress={addDay}
          disabled={!inputValue.trim() || selectedDays.length >= maxDays}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.addButtonText,
              !inputValue.trim() && styles.addButtonTextDisabled,
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {selectedDays.length > 0 && (
        <View style={styles.selectedDaysContainer}>
          <Text style={styles.selectedDaysLabel}>Selected Pay Days:</Text>
          <View style={styles.daysList}>
            {selectedDays.map(day => (
              <View key={day} style={styles.dayChip}>
                <Text style={styles.dayChipText}>
                  {day}
                  {getOrdinalSuffix(day)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeDay(day)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                >
                  <X size={14} color={Colors.card} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {selectedDays.length >= maxDays && (
        <Text style={styles.maxDaysText}>
          Maximum {maxDays} pay days allowed
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    color: Colors.income,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontWeight: '500',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 16,
    borderWidth: 2,
    borderColor: Colors.income,
    color: Colors.text,
    ...Shadow.light,
  },
  addButton: {
    backgroundColor: Colors.income,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    ...Shadow.light,
  },
  addButtonDisabled: {
    backgroundColor: Colors.inactive,
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.card,
  },
  addButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  selectedDaysContainer: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.income,
  },
  selectedDaysLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  daysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.income,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.card,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxDaysText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
