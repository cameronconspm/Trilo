import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

export default function AddSavingsGoalScreen() {
  const router = useRouter();
  const { addSavingsGoal } = useFinance();
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [timeToSave, setTimeToSave] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a goal name');
      return;
    }
    
    const numTargetAmount = parseFloat(targetAmount);
    if (!targetAmount || isNaN(numTargetAmount) || numTargetAmount <= 0) {
      Alert.alert('Invalid Target Amount', 'Please enter a valid target amount greater than 0');
      return;
    }
    
    const numCurrentAmount = parseFloat(currentAmount);
    if (isNaN(numCurrentAmount) || numCurrentAmount < 0) {
      Alert.alert('Invalid Current Amount', 'Please enter a valid current amount (0 or greater)');
      return;
    }
    
    if (numCurrentAmount > numTargetAmount) {
      Alert.alert('Invalid Amount', 'Current amount cannot be greater than target amount');
      return;
    }
    
    const numTimeToSave = parseInt(timeToSave);
    if (!timeToSave || isNaN(numTimeToSave) || numTimeToSave <= 0) {
      Alert.alert('Invalid Time Frame', 'Please enter a valid number of months to save');
      return;
    }
    
    // Validate target date if provided
    let parsedTargetDate: Date | undefined;
    if (targetDate.trim()) {
      parsedTargetDate = new Date(targetDate);
      if (isNaN(parsedTargetDate.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid target date in YYYY-MM-DD format');
        return;
      }
      
      // Check if target date is in the future
      if (parsedTargetDate <= new Date()) {
        Alert.alert('Invalid Date', 'Target date must be in the future');
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await addSavingsGoal({
        name: name.trim(),
        targetAmount: numTargetAmount,
        currentAmount: numCurrentAmount,
        timeToSave: numTimeToSave,
        createdDate: new Date().toISOString(),
        targetDate: parsedTargetDate?.toISOString(),
      });
      
      // Show success message
      Alert.alert(
        'Savings Goal Added',
        `${name} with target of $${numTargetAmount.toFixed(2)} has been added successfully.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Add savings goal error:', error);
      const errorMessage = error?.message || 'Failed to add savings goal. Please check your connection and try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage, [
        { text: 'Retry', onPress: () => handleSubmit() },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (name.trim() || targetAmount.trim() || currentAmount !== '0') {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard this savings goal?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const formatAmount = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };
  
  const formatMonths = (text: string) => {
    // Only allow positive integers
    return text.replace(/[^0-9]/g, '');
  };
  
  // Calculate monthly savings needed
  const monthlyNeeded = () => {
    const target = parseFloat(targetAmount) || 0;
    const current = parseFloat(currentAmount) || 0;
    const months = parseInt(timeToSave) || 1;
    
    if (target <= current) return 0;
    return (target - current) / months;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.goalTypeContainer}>
            <Text style={styles.goalTypeTitle}>Add Savings Goal</Text>
            <Text style={styles.goalTypeSubtitle}>
              Set a savings target and track your progress towards achieving your financial goals
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Goal Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Emergency Fund, Vacation, New Car"
              placeholderTextColor={Colors.inactive}
              returnKeyType="next"
              autoCapitalize="words"
              maxLength={50}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Target Amount *</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={targetAmount}
                onChangeText={(text) => setTargetAmount(formatAmount(text))}
                placeholder="0.00"
                placeholderTextColor={Colors.inactive}
                keyboardType="decimal-pad"
                returnKeyType="next"
                maxLength={10}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={currentAmount}
                onChangeText={(text) => setCurrentAmount(formatAmount(text))}
                placeholder="0.00"
                placeholderTextColor={Colors.inactive}
                keyboardType="decimal-pad"
                returnKeyType="next"
                maxLength={10}
              />
            </View>
            <Text style={styles.helperText}>
              How much you have already saved towards this goal
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Time to Save (Months) *</Text>
            <TextInput
              style={styles.input}
              value={timeToSave}
              onChangeText={(text) => setTimeToSave(formatMonths(text))}
              placeholder="12"
              placeholderTextColor={Colors.inactive}
              keyboardType="number-pad"
              returnKeyType="next"
              maxLength={3}
            />
            <Text style={styles.helperText}>
              How many months you want to take to reach this goal
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Target Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.inactive}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.helperText}>
              When you want to achieve this goal
            </Text>
          </View>
          
          {/* Monthly Savings Calculator */}
          {targetAmount && timeToSave && (
            <View style={styles.calculatorContainer}>
              <Text style={styles.calculatorTitle}>Monthly Savings Needed</Text>
              <Text style={styles.calculatorAmount}>
                ${monthlyNeeded().toFixed(2)}
              </Text>
              <Text style={styles.calculatorSubtitle}>
                To reach your goal in {timeToSave} months
              </Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
          
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💡 Break down large goals into smaller, manageable monthly targets to stay motivated
            </Text>
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
          title="Add Savings Goal"
          onPress={handleSubmit}
          variant="primary"
          size="large"
          loading={isLoading}
          disabled={!name.trim() || !targetAmount || !timeToSave || parseFloat(targetAmount) <= 0}
          style={styles.submitButton}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 24,
    paddingBottom: 30,
  },
  keyboardView: {
    flex: 1,
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
  goalTypeContainer: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadow.light,
  },
  goalTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  goalTypeSubtitle: {
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
  helperText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '500',
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
  calculatorContainer: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  calculatorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  calculatorAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  calculatorSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tipContainer: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tipText: {
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
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
    fontWeight: '500',
  },
});