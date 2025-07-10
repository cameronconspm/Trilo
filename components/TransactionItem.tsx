import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Transaction } from '@/types/finance';
import categories from '@/constants/categories';

interface TransactionItemProps {
  transaction: Transaction;
  isLast?: boolean;
}

export default function TransactionItem({ transaction, isLast = false }: TransactionItemProps) {
  const { name, amount, date, category } = transaction;
  const categoryInfo = categories.find(c => c.id === category) || categories[0];
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, isLast && styles.lastItem]}>
      <View style={styles.leftContent}>
        <View style={[styles.categoryDot, { backgroundColor: categoryInfo.color }]} />
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.category}>{categoryInfo.name}</Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <Text style={[
          styles.amount, 
          transaction.type === 'income' ? styles.income : styles.expense
        ]}>
          {transaction.type === 'income' ? '+' : ''}${amount.toFixed(2)}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </View>
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
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
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
    color: Colors.success,
  },
  expense: {
    color: Colors.text,
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
});