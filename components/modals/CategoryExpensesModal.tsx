import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';
import { Transaction, CategoryType } from '@/types/finance';
import categories from '@/constants/categories';
import TransactionItem from '@/components/TransactionItem';

interface CategoryExpensesModalProps {
  visible: boolean;
  onClose: () => void;
  category: CategoryType;
  expenses: Transaction[];
}

export default function CategoryExpensesModal({
  visible,
  onClose,
  category,
  expenses,
}: CategoryExpensesModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const categoryInfo = categories.find(c => c.id === category) || categories[0];

  // Sort expenses by day of month, ascending
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dayA = new Date(a.date).getDate();
    const dayB = new Date(b.date).getDate();
    return dayA - dayB;
  });

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <View style={styles.titleContainer}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: categoryInfo.color },
                ]}
              />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {categoryInfo.name}
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {expenses.length}{' '}
                  {expenses.length === 1 ? 'expense' : 'expenses'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.cardSecondary },
              ]}
              activeOpacity={0.7}
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
            {sortedExpenses.length > 0 ? (
              sortedExpenses.map((expense, index) => (
                <TransactionItem
                  key={expense.id}
                  transaction={expense}
                  isLast={index === sortedExpenses.length - 1}
                  onEdit={() => {
                    // Handle edit if needed
                    onClose();
                  }}
                  enableSwipeActions={false}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No expenses in this category
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Expenses for {categoryInfo.name} will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  titleContainer: {
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
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
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});
