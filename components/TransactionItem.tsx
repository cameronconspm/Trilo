import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2, Edit3 } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { useAlert } from '@/hooks/useAlert';
import AlertModal from '@/components/AlertModal';
import categories from '@/constants/categories';
import { formatPaySchedule } from '@/utils/payScheduleUtils';

interface TransactionItemProps {
  transaction: Transaction;
  isLast?: boolean;
  showActions?: boolean;
  onEdit?: (transaction: Transaction) => void;
  enableSwipeActions?: boolean;
  isPastExpense?: boolean;
}

export default function TransactionItem({ 
  transaction, 
  isLast = false, 
  showActions = false,
  onEdit,
  enableSwipeActions = false,
  isPastExpense = false
}: TransactionItemProps) {
  const { deleteTransaction } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  const { name, amount, date, category, isRecurring, type, paySchedule, weekDay, weekNumber } = transaction;
  const categoryInfo = categories.find(c => c.id === category) || categories[0];
  
  // Format date
  const transactionDate = new Date(date);
  const today = new Date();
  const isToday = transactionDate.toDateString() === today.toDateString();
  const isFuture = transactionDate > today;
  
  let formattedDate;
  
  // For income with pay schedule, show the schedule format
  if (type === 'income' && paySchedule) {
    formattedDate = formatPaySchedule(paySchedule);
  } else if (type === 'income' && weekDay && weekNumber) {
    // Legacy format
    const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
    formattedDate = `Week ${weekNumber} ${capitalizedDay}`;
  } else {
    // For expenses or income without schedule, show regular date
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
          style: 'destructive'
        }
      ],
    });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const renderRightActions = (progress: Animated.AnimatedAddition<number>, dragX: Animated.AnimatedAddition<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
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

  const content = (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: colors.border }, isLast && styles.lastItem]}
      onPress={handleEdit}
      activeOpacity={onEdit ? 0.7 : 1}
      disabled={!onEdit}
    >
      <View style={styles.leftContent}>
        <View style={[styles.categoryDot, { backgroundColor: categoryInfo.color }]} />
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            {isRecurring && (
              <View style={[styles.recurringBadge, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.recurringText, { color: colors.textSecondary }]}>Recurring</Text>
              </View>
            )}
          </View>
          <Text style={[styles.category, { color: colors.textSecondary }]}>{categoryInfo.name}</Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <Text style={[
          styles.amount, 
          transaction.type === 'income' ? { color: colors.income } : { color: colors.text },
          isFuture && styles.futureAmount
        ]}>
          {transaction.type === 'income' ? '+' : ''}${amount.toFixed(2)}
        </Text>
        <View style={styles.dateRow}>
          <Text style={[
            styles.date, 
            { color: colors.textSecondary },
            isFuture && { color: colors.primary, fontWeight: '600' },
            type === 'income' && { color: colors.income, fontWeight: '600', fontSize: 12 }
          ]}>
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
          rightThreshold={30}
          friction={1.5}
          overshootRight={false}
          containerStyle={styles.swipeContainer}
        >
          <View style={[styles.contentContainer, { backgroundColor: colors.card }]}>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
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
    fontSize: 15, // Balanced name font
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  recurringBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  recurringText: {
    fontSize: 11,
    fontWeight: '600',
  },
  category: {
    fontSize: 13, // Balanced category font
    marginTop: 2,
    fontWeight: '400',
    lineHeight: 16,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15, // Balanced amount font
    fontWeight: '600',
    lineHeight: 18,
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
    fontSize: 12, // Balanced date font
    fontWeight: '500',
    lineHeight: 16,
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
  deleteAction: {
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
});