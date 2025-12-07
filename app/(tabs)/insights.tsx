import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import Card from '@/components/layout/Card';
import InsightCard from '@/components/InsightCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/feedback/EmptyState';
import Calendar from '@/components/Calendar';
import DateExpensesModal from '@/components/modals/DateExpensesModal';
import Toggle, { ToggleOption } from '@/components/shared/Toggle';

export default function InsightsScreen() {
  const { monthlyInsights, weeklyOverview, isLoading } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { spacing, typography } = useResponsiveDesign();
  const {
    totalSpent,
    totalSaved,
    insights,
    recentTransactions,
  } = monthlyInsights;

  // Calculate new metrics from weekly overview
  const netBalance = weeklyOverview.remainingBalance;
  const budgetUtilization = weeklyOverview.utilization;
  const weekIncome = weeklyOverview.weekIncome;

  const [activeView, setActiveView] = useState<'insights' | 'calendar'>(
    'insights'
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // Toggle options for Insights/Calendar
  const toggleOptions: ToggleOption[] = [
    {
      id: 'insights',
      label: 'Insights',
    },
    {
      id: 'calendar',
      label: 'Calendar',
    },
  ];

  const handleToggleChange = (optionId: string) => {
    setActiveView(optionId as 'insights' | 'calendar');
  };

  const hasInsights = insights.length > 0;
  const hasRecentTransactions = recentTransactions.length > 0;
  const hasData = weekIncome > 0 || insights.length > 0 || recentTransactions.length > 0;

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    setShowDateModal(true);
  };

  const handleCloseDateModal = () => {
    setShowDateModal(false);
    setSelectedDate(null);
  };

  if (isLoading) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Financial overview
              </Text>
            </View>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, typography.body, { color: colors.inactive }]}>
                Loading...
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent, 
            { 
              paddingBottom: spacing.screenBottom, // Proper bottom padding for tab bar + home indicator
              paddingHorizontal: spacing.screenHorizontal 
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Financial overview
            </Text>
          </View>
          {/* View Toggle - Two evenly sized pills */}
          <Toggle
            options={toggleOptions}
            activeOption={activeView}
            onOptionChange={handleToggleChange}
          />

          {activeView === 'insights' ? (
            hasData ? (
              <>
                {/* KPI Cards Row - Net Balance and Budget Utilization */}
                <View style={styles.metricsContainer}>
                  <Card variant='elevated' style={styles.metricCard}>
                    <View style={styles.metricIcon}>
                      <DollarSign
                        size={24}
                        color={netBalance >= 0 ? colors.success : colors.error}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.metricLabel,
                        typography.footnote,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Net Balance
                    </Text>
                    <Text 
                      style={[
                        styles.metricValue,
                        typography.currencyMedium,
                        { color: netBalance >= 0 ? colors.success : colors.error }
                      ]}
                    >
                      {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.metricPeriod,
                        typography.caption,
                        { color: colors.textSecondary },
                      ]}
                    >
                      As of today
                    </Text>
                  </Card>

                  <Card variant='elevated' style={styles.metricCard}>
                    <View style={styles.metricIcon}>
                      <Target
                        size={24}
                        color={budgetUtilization > 90 ? colors.warning : colors.primary}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.metricLabel,
                        typography.footnote,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Budget Utilization
                    </Text>
                    <Text 
                      style={[
                        styles.metricValue,
                        typography.currencyMedium,
                        { color: budgetUtilization > 90 ? colors.warning : colors.primary }
                      ]}
                    >
                      {budgetUtilization.toFixed(0)}%
                    </Text>
                    <Text
                      style={[
                        styles.metricPeriod,
                        typography.caption,
                        { color: colors.textSecondary },
                      ]}
                    >
                      of your budget used
                    </Text>
                  </Card>
                </View>

                {/* Top Spending Category - Simplified layout */}
                {/* Removed as per edit hint */}

                {/* Smart Insights - Left-aligned list */}
                <Text style={[styles.sectionTitle, typography.h3, { color: colors.text }]}>
                  Smart Insights
                </Text>
                {hasInsights ? (
                  <Card>
                    {insights.map((insight, index) => (
                      <InsightCard 
                        key={index} 
                        text={insight} 
                        isLast={index === insights.length - 1}
                      />
                    ))}
                  </Card>
                ) : (
                  <Card variant='subtle'>
                    <EmptyState
                      icon='trending'
                      title='Building insights...'
                      subtitle='Add more transactions to get personalized financial insights'
                    />
                  </Card>
                )}

                {/* Recent Transactions */}
                <Text style={[styles.sectionTitle, typography.h3, { color: colors.text }]}>
                  Recent Activity
                </Text>
                <Card>
                  {hasRecentTransactions ? (
                    recentTransactions.map((transaction, index) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        isLast={index === recentTransactions.length - 1}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon='dollar'
                      title='No recent transactions'
                      subtitle='Your transaction history will appear here'
                    />
                  )}
                </Card>
              </>
            ) : (
              /* No Data State */
              <View style={styles.noDataContainer}>
                <Card variant='elevated' style={styles.welcomeCard}>
                  <View style={styles.welcomeIcon}>
                    <DollarSign
                      size={48}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={[styles.welcomeTitle, typography.h2, { color: colors.text }]}>
                    Welcome to Insights!
                  </Text>
                  <Text
                    style={[
                      styles.welcomeSubtitle,
                      typography.body,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Start tracking your expenses and income to see personalized
                    financial insights and trends.
                  </Text>

                  <View style={styles.welcomeFeatures}>
                    <View style={styles.featureItem}>
                      <TrendingUp
                        size={20}
                        color={colors.success}
                        strokeWidth={2}
                      />
                      <Text
                        style={[styles.featureText, typography.bodyMedium, { color: colors.text }]}
                      >
                        Spending trends
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Target
                        size={20}
                        color={colors.primary}
                        strokeWidth={2}
                      />
                      <Text
                        style={[styles.featureText, typography.bodyMedium, { color: colors.text }]}
                      >
                        Category analysis
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <DollarSign
                        size={20}
                        color={colors.warning}
                        strokeWidth={2}
                      />
                      <Text
                        style={[styles.featureText, typography.bodyMedium, { color: colors.text }]}
                      >
                        Savings tracking
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            )
          ) : (
            /* Calendar View */
            <Card variant='elevated'>
              <Calendar onDatePress={handleDatePress} />
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>

      <DateExpensesModal
        visible={showDateModal}
        onClose={handleCloseDateModal}
        selectedDate={selectedDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  // Section Title Styles
  sectionTitle: {
    marginTop: 24, // Consistent spacing from previous section
    marginBottom: 12, // Consistent spacing to content below
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    // Typography applied at component level
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16, // Gap between cards (12-16 as specified)
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20, // Card padding (16-20 as specified)
    paddingHorizontal: 16, // Card padding (16-20 as specified)
    minHeight: 120, // Ensure consistent height for both states
    justifyContent: 'center', // Center content vertically
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    textAlign: 'center',
  },
  metricPeriod: {
    textAlign: 'center',
    marginTop: 4,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  welcomeCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    marginBottom: 8,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  welcomeFeatures: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
  },
});
