import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Typography } from '@/constants/spacing';
import { ReminderReason, ReminderReasonOption } from '@/types/finance';
import { ModalWrapper } from './ModalWrapper';

// Modal standards - consistent with app-wide modal design
const MODAL_STANDARDS = {
  paddingHorizontal: Spacing.xxl, // 24px - standard horizontal padding
  paddingTop: Spacing.xxl + Spacing.md, // 32px - top padding with close button clearance
  paddingBottom: Spacing.xxl, // 24px - base bottom padding
  closeButtonTop: Spacing.md, // 12px from top
  closeButtonRight: Spacing.md, // 12px from right
  contentBottomMargin: Spacing.xxl, // 24px - spacing before buttons
  buttonGap: Spacing.md, // 12px - horizontal gap between buttons
  buttonBottomPadding: Spacing.xxl, // 24px - bottom padding for buttons
} as const;

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
    <ModalWrapper visible={visible} onClose={handleClose} animationType="fade" maxWidth={500}>
      <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
        {/* Close button - positioned at top right */}
        <TouchableOpacity
          onPress={handleClose}
          style={[styles.closeButton, { backgroundColor: colors.cardSecondary }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            What would you like to be reminded about?
          </Text>
        </View>

        {/* Transaction Name */}
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionLabel, { color: colors.textSecondary }]}>
            For: {transactionName}
          </Text>
        </View>

        {/* Scrollable Content - Options and Note together for seamless scrolling */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Reason Options */}
          <View style={styles.optionsSection}>
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
          </View>

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
        </ScrollView>

        {/* Action Buttons - Fixed at bottom */}
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
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  // Modal container - follows app modal standards
  modalContainer: {
    width: '100%',
    maxHeight: '100%',
    position: 'relative',
    paddingHorizontal: MODAL_STANDARDS.paddingHorizontal, // 24px
    paddingTop: MODAL_STANDARDS.paddingTop, // 32px
    paddingBottom: 0, // Buttons handle their own bottom padding
  },
  
  // Close button - top right, consistent with app standards
  closeButton: {
    position: 'absolute',
    top: MODAL_STANDARDS.closeButtonTop, // 12px
    right: MODAL_STANDARDS.closeButtonRight, // 12px
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  // Header section
  header: {
    marginBottom: Spacing.md, // 12px spacing after title
  },
  title: {
    ...Typography.h3, // 20pt, semibold - matches app standards
    paddingRight: Spacing.xxxl, // 32px - clearance for close button
  },
  
  // Transaction info
  transactionInfo: {
    marginBottom: Spacing.lg, // 16px spacing before options
  },
  transactionLabel: {
    ...Typography.label, // 13pt, medium - matches app standards
  },
  
  // Scrollable container - expands to fill available space
  scrollContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: MODAL_STANDARDS.contentBottomMargin, // 24px spacing before buttons
    minHeight: 200, // Minimum height to ensure scrollability
  },
  scrollContent: {
    paddingBottom: Spacing.sm, // Small padding at bottom of scroll content
  },
  
  // Options section
  optionsSection: {
    marginBottom: Spacing.xl, // 20px spacing before note section
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg, // 16px
    marginBottom: Spacing.sm, // 8px between options
    borderRadius: BorderRadius.lg, // 16px
    borderWidth: 1,
    minHeight: 64, // Minimum touch target for better UX
  },
  optionContent: {
    flex: 1,
    marginRight: Spacing.md, // 12px spacing before check icon
  },
  optionLabel: {
    ...Typography.bodyMedium, // 17pt, medium
    fontWeight: '600',
    marginBottom: Spacing.xs, // 4px spacing before description
  },
  optionDescription: {
    ...Typography.caption, // 12pt
    lineHeight: 18,
  },
  
  // Note section
  noteSection: {
    marginTop: Spacing.md, // 12px spacing from options
  },
  noteLabel: {
    ...Typography.bodyMedium, // 17pt, medium - matches app standards
    fontWeight: '600',
    marginBottom: Spacing.sm, // 8px spacing before input
  },
  noteInput: {
    borderRadius: BorderRadius.lg, // 16px
    borderWidth: 1,
    padding: Spacing.md, // 12px
    fontSize: 16,
    minHeight: 88, // Comfortable height for multi-line input
    lineHeight: 22,
  },
  
  // Action buttons - fixed at bottom
  actions: {
    flexDirection: 'row',
    paddingTop: Spacing.md, // 12px spacing from scroll content
    paddingBottom: MODAL_STANDARDS.buttonBottomPadding, // 24px - standard bottom padding
    gap: MODAL_STANDARDS.buttonGap, // 12px gap between buttons
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md, // 12px
    borderRadius: BorderRadius.lg, // 16px
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Apple HIG minimum touch target
  },
  cancelButton: {
    borderWidth: 1,
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonText: {
    ...Typography.bodyMedium, // 17pt, medium
    fontWeight: '600',
  },
});
