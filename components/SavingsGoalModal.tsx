import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Slider from '@/components/Slider';

interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  timeframeWeeks: number;
  createdAt: string;
}

interface SavingsGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: SavingsGoal) => void;
  editGoal?: SavingsGoal;
}

export default function SavingsGoalModal({
  visible,
  onClose,
  onSave,
  editGoal,
}: SavingsGoalModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [timeframeWeeks, setTimeframeWeeks] = useState(12);
  
  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setTargetAmount(editGoal.targetAmount.toString());
      setTimeframeWeeks(editGoal.timeframeWeeks);
    } else {
      setTitle('');
      setTargetAmount('');
      setTimeframeWeeks(12);
    }
  }, [editGoal, visible]);
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }
    
    const goal: SavingsGoal = {
      id: editGoal?.id || Date.now().toString(),
      title: title.trim(),
      targetAmount: amount,
      timeframeWeeks,
      createdAt: editGoal?.createdAt || new Date().toISOString(),
    };
    
    onSave(goal);
    onClose();
  };
  
  const weeklySavingsRequired = parseFloat(targetAmount) / timeframeWeeks || 0;
  const monthsEquivalent = Math.round((timeframeWeeks / 4.33) * 10) / 10;
  
  const formatWeeks = (weeks: number) => {
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {editGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.content}>
          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Goal Title</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Emergency Fund, Vacation, New Car"
                placeholderTextColor={colors.inactive}
                maxLength={50}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Target Amount</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0.00"
                placeholderTextColor={colors.inactive}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Slider
                value={timeframeWeeks}
                onValueChange={setTimeframeWeeks}
                minimumValue={1}
                maximumValue={52}
                step={1}
                label="Timeframe"
                formatValue={formatWeeks}
              />
              <Text style={[styles.timeframeNote, { color: colors.textSecondary }]}>
                ≈ {monthsEquivalent} months
              </Text>
            </View>
          </Card>
          
          {parseFloat(targetAmount) > 0 && (
            <Card style={styles.calculationCard}>
              <Text style={[styles.calculationTitle, { color: colors.text }]}>
                Weekly Savings Required
              </Text>
              <Text style={[styles.calculationValue, { color: colors.primary }]}>
                ${weeklySavingsRequired.toFixed(2)}
              </Text>
              <Text style={[styles.calculationNote, { color: colors.textSecondary }]}>
                Save this amount each week to reach your goal in {formatWeeks(timeframeWeeks)}
              </Text>
            </Card>
          )}
        </View>
        
        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="ghost"
            size="medium"
            style={styles.footerButton}
          />
          <Button
            title={editGoal ? 'Update Goal' : 'Create Goal'}
            onPress={handleSave}
            variant="primary"
            size="medium"
            style={styles.footerButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.light,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    lineHeight: 20,
    minHeight: 44,
  },
  timeframeNote: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  calculationCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  calculationValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  calculationNote: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButton: {
    flex: 1,
  },
});