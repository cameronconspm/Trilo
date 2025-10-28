import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { X, Bell, Clock, CheckCircle, Edit3, MoreHorizontal } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useReminders } from '@/context/ReminderContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Reminder } from '@/types/finance';
import categories from '@/constants/categories';
import Button from '@/components/layout/Button';

interface ReminderManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReminderManagementModal({
  visible,
  onClose,
}: ReminderManagementModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { reminders, completeReminder, snoozeReminder, deleteReminder } = useReminders();
  const [activeTab, setActiveTab] = useState<'reminders' | 'notifications'>('reminders');

  const activeReminders = reminders.filter(reminder => !reminder.isCompleted);
  const completedReminders = reminders.filter(reminder => reminder.isCompleted);

  const formatReminderDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `In ${diffDays} days`;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'cancel_subscription':
        return 'Cancel subscription';
      case 'find_cheaper_option':
        return 'Find cheaper option';
      case 'evaluate_usage':
        return 'Evaluate usage';
      case 'remind_before_renewal':
        return 'Remind before renewal';
      default:
        return reason;
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      await completeReminder(reminderId);
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleSnoozeReminder = async (reminderId: string) => {
    try {
      await snoozeReminder(reminderId, 3); // Snooze for 3 days
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const renderReminderItem = (reminder: Reminder) => {
    const categoryInfo = categories.find(c => c.id === reminder.transactionCategory) || categories[0];
    const isOverdue = new Date(reminder.reminderDate) < new Date();

    return (
      <View
        key={reminder.id}
        style={[
          styles.reminderItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: isOverdue ? colors.error : colors.primary,
          },
        ]}
      >
        <View style={styles.reminderHeader}>
          <View style={styles.reminderLeft}>
            <View style={[styles.categoryDot, { backgroundColor: categoryInfo.color }]} />
            <View style={styles.reminderInfo}>
              <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={1}>
                {reminder.transactionName}
              </Text>
              <Text style={[styles.reminderReason, { color: colors.textSecondary }]}>
                {getReasonLabel(reminder.reason)}
              </Text>
            </View>
          </View>
          <View style={styles.reminderActions}>
            <Text
              style={[
                styles.reminderDate,
                {
                  color: isOverdue ? colors.error : colors.textSecondary,
                  fontWeight: isOverdue ? '600' : '400',
                },
              ]}
            >
              {formatReminderDate(reminder.reminderDate)}
            </Text>
          </View>
        </View>

        {reminder.note && (
          <Text style={[styles.reminderNote, { color: colors.textSecondary }]}>
            {reminder.note}
          </Text>
        )}

        <View style={styles.reminderButtons}>
          <Button
            title="Mark Complete"
            onPress={() => handleCompleteReminder(reminder.id)}
            variant="primary"
            size="small"
            style={styles.actionButton}
          />
          <Button
            title="Snooze"
            onPress={() => handleSnoozeReminder(reminder.id)}
            variant="outline"
            size="small"
            style={styles.actionButton}
            disabled={reminder.snoozeCount >= reminder.maxSnoozes}
          />
          <TouchableOpacity
            onPress={() => handleDeleteReminder(reminder.id)}
            style={[styles.deleteButton, { borderColor: colors.border }]}
          >
            <X size={16} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Reminders & Notifications
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.cardSecondary }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'reminders' && { backgroundColor: colors.cardSecondary },
              ]}
              onPress={() => setActiveTab('reminders')}
            >
              <Bell size={16} color={activeTab === 'reminders' ? colors.primary : colors.textSecondary} />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'reminders' ? colors.primary : colors.textSecondary,
                    fontWeight: activeTab === 'reminders' ? '600' : '400',
                  },
                ]}
              >
                Reminders ({activeReminders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'notifications' && { backgroundColor: colors.cardSecondary },
              ]}
              onPress={() => setActiveTab('notifications')}
            >
              <Clock size={16} color={activeTab === 'notifications' ? colors.primary : colors.textSecondary} />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'notifications' ? colors.primary : colors.textSecondary,
                    fontWeight: activeTab === 'notifications' ? '600' : '400',
                  },
                ]}
              >
                System Notifications
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'reminders' ? (
              <View>
                {activeReminders.length > 0 ? (
                  activeReminders.map(renderReminderItem)
                ) : (
                  <View style={styles.emptyState}>
                    <Bell size={48} color={colors.textSecondary} strokeWidth={1} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      No Active Reminders
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                      Swipe right on any expense to set a reminder
                    </Text>
                  </View>
                )}

                {completedReminders.length > 0 && (
                  <View style={styles.completedSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      Completed ({completedReminders.length})
                    </Text>
                    {completedReminders.slice(0, 3).map(reminder => (
                      <View
                        key={reminder.id}
                        style={[
                          styles.completedItem,
                          { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                        ]}
                      >
                        <CheckCircle size={16} color={colors.success} strokeWidth={2} />
                        <Text style={[styles.completedText, { color: colors.textSecondary }]}>
                          {reminder.transactionName}
                        </Text>
                      </View>
                    ))}
                    {completedReminders.length > 3 && (
                      <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                        +{completedReminders.length - 3} more completed
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Clock size={48} color={colors.textSecondary} strokeWidth={1} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  System Notifications
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Weekly summaries and insights will appear here
                </Text>
              </View>
            )}
          </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  reminderItem: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reminderReason: {
    fontSize: 14,
    fontWeight: '400',
  },
  reminderActions: {
    alignItems: 'flex-end',
  },
  reminderDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  reminderNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.lg,
  },
  reminderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  completedSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  completedText: {
    fontSize: 14,
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
