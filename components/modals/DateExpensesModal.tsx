import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/feedback/EmptyState';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';
import { Transaction } from '@/types/finance';

interface DateExpensesModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}

export default function DateExpensesModal({
  visible,
  onClose,
  selectedDate,
}: DateExpensesModalProps) {
  const { transactions } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  // Get expenses for the selected date (including recurring)
  const dateExpenses = React.useMemo(() => {
    if (!selectedDate) return [];

    const expenses: Transaction[] = [];

    transactions.forEach(transaction => {
      if (transaction.type !== 'expense') return;

      const transactionDate = new Date(transaction.date);

      // Check if this is a one-time expense on this exact date
      if (
        transactionDate.getDate() === selectedDate.getDate() &&
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getFullYear() === selectedDate.getFullYear()
      ) {
        expenses.push(transaction);
        return;
      }

      // Check if this is a recurring expense that should appear on this date
      if (
        transaction.isRecurring &&
        transaction.category !== 'given_expenses'
      ) {
        const dayOfMonth = transactionDate.getDate();
        if (dayOfMonth === selectedDate.getDate()) {
          expenses.push(transaction);
        }
      }
    });

    return expenses;
  }, [transactions, selectedDate]);

  // Format date for display
  const formattedDate = selectedDate?.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate total for the day
  const totalForDay = dateExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  if (!selectedDate) return null;

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
      transparent={false}
      statusBarTranslucent={false}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>
                Daily Expenses
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {formattedDate}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.cardSecondary },
              ]}
              activeOpacity={0.7}
              testID='close-date-modal-button'
              accessibilityLabel='Close modal'
            >
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={[styles.content, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={[
              styles.scrollContent,
              { backgroundColor: colors.background },
            ]}
          >
            {dateExpenses.length > 0 ? (
              <>
                {/* Summary */}
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: colors.cardSecondary },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Total for {selectedDate.getDate()}
                  </Text>
                  <Text style={[styles.summaryAmount, { color: colors.error }]}>
                    ${totalForDay.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.summaryCount,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {dateExpenses.length} expense
                    {dateExpenses.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Expense List */}
                <View style={styles.expenseList}>
                  {dateExpenses.map((expense, index) => (
                    <TransactionItem
                      key={expense.id}
                      transaction={expense}
                      isLast={index === dateExpenses.length - 1}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <EmptyState
                  icon='history'
                  title='No expenses'
                  subtitle={`No expenses recorded for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  closeButton: {
    width: Math.max(40, SpacingValues.minTouchTarget),
    height: Math.max(40, SpacingValues.minTouchTarget),
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.modern,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    ...Typography.currency,
    marginBottom: Spacing.xs,
  },
  summaryCount: {
    ...Typography.bodySmall,
  },
  expenseList: {
    borderRadius: BorderRadius.modern,
    overflow: 'hidden',
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
