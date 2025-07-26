import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import colors from '@/constants/colors';

export default function TestSchemaScreen() {
  const { addTransaction, addIncome } = useFinance();
  const { userId } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testTransactionWithPaySchedule = async () => {
    if (!userId) {
      addTestResult('❌ User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      addTestResult('🧪 Testing transaction with pay_schedule...');
      
      const testTransaction = {
        name: 'Test Income with Pay Schedule',
        amount: 1000,
        date: new Date().toISOString(),
        category: 'income' as const,
        type: 'income' as const,
        isRecurring: true,
        paySchedule: {
          cadence: 'every_2_weeks' as const,
          lastPaidDate: new Date().toISOString()
        }
      };

      await addTransaction(testTransaction);
      addTestResult('✅ Transaction with pay_schedule saved successfully!');
    } catch (error: any) {
      addTestResult(`❌ Transaction test failed: ${error.message || 'Unknown error'}`);
      console.error('Transaction test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testTransactionWithGivenExpenseSchedule = async () => {
    if (!userId) {
      addTestResult('❌ User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      addTestResult('🧪 Testing transaction with given_expense_schedule...');
      
      const testTransaction = {
        name: 'Test Given Expense',
        amount: 200,
        date: new Date().toISOString(),
        category: 'given_expenses' as const,
        type: 'expense' as const,
        isRecurring: true,
        givenExpenseSchedule: {
          frequency: 'every_week' as const,
          startDate: new Date().toISOString()
        }
      };

      await addTransaction(testTransaction);
      addTestResult('✅ Transaction with given_expense_schedule saved successfully!');
    } catch (error: any) {
      addTestResult(`❌ Given expense test failed: ${error.message || 'Unknown error'}`);
      console.error('Given expense test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testIncomeWithPaySchedule = async () => {
    if (!userId) {
      addTestResult('❌ User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      addTestResult('🧪 Testing income with pay_schedule...');
      
      const testIncome = {
        name: 'Test Salary',
        amount: 2500,
        frequency: 'bi_weekly' as const,
        startDate: new Date().toISOString(),
        endDate: undefined,
        isActive: true,
        paySchedule: {
          cadence: 'every_2_weeks' as const,
          lastPaidDate: new Date().toISOString()
        }
      };

      await addIncome(testIncome);
      addTestResult('✅ Income with pay_schedule saved successfully!');
    } catch (error: any) {
      addTestResult(`❌ Income test failed: ${error.message || 'Unknown error'}`);
      console.error('Income test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addTestResult('🚀 Starting schema validation tests...');
    
    await testTransactionWithPaySchedule();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    await testTransactionWithGivenExpenseSchedule();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    await testIncomeWithPaySchedule();
    
    addTestResult('🏁 All tests completed!');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Schema Test',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Database Schema Test</Text>
          <Text style={styles.subtitle}>
            This screen tests if the Supabase database has the correct schema with pay_schedule and given_expense_schedule columns.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={runAllTests}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={clearResults}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.individualTests}>
          <Text style={styles.sectionTitle}>Individual Tests:</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={testTransactionWithPaySchedule}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Transaction + Pay Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={testTransactionWithGivenExpenseSchedule}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Given Expense Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={testIncomeWithPaySchedule}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Income + Pay Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Test Results:</Text>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No tests run yet. Click "Run All Tests" to start.</Text>
          ) : (
            testResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultText}>{result}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>What this tests:</Text>
          <Text style={styles.infoText}>• pay_schedule column in user_transactions table</Text>
          <Text style={styles.infoText}>• given_expense_schedule column in user_transactions table</Text>
          <Text style={styles.infoText}>• pay_schedule column in user_income table</Text>
          <Text style={styles.infoText}>• preferences column in app_users table (via auth)</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: colors.text,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  individualTests: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  noResults: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  resultItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  resultText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});