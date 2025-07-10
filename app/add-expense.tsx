import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import categories from '@/constants/categories';
import { CategoryType } from '@/types/finance';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { addTransaction } = useFinance();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('one_time');
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an expense name');
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    addTransaction({
      name: name.trim(),
      amount: numAmount,
      category,
      date: new Date(date).toISOString(),
      type: 'expense',
      isRecurring,
    });
    
    router.back();
  };
  
  const expenseCategories = categories.filter(c => 
    c.id !== 'income' && c.id !== 'savings'
  );
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Expense Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter expense name"
            placeholderTextColor={Colors.inactive}
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.inactive}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {expenseCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && { 
                    backgroundColor: cat.color, 
                    borderColor: cat.color,
                    ...Shadow.light,
                  }
                ]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.id && { color: Colors.card }
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.inactive}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>Recurring Expense</Text>
            <Text style={styles.switchSubtitle}>
              {isRecurring ? 'This expense repeats monthly' : 'One-time expense'}
            </Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.card}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Add Expense</Text>
        </TouchableOpacity>
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
    padding: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    ...Shadow.light,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.md,
    ...Shadow.light,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: 0,
    fontSize: 16,
    color: Colors.text,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    margin: Spacing.xs,
    backgroundColor: Colors.card,
    ...Shadow.light,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadow.light,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  switchSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.medium,
  },
  submitButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});