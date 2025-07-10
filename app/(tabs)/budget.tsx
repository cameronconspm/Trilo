import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import Header from '@/components/Header';
import Card from '@/components/Card';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

export default function BudgetScreen() {
  const router = useRouter();
  const { budget, transactions, isLoading } = useFinance();
  
  const givenExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    !t.isRecurring && 
    t.category !== 'one_time'
  );
  
  const oneTimeExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    !t.isRecurring && 
    t.category === 'one_time'
  );
  
  const recurringExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    t.isRecurring
  );

  const totalExpenses = budget.expenses.given + budget.expenses.oneTime + budget.expenses.recurring;
  const remainingIncome = budget.income - totalExpenses;
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Budget"
          subtitle="Monthly overview"
          showAddButton
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Header 
        title="Budget"
        subtitle="Monthly overview"
        showAddButton
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Monthly Income</Text>
              <Text style={styles.summaryValue}>
                ${budget.income > 0 ? budget.income.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>Remaining</Text>
            <Text style={[
              styles.remainingValue,
              remainingIncome < 0 && styles.negativeValue
            ]}>
              ${remainingIncome.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Given expenses</Text>
              <Text style={styles.breakdownValue}>${budget.expenses.given.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>One-time expenses</Text>
              <Text style={styles.breakdownValue}>${budget.expenses.oneTime.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Recurring expenses</Text>
              <Text style={styles.breakdownValue}>${budget.expenses.recurring.toFixed(2)}</Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Given Expenses</Text>
          <TouchableOpacity 
            onPress={() => router.push('/add-expense')}
            style={styles.addButton}
          >
            <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <Card>
          {givenExpenses.length > 0 ? (
            givenExpenses.map((expense, index) => (
              <TransactionItem 
                key={expense.id} 
                transaction={expense}
                isLast={index === givenExpenses.length - 1}
              />
            ))
          ) : (
            <EmptyState 
              title="No given expenses"
              subtitle="Add your first given expense to track your budget"
            />
          )}
        </Card>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>One-Time Expenses</Text>
          <TouchableOpacity 
            onPress={() => router.push('/add-expense')}
            style={styles.addButton}
          >
            <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <Card>
          {oneTimeExpenses.length > 0 ? (
            oneTimeExpenses.map((expense, index) => (
              <TransactionItem 
                key={expense.id} 
                transaction={expense}
                isLast={index === oneTimeExpenses.length - 1}
              />
            ))
          ) : (
            <EmptyState 
              title="No one-time expenses"
              subtitle="Track occasional purchases and unexpected costs"
            />
          )}
        </Card>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recurring Expenses</Text>
          <TouchableOpacity 
            onPress={() => router.push('/add-expense')}
            style={styles.addButton}
          >
            <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <Card>
          {recurringExpenses.length > 0 ? (
            recurringExpenses.map((expense, index) => (
              <TransactionItem 
                key={expense.id} 
                transaction={expense}
                isLast={index === recurringExpenses.length - 1}
              />
            ))
          ) : (
            <EmptyState 
              title="No recurring expenses"
              subtitle="Add subscriptions, bills, and regular payments"
            />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.inactive,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  remainingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
  },
  remainingLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  remainingValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  negativeValue: {
    color: Colors.error,
  },
  breakdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.light,
  },
});