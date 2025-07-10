import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

export default function AddIncomeScreen() {
  const router = useRouter();
  const { addTransaction } = useFinance();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter an income source');
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
        category: 'income',
        date: new Date(date).toISOString(),
        type: 'income',
        isRecurring,
      });
      
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add income. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (name.trim() || amount.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard this income entry?',
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
          <View style={styles.incomeTypeContainer}>
            <Text style={styles.incomeTypeTitle}>Add Income Source</Text>
            <Text style={styles.incomeTypeSubtitle}>
              Track your salary, freelance work, or other income sources
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Income Source</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Salary, Freelance, Side Hustle"
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
              <Text style={styles.switchLabel}>Recurring Income</Text>
              <Text style={styles.switchSubtitle}>
                {isRecurring ? 'This income repeats regularly (recommended for salary)' : 'One-time income (bonuses, gifts, etc.)'}
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor={Colors.card}
            />
          </View>
          
          {isRecurring && (
            <View style={styles.recurringNote}>
              <Text style={styles.recurringNoteText}>
                💡 Recurring income helps with accurate budget planning and weekly overviews
              </Text>
            </View>
          )}
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
          title="Add Income"
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
  incomeTypeContainer: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    ...Shadow.light,
  },
  incomeTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  incomeTypeSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    color: Colors.success,
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
    lineHeight: 20,
  },
  recurringNote: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  recurringNoteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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