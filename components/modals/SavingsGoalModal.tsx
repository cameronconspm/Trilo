import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
} from '@/constants/spacing';
import Button from '@/components/layout/Button';
import Card from '@/components/layout/Card';

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

  // Dynamic styles that need theme colors
  const dynamicStyles = StyleSheet.create({
    footer: {
      flexDirection: 'row',
      padding: 20, // ENFORCED: 20px padding
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12, // ENFORCED: 12pt spacing between buttons
      backgroundColor: colors.background,
    },
    resetButton: {
      flex: 1, // Responsive sizing - takes available space
      minWidth: 0, // Allow shrinking below content size
    },
    cancelButton: {
      flex: 1, // Responsive sizing - takes available space
      minWidth: 0, // Allow shrinking below content size
    },
    submitButton: {
      flex: 2, // Primary button gets more space
      minWidth: 0, // Allow shrinking below content size
    },
  });

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [timeUnit, setTimeUnit] = useState<'weeks' | 'months'>('months');
  const [timeframeValue, setTimeframeValue] = useState(12);
  
  // Slider state
  const sliderWidth = useRef(0);
  const sliderStartX = useRef(0);
  const timeframeValueRef = useRef(timeframeValue);
  const initialTouchX = useRef(0);

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setTargetAmount(editGoal.targetAmount.toString());
      // Convert weeks to months for display if editing
      const isWeeks = editGoal.timeframeWeeks <= 26; // 26 weeks = 6 months
      setTimeUnit(isWeeks ? 'weeks' : 'months');
      setTimeframeValue(isWeeks ? editGoal.timeframeWeeks : Math.round(editGoal.timeframeWeeks / 4.33));
    } else {
      setTitle('');
      setTargetAmount('');
      setTimeUnit('months');
      setTimeframeValue(12);
    }
  }, [editGoal, visible]);

  // Keep ref in sync with state
  useEffect(() => {
    timeframeValueRef.current = timeframeValue;
  }, [timeframeValue]);

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

    // Convert to weeks for storage
    const timeframeWeeks = timeUnit === 'months' 
      ? Math.round(timeframeValue * 4.33) 
      : timeframeValue;

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

  // Calculate savings required based on selected time unit
  const weeklySavingsRequired = timeUnit === 'months' 
    ? parseFloat(targetAmount) / (timeframeValue * 4.33) || 0
    : parseFloat(targetAmount) / timeframeValue || 0;

  // Calculate monthly savings required
  const monthlySavingsRequired = timeUnit === 'months' 
    ? parseFloat(targetAmount) / timeframeValue || 0
    : parseFloat(targetAmount) / (timeframeValue / 4.33) || 0;

  // Calculate breakdown
  const totalWeeks = timeUnit === 'months' ? Math.round(timeframeValue * 4.33) : timeframeValue;
  const totalMonths = timeUnit === 'months' ? timeframeValue : Math.round(timeframeValue / 4.33);
  const totalDays = totalWeeks * 7;

  const formatTimeframe = (value: number, unit: 'weeks' | 'months') => {
    if (unit === 'weeks') {
      return value === 1 ? '1 week' : `${value} weeks`;
    } else {
      return value === 1 ? '1 month' : `${value} months`;
    }
  };

  // Calculate slider value from x position
  const calculateValueFromPosition = (x: number) => {
    const maxValue = timeUnit === 'months' ? 60 : 26;
    const minValue = 1;
    const trackWidth = sliderWidth.current;
    if (trackWidth === 0) return timeframeValue;
    
    const clampedX = Math.max(0, Math.min(trackWidth, x));
    const normalizedValue = clampedX / trackWidth;
    const newValue = Math.round(minValue + normalizedValue * (maxValue - minValue));
    
    return Math.max(minValue, Math.min(maxValue, newValue));
  };

  // PanResponder for drag gestures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // If moved more than 10 pixels, treat as drag
          return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
        },
        onPanResponderGrant: (event) => {
          // Store the initial touch location for tap detection
          initialTouchX.current = event.nativeEvent.locationX;
          
          // Store the starting thumb position based on current value
          const maxValue = timeUnit === 'months' ? 60 : 26;
          const minValue = 1;
          if (sliderWidth.current === 0) return;
          const normalizedPosition = (timeframeValueRef.current - minValue) / (maxValue - minValue);
          sliderStartX.current = normalizedPosition * sliderWidth.current;
        },
        onPanResponderMove: (event, gestureState) => {
          // Calculate new position: start position + translation
          const newX = sliderStartX.current + gestureState.dx;
          const newValue = calculateValueFromPosition(newX);
          setTimeframeValue(newValue);
        },
        onPanResponderRelease: (event, gestureState) => {
          // Check if it was a tap (little movement) or drag
          if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
            // It's a tap - use the initial touch location
            const newValue = calculateValueFromPosition(initialTouchX.current);
            setTimeframeValue(newValue);
          } else {
            // It's a drag - use final position
            const newX = sliderStartX.current + gestureState.dx;
            const newValue = calculateValueFromPosition(newX);
            setTimeframeValue(newValue);
          }
        },
      }),
    [timeUnit]
  );

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
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

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Goal Title
              </Text>
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
                placeholder='e.g., Emergency Fund, Vacation, New Car'
                placeholderTextColor={colors.inactive}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Target Amount
              </Text>
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
                placeholder='0.00'
                placeholderTextColor={colors.inactive}
                keyboardType='numeric'
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Timeframe
              </Text>
              
              {/* Time Unit Selection */}
              <View style={styles.timeUnitSelector}>
                <TouchableOpacity
                  style={[
                    styles.timeUnitButton,
                    timeUnit === 'months' && styles.timeUnitButtonActive,
                    { borderColor: colors.border }
                  ]}
                  onPress={() => {
                    setTimeUnit('months');
                    setTimeframeValue(12); // Reset to default
                  }}
                >
                  <Calendar size={16} color={timeUnit === 'months' ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.timeUnitText,
                    { color: timeUnit === 'months' ? colors.primary : colors.textSecondary }
                  ]}>
                    Months
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.timeUnitButton,
                    timeUnit === 'weeks' && styles.timeUnitButtonActive,
                    { borderColor: colors.border }
                  ]}
                  onPress={() => {
                    setTimeUnit('weeks');
                    setTimeframeValue(12); // Reset to default
                  }}
                >
                  <Clock size={16} color={timeUnit === 'weeks' ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.timeUnitText,
                    { color: timeUnit === 'weeks' ? colors.primary : colors.textSecondary }
                  ]}>
                    Weeks
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Custom Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.sliderValue, { color: colors.primary }]}>
                    {formatTimeframe(timeframeValue, timeUnit)}
                  </Text>
                  <Text style={[styles.sliderRange, { color: colors.textSecondary }]}>
                    {timeUnit === 'months' ? '1-60 months' : '1-26 weeks'}
                  </Text>
                </View>
                
                <View
                  style={styles.sliderTrack}
                  onLayout={(event) => {
                    sliderWidth.current = event.nativeEvent.layout.width;
                  }}
                  {...panResponder.panHandlers}
                >
                  <View 
                    style={[
                      styles.sliderProgress, 
                      { 
                        width: `${(timeframeValue - 1) / (timeUnit === 'months' ? 59 : 25) * 100}%`,
                        backgroundColor: colors.primary 
                      }
                    ]} 
                  />
                  <View
                    style={[
                      styles.sliderThumb,
                      { 
                        backgroundColor: colors.primary,
                        left: `${(timeframeValue - 1) / (timeUnit === 'months' ? 59 : 25) * 100}%`
                      }
                    ]}
                  />
                </View>
                
                {/* Slider Labels */}
                <View style={styles.sliderLabels}>
                  <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                    {timeUnit === 'months' ? '1 month' : '1 week'}
                  </Text>
                  <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                    {timeUnit === 'months' ? '60 months' : '26 weeks'}
                  </Text>
                </View>
              </View>

              {/* Time Breakdown */}
              <View style={styles.breakdownContainer}>
                <Text style={[styles.breakdownTitle, { color: colors.textSecondary }]}>
                  Time Breakdown
                </Text>
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownValue, { color: colors.primary }]}>
                      {totalMonths}
                    </Text>
                    <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                      Months
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownValue, { color: colors.primary }]}>
                      {totalWeeks}
                    </Text>
                    <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                      Weeks
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownValue, { color: colors.primary }]}>
                      {totalDays}
                    </Text>
                    <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                      Days
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {parseFloat(targetAmount) > 0 && (
            <>
              <Card style={styles.calculationCard}>
                <Text style={[styles.calculationTitle, { color: colors.text }]}>
                  Weekly Savings Required
                </Text>
                <Text
                  style={[styles.calculationValue, { color: colors.primary }]}
                >
                  ${weeklySavingsRequired.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.calculationNote,
                    { color: colors.textSecondary },
                  ]}
                >
                  Save this amount each week to reach your goal in{' '}
                  {formatTimeframe(timeframeValue, timeUnit)}
                </Text>
              </Card>

              <Card style={styles.calculationCard}>
                <Text style={[styles.calculationTitle, { color: colors.text }]}>
                  Monthly Savings Required
                </Text>
                <Text
                  style={[styles.calculationValue, { color: colors.primary }]}
                >
                  ${monthlySavingsRequired.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.calculationNote,
                    { color: colors.textSecondary },
                  ]}
                >
                  Save this amount each month to reach your goal in{' '}
                  {formatTimeframe(timeframeValue, timeUnit)}
                </Text>
              </Card>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={dynamicStyles.footer}>
          <Button
            title='Reset'
            onPress={() => {
              setTitle('');
              setTargetAmount('');
              setTimeUnit('months');
              setTimeframeValue(12);
            }}
            variant='ghost'
            size='medium'
            disabled={false}
            style={dynamicStyles.resetButton}
            testID='reset-savings-goal-button'
            accessibilityLabel='Reset savings goal form'
          />
          <Button
            title='Cancel'
            onPress={onClose}
            variant='outline'
            size='medium'
            disabled={false}
            style={dynamicStyles.cancelButton}
            testID='cancel-savings-goal-button'
            accessibilityLabel='Cancel savings goal'
          />
          <Button
            title={editGoal ? 'Update Goal' : 'Create Goal'}
            onPress={handleSave}
            variant='primary'
            size='medium'
            disabled={!title.trim() || !targetAmount || parseFloat(targetAmount) <= 0}
            style={dynamicStyles.submitButton}
            testID='save-savings-goal-button'
            accessibilityLabel={editGoal ? 'Update savings goal' : 'Create savings goal'}
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
    paddingHorizontal: SpacingValues.screenHorizontal,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SpacingValues.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SpacingValues.screenHorizontal,
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
  // Time Unit Selector
  timeUnitSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeUnitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
  },
  timeUnitButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  timeUnitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Custom Slider
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sliderRange: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.full,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  sliderProgress: {
    height: '100%',
    borderRadius: BorderRadius.full,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    top: -8,
    left: 0, // Start at left, will be controlled by translateX
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Time Breakdown
  breakdownContainer: {
    marginTop: Spacing.md,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
});
