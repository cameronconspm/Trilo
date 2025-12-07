import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useTutorial } from '@/context/TutorialContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const SETUP_STORAGE_KEY_PREFIX = '@trilo:setup_completed_';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function TooltipOverlay() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { isActive, currentStep, steps, nextStep, previousStep, completeTutorial } = useTutorial();
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleComplete = async () => {
    await completeTutorial();
    
    // Check if setup is needed
    if (user) {
      const setupKey = `${SETUP_STORAGE_KEY_PREFIX}${user.id}`;
      const setupCompleted = await AsyncStorage.getItem(setupKey);
      
      if (setupCompleted !== 'true') {
        router.replace('/setup');
      }
    }
  };

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (isActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, fadeAnim]);

  if (!isActive || !currentStepData) {
    return null;
  }

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    tooltipContainer: {
      position: 'absolute',
      bottom: 100,
      left: Spacing.xxl,
      right: Spacing.xxl,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      ...Shadow.heavy,
    },
    tooltipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    tooltipTitle: {
      ...Typography.h3,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.md,
    },
    tooltipClose: {
      padding: Spacing.xs,
    },
    tooltipDescription: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
      lineHeight: 22,
    },
    tooltipFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    progressDotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      minHeight: 44,
    },
    buttonSecondary: {
      backgroundColor: colors.innerCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      ...Typography.bodyMedium,
      color: '#FFFFFF',
    },
    buttonTextSecondary: {
      color: colors.text,
    },
  });

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="fade"
      onRequestClose={handleComplete}
    >
      <Animated.View style={[styles.modal, { opacity: fadeAnim }]}>
        <View style={styles.overlay} />
        
        <View style={styles.tooltipContainer}>
          <View style={styles.tooltipHeader}>
            <Text style={styles.tooltipTitle}>{currentStepData.title}</Text>
            <TouchableOpacity
              style={styles.tooltipClose}
              onPress={handleComplete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tooltipDescription}>
            {currentStepData.description}
          </Text>

          <View style={styles.tooltipFooter}>
            <View style={styles.progressContainer}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={previousStep}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={colors.text} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.button}
                onPress={isLastStep ? handleComplete : nextStep}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {isLastStep ? 'Get Started' : 'Next'}
                </Text>
                {!isLastStep && (
                  <ChevronRight size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

