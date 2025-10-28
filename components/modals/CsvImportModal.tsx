import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Pressable, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType, CategoryType } from '@/types/finance';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import AlertModal from './AlertModal';
import categories from '@/constants/categories';

interface CsvImportModalProps {
  visible: boolean;
  onClose: () => void;
}

// Simple CSV parser
function parseCSV(input: string): string[][] {
  const lines = input.split('\n').filter(line => line.trim() !== '');
  
  const rows = lines.map(line => {
    // Handle both comma and semicolon separators
    const separator = line.includes(';') ? ';' : ',';
    return line.split(separator).map(cell => {
      // Remove quotes and trim whitespace
      return cell.replace(/^["']|["']$/g, '').trim();
    });
  }).filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
  
  return rows;
}

export default function CsvImportModal({ visible, onClose }: CsvImportModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { addTransaction, transactions } = useFinance();

  const [step, setStep] = useState<'select' | 'preview'>('select');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedEntries, setImportedEntries] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ title: '', message: '', type: 'info' });

  // Reset modal state when it becomes visible
  useEffect(() => {
    if (visible) {
      resetModalState();
    }
  }, [visible]);

  const resetModalState = () => {
    setStep('select');
    setSelectedFile(null);
    setParsedData([]);
    setIsImporting(false);
    setImportedEntries([]);
    setShowAlert(false);
  };


  const openPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      
      if (result.canceled || !result.assets?.length) {
        return;
      }
      
      const uri = result.assets[0].uri;
      const res = await fetch(uri);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const text = await res.text();
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        Alert.alert('Import failed', 'CSV appears to be empty or could not be parsed.');
        return;
      }
      
      setSelectedFile(result.assets[0].name);
      setParsedData(parsed);
      
      // Parse preview data (first 5 entries)
      const previewEntries: string[] = [];
      for (let i = 1; i < Math.min(6, parsed.length); i++) {
        const row = parsed[i];
        try {
          const expenseName = row[0]?.trim();
          const amountStr = row[1]?.trim();
          const categoryStr = row[2]?.trim();
          
          if (expenseName && amountStr && categoryStr) {
            const cleanAmount = amountStr.replace(/[$,]/g, '');
            const amount = parseFloat(cleanAmount);
            if (!isNaN(amount) && amount > 0) {
              const category = mapCategoryToAppCategory(categoryStr);
              previewEntries.push(`${expenseName} - $${amount} - ${category}`);
            }
          }
        } catch (error) {
          // Skip invalid rows
        }
      }
      setImportedEntries(previewEntries);
      setStep('preview');
      
    } catch (e: any) {
      console.error('CSV import error:', e);
      Alert.alert('Import failed', `Unable to read the selected CSV file: ${e.message}`);
    }
  };

  const handleCancel = () => {
    resetModalState();
    onClose();
  };




  const handleConfirm = async () => {
    setIsImporting(true);
    
    try {
      // Process the CSV data and import expenses
      await importExpenses();
    } catch (error) {
      console.error('Import error:', error);
      setAlertConfig({
        title: 'Import Error',
        message: 'An error occurred during import. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setIsImporting(false);
    }
  };

  const importExpenses = async () => {
    try {
      let successCount = 0;
      let failedCount = 0;
      
      const initialTransactionCount = transactions?.length || 0;
      const totalRows = parsedData.length - 1; // Exclude header
      
      // Skip header row, process data rows
      for (let i = 1; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        try {
          // Map columns based on your CSV structure
          const expenseName = row[0]?.trim(); // Expense Name
          const amountStr = row[1]?.trim(); // Amount
          const categoryStr = row[2]?.trim(); // Category
          const dayOfMonthStr = row[3]?.trim(); // Day of Month
          const recurringStr = row[4]?.trim(); // Recurring
          
          // Validate required fields
          if (!expenseName || !amountStr || !categoryStr || !dayOfMonthStr) {
            failedCount++;
            continue;
          }
          
          // Parse amount (remove $ and commas)
          const cleanAmount = amountStr.replace(/[$,]/g, '');
          const amount = parseFloat(cleanAmount);
          if (isNaN(amount) || amount <= 0) {
            failedCount++;
            continue;
          }
          
          // Parse day of month
          const dayOfMonth = parseInt(dayOfMonthStr, 10);
          if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
            failedCount++;
            continue;
          }
          
          // Map category to app categories
          const category = mapCategoryToAppCategory(categoryStr);
          
          // Parse recurring (checkbox value)
          const isRecurring = recurringStr.toLowerCase().includes('true') || 
                             recurringStr.toLowerCase().includes('yes') || 
                             recurringStr.toLowerCase().includes('1') ||
                             recurringStr === 'TRUE';
          
          // Calculate the transaction date based on current month and day logic
          const transactionDate = calculateTransactionDate(dayOfMonth);
          
          // Create transaction data
          const transactionData = {
            name: expenseName,
            amount: amount,
            date: transactionDate.toISOString(),
            category: category as CategoryType,
            type: 'expense' as TransactionType,
            isRecurring: isRecurring,
          };
          
          try {
            // Add a timeout to prevent hanging
            const addTransactionPromise = addTransaction(transactionData);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Transaction add timeout')), 5000)
            );
            
            await Promise.race([addTransactionPromise, timeoutPromise]);
            
            successCount++;
          } catch (addError) {
            failedCount++;
            continue;
          }
          
        } catch (error) {
          failedCount++;
        }
      }
      
      const finalTransactionCount = transactions?.length || 0;
      
      // Show results
      if (successCount > 0) {
        // Close the CSV modal first
        onClose();
        resetModalState();
        
        // Show success modal
        setAlertConfig({
          title: 'Import Complete',
          message: `Successfully imported ${successCount} expenses${failedCount > 0 ? `\n${failedCount} failed` : ''}!`,
          type: 'success'
        });
        setShowAlert(true);
        return; // Success - don't throw error
      } else {
        setAlertConfig({
          title: 'Import Failed',
          message: 'No expenses were imported. Please check your CSV format.',
          type: 'error'
        });
        setShowAlert(true);
        throw new Error('No expenses were imported');
      }
      
    } catch (error) {
      console.error('Import process error:', error);
      setAlertConfig({
        title: 'Import Error',
        message: 'An error occurred during import. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
      throw error; // Re-throw to be caught by handleConfirm
    }
  };

  // Map CSV categories to app categories
  const mapCategoryToAppCategory = (csvCategory: string): string => {
    const category = csvCategory.toLowerCase().trim();
    
    // Map based on your app's category structure
    if (category.includes('subscription') || category.includes('subsc')) {
      return 'subscription';
    } else if (category.includes('bill') || category.includes('bills')) {
      return 'bill';
    } else if (category.includes('saving')) {
      return 'savings';
    } else if (category.includes('one') && category.includes('time')) {
      return 'one_time_expense';
    } else if (category.includes('given')) {
      return 'given_expenses';
    } else if (category.includes('debt')) {
      return 'debt';
    } else if (category.includes('income')) {
      return 'income';
    } else {
      return 'uncategorized';
    }
  };

  // Calculate transaction date based on day of month and current date logic
  const calculateTransactionDate = (dayOfMonth: number): Date => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentDay = now.getDate();
    
    // If the day of month is 15 days or more before current day, use next month
    if (dayOfMonth <= (currentDay - 15)) {
      // Use next month
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      
      // Ensure the day is valid for the target month
      const daysInTargetMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      const adjustedDay = Math.min(dayOfMonth, daysInTargetMonth);
      
      return new Date(nextYear, nextMonth, adjustedDay);
    } else {
      // Use current month
      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const adjustedDay = Math.min(dayOfMonth, daysInCurrentMonth);
      
      return new Date(currentYear, currentMonth, adjustedDay);
    }
  };


  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleCancel} />
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {step === 'select' && 'Import Expenses (CSV)'}
              {step === 'preview' && 'Preview Import'}
            </Text>
            
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, { backgroundColor: step === 'select' ? colors.primary : colors.border }]} />
              <View style={[styles.stepLine, { backgroundColor: step === 'preview' ? colors.primary : colors.border }]} />
              <View style={[styles.stepDot, { backgroundColor: step === 'preview' ? colors.primary : colors.border }]} />
            </View>
            
            {step === 'select' && (
              <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                Select a CSV file to import multiple expenses. Your file should contain columns for expense name, amount, category, and day of month.
              </Text>
            )}
            {step === 'preview' && (
              <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                Review your data before importing. Found {parsedData.length - 1} expenses to import.
              </Text>
            )}
          </View>

          {/* Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Step 1: Select File */}
            {step === 'select' && (
              <View style={styles.selectContent}>
                <View style={[styles.csvFormatHelp, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.helpTitle, { color: colors.text }]}>Expected CSV Format:</Text>
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                    • Name: Expense description{'\n'}
                    • Amount: Cost (e.g., 25.99){'\n'}
                    • Category: Expense type{'\n'}
                    • Day of Month: 1-31
                  </Text>
                </View>
              </View>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && (
              <ScrollView style={styles.previewScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.previewContent}>
                  <View style={[styles.fileInfo, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.fileInfoText, { color: colors.textSecondary }]}>
                      File: {selectedFile}
                    </Text>
                    <Text style={[styles.fileInfoText, { color: colors.textSecondary }]}>
                      Found {parsedData.length - 1} expenses to import
                    </Text>
                  </View>

                  {/* Sample Entries Preview */}
                  <View style={[styles.sampleSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sampleSectionTitle, { color: colors.text }]}>
                      Sample Entries:
                    </Text>
                    
                    <View style={[styles.sampleEntriesContainer, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                      {parsedData.slice(1, 6).map((row, index) => {
                        try {
                          const expenseName = row[0]?.trim();
                          const amountStr = row[1]?.trim();
                          const categoryStr = row[2]?.trim();
                          
                          if (expenseName && amountStr && categoryStr) {
                            const cleanAmount = amountStr.replace(/[$,]/g, '');
                            const amount = parseFloat(cleanAmount);
                            if (!isNaN(amount) && amount > 0) {
                              const category = mapCategoryToAppCategory(categoryStr);
                              const categoryInfo = categories.find(c => c.id === category) || categories[0];
                              
                              return (
                                <View key={index} style={styles.sampleExpenseItem}>
                                  <View style={styles.sampleExpenseLeft}>
                                    <View style={[styles.sampleExpenseDot, { backgroundColor: categoryInfo.color }]} />
                                    <View style={styles.sampleExpenseText}>
                                      <Text style={[styles.sampleExpenseName, { color: colors.text }]} numberOfLines={1}>
                                        {expenseName}
                                      </Text>
                                      <Text style={[styles.sampleExpenseCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {categoryInfo.name}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={[styles.sampleExpenseAmount, { color: colors.text }]}>
                                    ${amount.toFixed(2)}
                                  </Text>
                                </View>
                              );
                            }
                          }
                        } catch (error) {
                          // Skip invalid rows
                        }
                        return null;
                      }).filter(Boolean)}
                      {parsedData.length > 6 && (
                        <Text style={[styles.sampleMoreText, { color: colors.textSecondary }]}>
                          ...and {parsedData.length - 6} more expenses
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.footerButtons}>
              {step === 'select' && (
                <>
                  <TouchableOpacity
                    style={[styles.footerButton, { borderColor: colors.border, borderWidth: 1 }]}
                    onPress={handleCancel}
                  >
                    <Text style={[styles.footerButtonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.footerButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={openPicker}
                  >
                    <Text style={[styles.footerButtonText, { color: colors.background }]}>
                      Choose CSV File
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'preview' && (
                <>
                  <TouchableOpacity
                    style={[styles.footerButton, { borderColor: colors.border, borderWidth: 1 }]}
                    onPress={handleCancel}
                  >
                    <Text style={[styles.footerButtonText, { color: colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.footerButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleConfirm}
                  >
                    <Text style={[styles.footerButtonText, { color: colors.background }]}>
                      Import {parsedData.length - 1} Items
                    </Text>
                  </TouchableOpacity>
                </>
              )}


            </View>
          </View>
        </View>
      </View>
    </Modal>
    
    {/* AlertModal outside the main Modal */}
    <AlertModal
      visible={showAlert}
      title={alertConfig.title}
      message={alertConfig.message}
      type={alertConfig.type}
      actions={[
        {
          text: 'Dismiss',
          onPress: () => {
            setShowAlert(false);
            // Modal is already closed in import logic, just reset alert state
          }
        }
      ]}
      onClose={() => {
        setShowAlert(false);
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  instructionsText: {
    fontSize: 15,
    marginBottom: Spacing.md,
    lineHeight: 22,
    color: '#666',
  },
  body: {
    paddingHorizontal: Spacing.lg,
    maxHeight: 500,
  },
  selectContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    width: '100%',
  },
  uploadButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 48,
    marginBottom: Spacing.lg,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  csvFormatHelp: {
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: '100%',
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  confirmContent: {
    paddingVertical: Spacing.lg,
  },
  previewContent: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  previewScrollView: {
    maxHeight: 400,
    flex: 1,
  },
  fileInfo: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fileInfoText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  previewRow: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  previewText: {
    fontSize: 14,
  },
  moreRowsText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  importingContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  footer: {
    borderTopWidth: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  footerButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    borderWidth: 0,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  importingIndicator: {
    alignItems: 'center',
    width: '100%',
  },
  importingText: {
    fontSize: 14,
  },
  logContainer: {
    width: '100%',
    maxHeight: 300,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  logSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  entriesContainer: {
    marginTop: 12,
  },
  entriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  entryLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  entryTextContainer: {
    flex: 1,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  entryCategory: {
    fontSize: 12,
    fontWeight: '400',
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  sampleEntriesWrapper: {
    marginTop: 20,
  },
  sampleEntriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  sampleEntriesList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sampleEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sampleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  sampleText: {
    fontSize: 14,
    flex: 1,
    color: '#555',
    fontWeight: '500',
  },
  sampleMoreText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    color: '#888',
  },
  sampleSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sampleSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sampleEntriesContainer: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  sampleEntryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sampleEntryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  sampleEntryText: {
    fontSize: 12,
    flex: 1,
    color: '#555',
    fontWeight: '500',
  },
  sampleExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sampleExpenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sampleExpenseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  sampleExpenseText: {
    flex: 1,
  },
  sampleExpenseName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  sampleExpenseCategory: {
    fontSize: 13,
    fontWeight: '400',
  },
  sampleExpenseAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});






