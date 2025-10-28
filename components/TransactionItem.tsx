import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2, Edit3, Check, DollarSign, Bell } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Typography } from '@/constants/spacing';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { useReminders } from '@/context/ReminderContext';
import { useAlert } from '@/hooks/useAlert';
import AlertModal from '@/components/modals/AlertModal';
import { ReminderReasonModal } from '@/components/modals';
import categories from '@/constants/categories';
import { formatPaySchedule } from '@/utils/payScheduleUtils';

// Helper function to get day suffix (1st, 2nd, 3rd, etc.)
const getDaySuffix = (day: number): string => {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
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

interface TransactionItemProps {
  transaction: Transaction;
  isLast?: boolean;
  showActions?: boolean;
  onEdit?: (transaction: Transaction) => void;
  enableSwipeActions?: boolean;
  enableLeftSwipe?: boolean; // Enable left swipe for mark as paid/remind me
  dateFormat?: 'overview' | 'budget' | 'default';
}

export default function TransactionItem({
  transaction,
  isLast = false,
  showActions = false,
  onEdit,
  enableSwipeActions = false,
  enableLeftSwipe = false,
  dateFormat = 'default',
}: TransactionItemProps) {
  const { deleteTransaction, updateTransaction } = useFinance();
  const { addReminder, getReminderForTransaction } = useReminders();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [showReminderModal, setShowReminderModal] = useState(false);
  
  // Check if this transaction already has a reminder
  const existingReminder = getReminderForTransaction(transaction.id);
  const {
    name,
    amount,
    date,
    category,
    isRecurring,
    type,
    paySchedule,
    weekDay,
    weekNumber,
  } = transaction;
  const categoryInfo = categories.find(c => c.id === category) || categories[0];

  // Format date
  const transactionDate = new Date(date);
  const today = new Date();
  const isToday = transactionDate.toDateString() === today.toDateString();
  const isFuture = transactionDate > today;
  const isPast = transactionDate < today && !isToday;

  let formattedDate;

  // For income with pay schedule, show the schedule format
  if (type === 'income' && paySchedule) {
    formattedDate = formatPaySchedule(paySchedule);
  } else if (type === 'income' && weekDay && weekNumber) {
    // Legacy format
    const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
    formattedDate = `Week ${weekNumber} ${capitalizedDay}`;
  } else if (dateFormat === 'overview') {
    // Overview tab format: "Mon 9/12" for all expenses
    const dayOfWeek = transactionDate.toLocaleDateString('en-US', { weekday: 'short' });
    const month = transactionDate.getMonth() + 1; // getMonth() returns 0-11
    const day = transactionDate.getDate();
    formattedDate = `${dayOfWeek} ${month}/${day}`;
  } else if (isRecurring && type === 'expense') {
    // Budget tab format: "24th of the month"
    const day = transactionDate.getDate();
    const suffix = getDaySuffix(day);
    formattedDate = `${day}${suffix} of the month`;
  } else {
    // For non-recurring expenses or income without schedule, show regular date
    if (isToday) {
      formattedDate = 'Today';
    } else if (isFuture) {
      formattedDate = transactionDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else {
      formattedDate = transactionDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  const handleDelete = () => {
    showAlert({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete "${name}"?`,
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => deleteTransaction(transaction.id),
          style: 'destructive',
        },
      ],
    });
  };

  const handleMarkPaid = async () => {
    try {
      await updateTransaction(transaction.id, { isPaid: !transaction.isPaid });
    } catch (error) {
      console.error('Error marking transaction as paid:', error);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleSetReminder = async (reason: any, note?: string) => {
    try {
      await addReminder(transaction, reason, note);
      showAlert({
        title: 'Reminder Set',
        message: `You'll be reminded about "${transaction.name}" before the next billing cycle.`,
        type: 'success',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    } catch (error) {
      console.error('Error setting reminder:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to set reminder. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedAddition<number>,
    dragX: Animated.AnimatedAddition<number>
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    // Always show delete button for right swipe
    return (
      <View style={styles.rightActions}>
        <Animated.View
          style={[styles.deleteAction, { transform: [{ scale }] }]}
        >
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color={colors.surface} strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedAddition<number>,
    dragX: Animated.AnimatedAddition<number>
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    if (transaction.type === 'expense') {
      // Show remind me button for expenses
      return (
        <View style={styles.leftActions}>
          <Animated.View
            style={[styles.remindAction, { transform: [{ scale }] }]}
          >
            <TouchableOpacity
              style={[styles.remindButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowReminderModal(true)}
              activeOpacity={0.8}
              disabled={!!existingReminder}
            >
              <Bell size={18} color={colors.surface} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    } else {
      // Show mark as paid button for income
      return (
        <View style={styles.leftActions}>
          <Animated.View
            style={[styles.markPaidAction, { transform: [{ scale }] }]}
          >
            <TouchableOpacity
              style={[
                styles.markPaidButton,
                { 
                  backgroundColor: transaction.isPaid ? colors.success : colors.primary 
                }
              ]}
              onPress={handleMarkPaid}
              activeOpacity={0.8}
            >
              {transaction.isPaid ? (
                <Check size={18} color={colors.surface} strokeWidth={2.5} />
              ) : (
                <DollarSign size={18} color={colors.surface} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }
  };

  const content = (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: colors.border },
        isLast && styles.lastItem,
      ]}
      onPress={handleEdit}
      activeOpacity={onEdit ? 0.7 : 1}
      disabled={!onEdit}
    >
      <View style={styles.leftContent}>
        <View
          style={[styles.categoryDot, { backgroundColor: categoryInfo.color }]}
        />
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.name, 
                { 
                  color: isPast ? colors.textSecondary : colors.text 
                }
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>

          </View>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {categoryInfo.name}
          </Text>
          {transaction.isPaid && (
            <View style={[styles.paidIndicator, { backgroundColor: colors.success }]}>
              <Check size={10} color={colors.surface} strokeWidth={2} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.rightContent}>
        <Text
          style={[
            styles.amount,
            transaction.type === 'income'
              ? { color: colors.income }
              : { color: isPast ? colors.textSecondary : colors.text },
            // Removed futureAmount style to keep upcoming expenses black
          ]}
        >
          {transaction.type === 'income' ? '+' : ''}${amount.toFixed(2)}
        </Text>
        <View style={styles.dateRow}>
          <Text
            style={[
              styles.date,
              { color: colors.textSecondary }, // Default grey color
              isToday && { color: colors.primary, fontWeight: '600' }, // Blue for today
              isFuture && !isToday && { color: colors.textSecondary }, // Grey for future dates (not today)
              isPast && { color: colors.textSecondary }, // Grey for past expenses
              type === 'income' && {
                color: colors.income,
                fontWeight: '600',
                fontSize: 12,
              },
            ]}
          >
            {formattedDate}
          </Text>
          {showActions && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButtonInline}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={colors.error} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {enableSwipeActions ? (
        <Swipeable
          renderRightActions={renderRightActions}
          renderLeftActions={enableLeftSwipe ? renderLeftActions : undefined}
          rightThreshold={30}
          leftThreshold={enableLeftSwipe ? 30 : undefined}
          friction={1.5}
          overshootRight={false}
          overshootLeft={enableLeftSwipe ? false : undefined}
          containerStyle={styles.swipeContainer}
        >
          <View
            style={[styles.contentContainer, { backgroundColor: colors.card }]}
          >
            {content}
          </View>
        </Swipeable>
      ) : (
        content
      )}

      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        actions={alertState.actions}
        onClose={hideAlert}
      />

      <ReminderReasonModal
        visible={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onSetReminder={handleSetReminder}
        transactionName={transaction.name}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm, // Reduced from md for tighter spacing
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '500',
    flex: 1,
  },

  category: {
    ...Typography.bodySmall, // Using new typography system
    marginTop: 2,
    fontWeight: '400',
  },
  paidIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    ...Typography.bodyMedium, // Using new typography system
    fontWeight: '600',
  },
  futureAmount: {
    opacity: 0.7,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  date: {
    ...Typography.caption, // Using new typography system
    fontWeight: '500',
  },
  deleteButtonInline: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  swipeContainer: {
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 70,
    paddingRight: Spacing.md,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 70,
    paddingLeft: Spacing.md,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  remindAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markPaidAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  remindButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markPaidButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
