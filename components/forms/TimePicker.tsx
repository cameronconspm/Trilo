import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';

interface TimePickerProps {
  value: string; // HH:MM format
  onChange: (time: string) => void;
  onClose: () => void;
}

export default function TimePicker({
  value,
  onChange,
  onClose,
}: TimePickerProps) {
  const [selectedHour, setSelectedHour] = useState(
    parseInt(value.split(':')[0])
  );
  const [selectedMinute, setSelectedMinute] = useState(
    parseInt(value.split(':')[1])
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSave = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeString);
    onClose();
  };

  const formatTime = (hour: number, minute: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Time</Text>
          <Text style={styles.preview}>
            {formatTime(selectedHour, selectedMinute)}
          </Text>
        </View>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerColumn}>
            <Text style={styles.columnLabel}>Hour</Text>
            <ScrollView
              style={styles.picker}
              showsVerticalScrollIndicator={false}
            >
              {hours.map(hour => (
                <Pressable
                  key={hour}
                  style={[
                    styles.pickerItem,
                    selectedHour === hour && styles.selectedItem,
                  ]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      selectedHour === hour && styles.selectedText,
                    ]}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.pickerColumn}>
            <Text style={styles.columnLabel}>Minute</Text>
            <ScrollView
              style={styles.picker}
              showsVerticalScrollIndicator={false}
            >
              {minutes
                .filter(m => m % 5 === 0)
                .map(minute => (
                  <Pressable
                    key={minute}
                    style={[
                      styles.pickerItem,
                      selectedMinute === minute && styles.selectedItem,
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        selectedMinute === minute && styles.selectedText,
                      ]}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '80%',
    maxHeight: '70%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  preview: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  picker: {
    height: 200,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  pickerItem: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: Colors.primary,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedText: {
    color: Colors.card,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.card,
  },
});
