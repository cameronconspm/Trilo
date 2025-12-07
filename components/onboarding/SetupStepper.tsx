import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, Typography } from '@/constants/spacing';
import { Check } from 'lucide-react-native';

interface SetupStepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function SetupStepper({ currentStep, totalSteps, stepLabels }: SetupStepperProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xxl,
      paddingVertical: Spacing.xl,
    },
    stepContainer: {
      flex: 1,
      alignItems: 'center',
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.innerCard,
      borderWidth: 2,
      borderColor: colors.border,
      marginBottom: Spacing.xs,
    },
    stepCircleActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    stepCircleCompleted: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    stepNumber: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
      fontSize: 14,
    },
    stepNumberActive: {
      color: '#FFFFFF',
    },
    stepNumberCompleted: {
      color: '#FFFFFF',
    },
    stepLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 11,
      minHeight: 28,
      maxWidth: 80,
    },
    stepLabelActive: {
      color: colors.text,
      fontWeight: '600',
    },
    connector: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.xs,
      marginTop: -Spacing.xl,
    },
    connectorActive: {
      backgroundColor: colors.primary,
    },
    connectorCompleted: {
      backgroundColor: colors.success,
    },
  });

  return (
    <View style={styles.container}>
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep + 1;
        const isCompleted = stepNumber < currentStep + 1;
        const showConnector = index < totalSteps - 1;

        return (
          <React.Fragment key={index}>
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}
              >
                {isCompleted ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                      isCompleted && styles.stepNumberCompleted,
                    ]}
                  >
                    {stepNumber}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {label}
              </Text>
            </View>
            {showConnector && (
              <View
                style={[
                  styles.connector,
                  (isActive || isCompleted) && styles.connectorActive,
                  isCompleted && styles.connectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

