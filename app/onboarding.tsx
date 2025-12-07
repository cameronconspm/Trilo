import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import {
  Wallet,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_STORAGE_KEY = '@trilo:onboarding_completed';

interface OnboardingPage {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}

const onboardingPages: OnboardingPage[] = [
  {
    icon: Wallet,
    title: 'Take Control of Your Finances',
    description:
      'Trilo helps you track your income, expenses, and budget in one simple app. Build better financial habits and achieve your goals.',
  },
  {
    icon: BarChart3,
    title: 'Track Your Budget',
    description:
      'Monitor your spending across categories, set budgets, and get insights into where your money goes. Stay on top of your finances effortlessly.',
  },
  {
    icon: TrendingUp,
    title: 'Earn Points & Level Up',
    description:
      'Complete challenges, track your progress, and earn points as you build better financial habits. Watch your financial health improve over time.',
  },
  {
    icon: Sparkles,
    title: 'Build Long-Term Success',
    description:
      'Set savings goals, track milestones, and celebrate achievements. Trilo makes managing money engaging and rewarding.',
  },
];

export default function OnboardingFlow() {
  const [currentPage, setCurrentPage] = useState(0);
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    pageContainer: {
      width: SCREEN_WIDTH,
      flex: 1,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xxl,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.xxl,
      paddingBottom: Spacing.xxxl,
      gap: Spacing.md,
    },
    skipButton: {
      flex: 1,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      backgroundColor: colors.innerCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skipButtonText: {
      ...Typography.bodyMedium,
      color: colors.textSecondary,
    },
    nextButton: {
      flex: 2,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      gap: Spacing.xs,
      ...Shadow.light,
    },
    nextButtonText: {
      ...Typography.bodyMedium,
      color: '#FFFFFF',
    },
    getStartedButton: {
      flex: 1,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      gap: Spacing.xs,
      ...Shadow.light,
    },
    getStartedButtonText: {
      ...Typography.bodyMedium,
      color: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: Spacing.xxl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
  });

  const handleNext = () => {
    if (currentPage < onboardingPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      router.replace('/signin');
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
      router.replace('/signin');
    }
  };

  const isLastPage = currentPage === onboardingPages.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        {currentPage > 0 && (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentOffset={{ x: currentPage * SCREEN_WIDTH, y: 0 }}
      >
        {onboardingPages.map((page, index) => (
          <View key={index} style={styles.pageContainer}>
            <OnboardingScreen
              icon={page.icon}
              title={page.title}
              description={page.description}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {onboardingPages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentPage && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        {currentPage > 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={isLastPage ? styles.getStartedButton : styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastPage ? 'Get Started' : 'Next'}
          </Text>
          {!isLastPage && <ArrowRight size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

