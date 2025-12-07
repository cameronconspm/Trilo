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
import Card from '@/components/layout/Card';
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

  // Get income for the selected date (including recurring)
  const dateIncome = React.useMemo(() => {
    if (!selectedDate) return [];

    const income: Transaction[] = [];

    transactions.forEach(transaction => {
      if (transaction.type !== 'income') return;

      const transactionDate = new Date(transaction.date);

      // Check if this is a one-time income on this exact date
      if (
        transactionDate.getDate() === selectedDate.getDate() &&
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getFullYear() === selectedDate.getFullYear()
      ) {
        income.push(transaction);
        return;
      }

      // Check if this is recurring income that should appear on this date
      if (transaction.isRecurring && transaction.paySchedule) {
        const paySchedule = transaction.paySchedule;

        // Weekly income
        if (paySchedule.cadence === 'weekly') {
          const lastPaidDate = new Date(paySchedule.lastPaidDate);
          const daysSinceLastPaid = Math.floor(
            (selectedDate.getTime() - lastPaidDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastPaid >= 0 && daysSinceLastPaid % 7 === 0) {
            income.push(transaction);
          }
        }
        // Every 2 weeks income
        else if (paySchedule.cadence === 'every_2_weeks') {
          const lastPaidDate = new Date(paySchedule.lastPaidDate);
          const daysSinceLastPaid = Math.floor(
            (selectedDate.getTime() - lastPaidDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastPaid >= 0 && daysSinceLastPaid % 14 === 0) {
            income.push(transaction);
          }
        }
        // Twice a month income
        else if (
          paySchedule.cadence === 'twice_monthly' &&
          paySchedule.monthlyDays
        ) {
          if (paySchedule.monthlyDays.includes(selectedDate.getDate())) {
            income.push(transaction);
          }
        }
        // Monthly income
        else if (paySchedule.cadence === 'monthly') {
          const lastPaidDate = new Date(paySchedule.lastPaidDate);
          if (selectedDate.getDate() === lastPaidDate.getDate()) {
            income.push(transaction);
          }
        }
        // Custom income
        else if (paySchedule.cadence === 'custom' && paySchedule.customDays) {
          if (paySchedule.customDays.includes(selectedDate.getDate())) {
            income.push(transaction);
          }
        }
      }
    });

    return income;
  }, [transactions, selectedDate]);

  // Format date for display
  const formattedDate = selectedDate?.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate totals for the day
  const totalExpenses = dateExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const totalIncome = dateIncome.reduce(
    (sum, income) => sum + income.amount,
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
                Daily Transactions
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
            {dateIncome.length > 0 || dateExpenses.length > 0 ? (
              <>
                {/* Expected Income Section */}
                {dateIncome.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Expected Income
                      </Text>
                      <Text style={[styles.sectionTotal, { color: colors.text }]}>
                        ${totalIncome.toFixed(2)}
                      </Text>
                    </View>
                    <Card variant="default">
                      {dateIncome.map((income, index) => (
                        <TransactionItem
                          key={income.id}
                          transaction={income}
                          isLast={index === dateIncome.length - 1}
                        />
                      ))}
                    </Card>
                  </>
                )}

                {/* Expenses Section */}
                {dateExpenses.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Expenses
                      </Text>
                      <Text style={[styles.sectionTotal, { color: colors.textSecondary }]}>
                        ${totalExpenses.toFixed(2)}
                      </Text>
                    </View>
                    <Card variant="default">
                      {dateExpenses.map((expense, index) => (
                        <TransactionItem
                          key={expense.id}
                          transaction={expense}
                          isLast={index === dateExpenses.length - 1}
                        />
                      ))}
                    </Card>
                  </>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <EmptyState
                  icon='history'
                  title='No transactions'
                  subtitle={`No expenses or income recorded for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
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
    ...Typography.h3,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodyMedium,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h2,
    flex: 1,
  },
  sectionTotal: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
