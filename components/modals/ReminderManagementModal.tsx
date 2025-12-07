import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Bell, Clock, CheckCircle } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useReminders } from '@/context/ReminderContext';
import { Spacing, BorderRadius, Typography } from '@/constants/spacing';
import { Reminder } from '@/types/finance';
import categories from '@/constants/categories';
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
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: colors.primary }]}
            onPress={() => handleCompleteReminder(reminder.id)}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>
              Complete
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.snoozeButton, 
              { 
                borderColor: colors.border,
                opacity: reminder.snoozeCount >= reminder.maxSnoozes ? 0.5 : 1,
              }
            ]}
            onPress={() => handleSnoozeReminder(reminder.id)}
            disabled={reminder.snoozeCount >= reminder.maxSnoozes}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Snooze
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteReminder(reminder.id)}
            style={[styles.deleteButton, { borderColor: colors.border }]}
          >
            <X size={14} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ModalWrapper visible={visible} onClose={onClose} animationType="fade" maxWidth={500}>
      <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
        {/* Close button - positioned at top right */}
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: colors.cardSecondary }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Reminders & Notifications
          </Text>
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

        {/* Scrollable Content - expands to fill available space */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                <View style={[styles.completedSection, { borderTopColor: colors.border }]}>
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
    paddingBottom: 0, // Content handles its own bottom padding
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
  
  // Tab container
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg, // 16px spacing before content
    gap: Spacing.sm, // 8px gap between tabs
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm, // 8px
    paddingHorizontal: Spacing.md, // 12px
    borderRadius: BorderRadius.lg, // 16px
    gap: Spacing.xs, // 4px gap between icon and text
    minHeight: 44, // Apple HIG minimum touch target
  },
  tabText: {
    ...Typography.caption, // 12pt
    fontWeight: '500',
  },
  
  // Scrollable container - expands to fill available space
  scrollContainer: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 200, // Minimum height to ensure scrollability
  },
  scrollContent: {
    paddingBottom: Spacing.md, // Small padding at bottom of scroll content
  },
  reminderItem: {
    padding: Spacing.md, // 12px - reduced for more compact design
    marginBottom: Spacing.sm, // 8px - reduced spacing between items
    borderRadius: BorderRadius.md, // 12px - slightly smaller radius
    borderWidth: 1,
    borderLeftWidth: 3, // Reduced from 4px
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs, // 4px - minimal spacing
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 10, // Reduced from 12px
    height: 10, // Reduced from 12px
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs, // 4px - reduced spacing
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    ...Typography.bodySmall, // 15pt - smaller for more compact design
    fontWeight: '600',
    marginBottom: 1, // Minimal spacing
  },
  reminderReason: {
    ...Typography.caption, // 12pt - smaller font
    fontWeight: '400',
  },
  reminderActions: {
    alignItems: 'flex-end',
  },
  reminderDate: {
    ...Typography.captionSmall, // 11pt - smaller font
    fontWeight: '500',
  },
  reminderNote: {
    ...Typography.caption, // 12pt - smaller font
    fontStyle: 'italic',
    marginBottom: Spacing.xs, // 4px - reduced spacing
    paddingLeft: Spacing.md, // 12px - reduced padding
    marginTop: Spacing.xs, // 4px - minimal top spacing
  },
  reminderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs, // 4px - reduced gap between buttons
    marginTop: Spacing.xs, // 4px - minimal spacing from note/header
  },
  completeButton: {
    flex: 1,
    paddingVertical: Spacing.xs, // 4px - compact vertical padding
    paddingHorizontal: Spacing.sm, // 8px - compact horizontal padding
    borderRadius: BorderRadius.md, // 12px
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32, // Reduced from 44px - more compact
  },
  snoozeButton: {
    flex: 1,
    paddingVertical: Spacing.xs, // 4px - compact vertical padding
    paddingHorizontal: Spacing.sm, // 8px - compact horizontal padding
    borderRadius: BorderRadius.md, // 12px
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32, // Reduced from 44px - more compact
  },
  buttonText: {
    ...Typography.caption, // 12pt - smaller font
    fontWeight: '600',
  },
  deleteButton: {
    width: 32, // Reduced from 36px
    height: 32, // Reduced from 36px
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl, // 24px - increased for better spacing
    paddingHorizontal: Spacing.md, // 12px
  },
  emptyTitle: {
    ...Typography.h3, // 20pt, semibold - matches app standards
    marginTop: Spacing.md, // 12px
    marginBottom: Spacing.xs, // 4px
  },
  emptySubtitle: {
    ...Typography.bodySmall, // 15pt
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md, // 12px
  },
  completedSection: {
    marginTop: Spacing.xl, // 20px - increased spacing
    paddingTop: Spacing.xl, // 20px - increased padding
    borderTopWidth: 1,
  },
  sectionTitle: {
    ...Typography.label, // 13pt, medium - matches app standards
    fontWeight: '600',
    marginBottom: Spacing.md, // 12px - increased spacing
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md, // 12px - increased padding
    marginBottom: Spacing.sm, // 8px spacing between items
    borderRadius: BorderRadius.md, // 12px
    borderWidth: 1,
    gap: Spacing.sm, // 8px gap between icon and text
    minHeight: 44, // Apple HIG minimum touch target
  },
  completedText: {
    ...Typography.bodySmall, // 15pt
    flex: 1,
  },
  moreText: {
    ...Typography.caption, // 12pt
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.md, // 12px - increased spacing
  },
});
