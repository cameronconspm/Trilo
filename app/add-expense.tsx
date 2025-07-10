import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import CategoryPicker from '@/components/CategoryPicker';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { CategoryType } from '@/types/finance';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { addTransaction } = useFinance();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('miscellaneous');
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter an expense name');
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    
    setIsLoading(true);
    
    try {
      addTransaction({
        name: name.trim(),
        amount: numAmount,
        category,
        date: new Date(date).toISOString(),
        type: 'expense',
        isRecurring,
      });
      
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (name.trim() || amount.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard this expense?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Expense Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter expense name"
              placeholderTextColor={Colors.inactive}
              returnKeyType="next"
              autoCapitalize="words"
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
          
          <CategoryPicker
            selectedCategory={category}
            onCategorySelect={setCategory}
            excludeCategories={['income']}
            label="Category"
          />
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.inactive}
              keyboardType="numbers-and-punctuation"
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
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          size="large"
          style={styles.cancelButton}
        />
        <Button
          title="Add Expense"
          onPress={handleSubmit}
          variant="primary"
          size="large"
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
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
    flexGrow: 1,
  },
  formContainer: {
    padding: Spacing.screenHorizontal,
    paddingBottom: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    ...Shadow.light,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.lg,
    ...Shadow.light,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    padding: Spacing.lg,
    paddingLeft: 0,
    fontSize: 17,
    color: Colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.light,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  switchSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.screenHorizontal,
    paddingBottom: Platform.OS === 'ios' ? Spacing.screenBottom : Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});