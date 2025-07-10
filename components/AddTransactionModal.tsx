import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Switch, 
  Alert, 
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { X } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import CategoryPicker from '@/components/CategoryPicker';
import DayPicker from '@/components/DayPicker';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { CategoryType, TransactionType } from '@/types/finance';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
  const { addTransaction } = useFinance();
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('miscellaneous');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [isLoading, setIsLoading] = useState(false);
  
  const slideAnim = useState(new Animated.Value(screenHeight))[0];
  
  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  React.useEffect(() => {
    if (transactionType === 'income') {
      setCategory('income');
      setIsRecurring(true);
    } else {
      setCategory('miscellaneous');
      setIsRecurring(false);
    }
  }, [transactionType]);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', `Please enter a ${transactionType} name`);
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create date for the selected day in current month
      const today = new Date();
      const transactionDate = new Date(today.getFullYear(), today.getMonth(), selectedDay);
      
      await addTransaction({
        name: name.trim(),
        amount: numAmount,
        category,
        date: transactionDate.toISOString(),
        type: transactionType,
        isRecurring,
      });
      
      // Reset form
      setName('');
      setAmount('');
      setSelectedDay(new Date().getDate());
      
      Alert.alert(
        'Success',
        `${transactionType === 'income' ? 'Income' : 'Expense'} added successfully!`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to add ${transactionType}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (name.trim() || amount.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard this transaction?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.dragHandle} />
              <View style={styles.headerContent}>
                <Text style={styles.title}>Add Transaction</Text>
                <TouchableOpacity 
                  onPress={handleClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <X size={24} color={Colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Transaction Type Toggle */}
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'expense' && styles.typeButtonActive
                  ]}
                  onPress={() => setTransactionType('expense')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'income' && styles.typeButtonActive
                  ]}
                  onPress={() => setTransactionType('income')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.typeButtonTextActive
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {transactionType === 'income' ? 'Income Source' : 'Expense Name'} *
                </Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={transactionType === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Groceries, Netflix'}
                  placeholderTextColor={Colors.inactive}
                  returnKeyType="next"
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount *</Text>
                <View style={styles.amountContainer}>
                  <Text style={[
                    styles.currencySymbol,
                    { color: transactionType === 'income' ? Colors.success : Colors.text }
                  ]}>
                    $
                  </Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => setAmount(formatAmount(text))}
                    placeholder="0.00"
                    placeholderTextColor={Colors.inactive}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    maxLength={10}
                  />
                </View>
              </View>
              
              {transactionType === 'expense' && (
                <CategoryPicker
                  selectedCategory={category}
                  onCategorySelect={setCategory}
                  excludeCategories={['income']}
                  label="Category *"
                />
              )}
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Day of Month *</Text>
                <DayPicker
                  selectedDay={selectedDay}
                  onDaySelect={setSelectedDay}
                />
              </View>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>
                    {transactionType === 'income' ? 'Recurring Income' : 'Recurring Expense'}
                  </Text>
                  <Text style={styles.switchSubtitle}>
                    {transactionType === 'income' 
                      ? (isRecurring 
                          ? 'This income repeats monthly (salary, pension)' 
                          : 'One-time income (bonus, gift, freelance project)')
                      : (isRecurring 
                          ? 'This expense repeats monthly (subscriptions, bills)' 
                          : 'One-time expense (purchases, dining out)')
                    }
                  </Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ 
                    false: Colors.border, 
                    true: transactionType === 'income' ? Colors.success : Colors.primary 
                  }}
                  thumbColor={Colors.card}
                />
              </View>
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="outline"
                size="large"
                style={styles.cancelButton}
              />
              <Button
                title={`Add ${transactionType === 'income' ? 'Income' : 'Expense'}`}
                onPress={handleSubmit}
                variant="primary"
                size="large"
                loading={isLoading}
                disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
                style={styles.submitButton}
              />
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: screenHeight * 0.9,
    ...Shadow.heavy,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  typeButtonActive: {
    backgroundColor: Colors.card,
    ...Shadow.light,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.text,
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
    marginBottom: Spacing.xl,
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
  footer: {
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