import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { ReminderReason, ReminderReasonOption } from '@/types/finance';

interface ReminderReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onSetReminder: (reason: ReminderReason, note?: string) => void;
  transactionName: string;
}

const REMINDER_REASONS: ReminderReasonOption[] = [
  {
    id: 'cancel_subscription',
    label: 'Cancel this subscription',
    description: 'Stop paying for this service',
  },
  {
    id: 'find_cheaper_option',
    label: 'Look for a cheaper option',
    description: 'Find a more affordable alternative',
  },
  {
    id: 'evaluate_usage',
    label: 'Evaluate if I still use this',
    description: 'Check if this expense is still necessary',
  },
  {
    id: 'remind_before_renewal',
    label: 'Just remind me before next renewal',
    description: 'Get notified before the next billing cycle',
  },
];

export default function ReminderReasonModal({
  visible,
  onClose,
  onSetReminder,
  transactionName,
}: ReminderReasonModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [selectedReason, setSelectedReason] = useState<ReminderReason | null>(null);
  const [note, setNote] = useState('');

  const handleSetReminder = () => {
    if (selectedReason) {
      onSetReminder(selectedReason, note.trim() || undefined);
      setSelectedReason(null);
      setNote('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              What would you like to be reminded about?
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: colors.cardSecondary }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Transaction Name */}
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionLabel, { color: colors.textSecondary }]}>
              For: {transactionName}
            </Text>
          </View>

          {/* Reason Options */}
          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {REMINDER_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.option,
                  { 
                    backgroundColor: selectedReason === reason.id ? colors.cardSecondary : colors.card,
                    borderColor: selectedReason === reason.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedReason(reason.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {reason.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {reason.description}
                  </Text>
                </View>
                {selectedReason === reason.id && (
                  <Check size={20} color={colors.primary} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Note Field */}
          <View style={styles.noteSection}>
            <Text style={[styles.noteLabel, { color: colors.text }]}>
              Optional Note
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              placeholder="Add any additional notes..."
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { 
                  backgroundColor: selectedReason ? colors.primary : colors.border,
                  opacity: selectedReason ? 1 : 0.5,
                }
              ]}
              onPress={handleSetReminder}
              disabled={!selectedReason}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                Set Reminder
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    borderRadius: BorderRadius.xxl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...Shadow.heavy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.md,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  transactionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionsContainer: {
    maxHeight: 300,
    paddingHorizontal: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  noteInput: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
