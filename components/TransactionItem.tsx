import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { useAlert } from '@/hooks/useAlert';
import AlertModal from '@/components/AlertModal';
import categories from '@/constants/categories';
import { formatWeekAndDay } from '@/utils/dateUtils';

interface TransactionItemProps {
  transaction: Transaction;
  isLast?: boolean;
  showActions?: boolean;
}

export default function TransactionItem({ 
  transaction, 
  isLast = false, 
  showActions = false 
}: TransactionItemProps) {
  const { deleteTransaction } = useFinance();
  const { alertState, showAlert, hideAlert } = useAlert();
  const { name, amount, date, category, isRecurring, type, weekDay, weekNumber } = transaction;
  const categoryInfo = categories.find(c => c.id === category) || categories[0];
  
  // Format date
  const transactionDate = new Date(date);
  const today = new Date();
  const isToday = transactionDate.toDateString() === today.toDateString();
  const isFuture = transactionDate > today;
  
  let formattedDate;
  
  // For income with weekly schedule, show the schedule format
  if (type === 'income' && weekDay && weekNumber) {
    formattedDate = formatWeekAndDay(weekNumber, weekDay);
  } else {
    // For expenses or income without weekly schedule, show regular date
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

  return (
    <>
      <View style={[styles.container, isLast && styles.lastItem]}>
        <View style={styles.leftContent}>
          <View style={[styles.categoryDot, { backgroundColor: categoryInfo.color }]} />
          <View style={styles.textContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              {isRecurring && (
                <View style={styles.recurringBadge}>
                  <Text style={styles.recurringText}>Recurring</Text>
                </View>
              )}
            </View>
            <Text style={styles.category}>{categoryInfo.name}</Text>
          </View>
        </View>
        <View style={styles.rightContent}>
          <Text style={[
            styles.amount, 
            transaction.type === 'income' ? styles.income : styles.expense,
            isFuture && styles.futureAmount
          ]}>
            {transaction.type === 'income' ? '+' : ''}${amount.toFixed(2)}
          </Text>
          <View style={styles.dateRow}>
            <Text style={[
              styles.date, 
              isFuture && styles.futureDate,
              type === 'income' && weekDay && weekNumber && styles.incomeSchedule
            ]}>
              {formattedDate}
            </Text>
            {showActions && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={Colors.error} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
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
    borderBottomColor: Colors.border,
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
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  recurringBadge: {
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  recurringText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  category: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '400',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  income: {
    color: Colors.income,
  },
  expense: {
    color: Colors.text,
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
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  futureDate: {
    color: Colors.primary,
    fontWeight: '600',
  },
  incomeSchedule: {
    color: Colors.income,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});