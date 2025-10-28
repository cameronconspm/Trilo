import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Building2,
  Target,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Zap,
  Trash2,
  AlertCircle,
  Info
} from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { usePlaid } from '@/context/PlaidContext';
import { Transaction as PlaidTransaction } from '@/context/PlaidContext';
import { Spacing, BorderRadius } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import Button from '@/components/layout/Button';
import AccountCarousel from '@/components/AccountCarousel';
import PlaidLinkComponent, { usePlaidLink } from '@/components/PlaidLinkComponent';
import { BadgeGalleryModal } from '@/components/badges';
import { DynamicChallengeSuggestions } from '@/components/challenges/DynamicChallengeSuggestions';
import { EliteMilestones } from '@/components/milestones/EliteMilestones';
import { MicroGoals } from '@/components/goals/MicroGoals';
import { WeeklyRecapModal } from '@/components/modals/WeeklyRecapModal';

// User ID from auth system
const userId = 'user_123';

export default function BankingScreen() {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { spacing } = useResponsiveDesign();
  const challengeTracking = useChallengeTracking();
  const { state, refreshData, clearError } = usePlaid();
  const { openLink, isConnecting } = usePlaidLink();
  const [refreshing, setRefreshing] = useState(false);
  
  // Collapsible sections state
  const [challengesExpanded, setChallengesExpanded] = useState(false);
  const [transactionsExpanded, setTransactionsExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  
  // Badge gallery state
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  
  // New engagement features state
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  // Helper functions to calculate balances by account type
  const getCheckingBalance = () => {
    return state.accounts
      .filter(account => account.type === 'depository' && account.subtype === 'checking')
      .reduce((sum, account) => sum + (account.current_balance || 0), 0);
  };

  const getSavingsBalance = () => {
    return state.accounts
      .filter(account => account.type === 'depository' && account.subtype === 'savings')
      .reduce((sum, account) => sum + (account.current_balance || 0), 0);
  };

  const getCreditCardDebt = () => {
    return state.accounts
      .filter(account => account.type === 'credit')
      .reduce((sum, account) => sum + Math.abs(account.current_balance || 0), 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (category?: string) => {
    const iconMap: { [key: string]: string } = {
      'Food and Drink': '🍽️',
      'Transportation': '🚗',
      'Shopping': '🛒',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Travel': '✈️',
      'Gas Stations': '⛽',
      'Groceries': '🛍️',
      'Restaurants': '🍕',
      'Coffee Shops': '☕',
      'Banks': '🏦',
      'ATM': '💳',
      'Deposit': '💰',
      'Income': '💵',
    };
    return iconMap[category || 'Default'] || '💳';
  };

  // Swipe actions for challenges
  const renderChallengeRightActions = (
    progress: Animated.AnimatedAddition<number>,
    dragX: Animated.AnimatedAddition<number>,
    challenge: any
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View
          style={[styles.deleteAction, { transform: [{ scale }] }]}
        >
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => handleRemoveChallenge(challenge)}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color={colors.surface} strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Swipe actions for goals
  const renderGoalRightActions = (
    progress: Animated.AnimatedAddition<number>,
    dragX: Animated.AnimatedAddition<number>,
    goal: any
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View
          style={[styles.deleteAction, { transform: [{ scale }] }]}
        >
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => handleRemoveGoal(goal)}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color={colors.surface} strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Handle removing challenges
  const handleRemoveChallenge = (challenge: any) => {
    Alert.alert(
      'Remove Challenge',
      `Are you sure you want to remove "${challenge.challenge_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await challengeTracking.deleteChallenge(challenge.id);
              console.log('Challenge removed:', challenge);
            } catch (error) {
              console.error('Error removing challenge:', error);
              Alert.alert('Error', 'Failed to remove challenge. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle removing goals
  const handleRemoveGoal = (goal: any) => {
    Alert.alert(
      'Remove Goal',
      `Are you sure you want to remove "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await challengeTracking.deleteMicroGoal(goal.id);
              console.log('Goal removed:', goal);
            } catch (error) {
              console.error('Error removing goal:', error);
              Alert.alert('Error', 'Failed to remove goal. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    clearError();
    try {
      await refreshData();
      
      // Update challenge progress with current account data
      const accountDataForChallenges = state.accounts.map(account => ({
        id: account.id,
        type: account.type as 'checking' | 'savings' | 'credit_card' | 'loan',
        balance: account.current_balance,
        previous_balance: account.current_balance * 0.95, // Previous balance calculation
        transactions: state.transactions.filter(t => t.account_id === account.id).map((t: PlaidTransaction) => ({
          id: t.id,
          amount: t.amount,
          date: t.date,
          name: t.name,
          description: t.name,
          category: (t.category || 'Other') as any, // Cast to CategoryType
          type: (t.amount >= 0 ? 'income' : 'expense') as any, // Cast to TransactionType
          isRecurring: false,
        }))
      }));
      
      await challengeTracking.updateProgress(accountDataForChallenges);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Banking</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Financial overview & account management
          </Text>
        </View>

        {/* Account Carousel - Always show (handles both connected and unconnected states) */}
        <AccountCarousel 
          onAddAccount={openLink}
          onRefresh={refreshData}
        />

        {/* Financial Health Summary - Only show real data when connected */}
        {state.hasAccounts && (
          <Card style={styles.healthSummaryCard}>
            <View style={styles.healthSummaryHeader}>
              <DollarSign size={20} color={colors.primary} />
              <Text style={[styles.healthSummaryTitle, { color: colors.text }]}>
                Financial Health
              </Text>
            </View>
            
            <View style={styles.healthMetrics}>
              <View style={styles.healthMetric}>
                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>
                  Checking Balance
                </Text>
                <View style={styles.healthMetricValue}>
                  <Text style={[styles.healthMetricAmount, { color: colors.text }]}>
                    {state.showBalances ? formatCurrency(getCheckingBalance()) : '••••••'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.healthMetric}>
                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>
                  Savings Balance
                </Text>
                <View style={styles.healthMetricValue}>
                  <Text style={[styles.healthMetricAmount, { color: colors.text }]}>
                    {state.showBalances ? formatCurrency(getSavingsBalance()) : '••••••'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.healthMetric}>
                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>
                  Credit Card Debt
                </Text>
                <View style={styles.healthMetricValue}>
                  <Text style={[styles.healthMetricAmount, { color: colors.text }]}>
                    {state.showBalances ? formatCurrency(getCreditCardDebt()) : '••••••'}
                  </Text>
                </View>
              </View>
            </View>
            
          </Card>
        )}

        {/* Recent Transactions - Only show when connected */}
        {state.hasAccounts && (
          <Card style={styles.transactionsCard}>
            <TouchableOpacity 
              style={styles.transactionsHeader}
              onPress={() => setTransactionsExpanded(!transactionsExpanded)}
            >
              <View style={styles.transactionsHeaderLeft}>
                <CreditCard size={20} color={colors.primary} />
                <Text style={[styles.transactionsTitle, { color: colors.text }]}>
                  Recent Transactions
                </Text>
              </View>
              {transactionsExpanded ? <ChevronDown size={20} color={colors.textSecondary} /> : <ChevronRight size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
            
            {/* Show transactions only when expanded */}
            {transactionsExpanded && (
              <View style={styles.transactionsList}>
                {state.transactions.length > 0 ? (
                  state.transactions.map((transaction) => (
                    <View key={transaction.id} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View style={styles.transactionIcon}>
                          <Text style={styles.transactionEmoji}>
                            {getTransactionIcon(transaction.category)}
                          </Text>
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={[styles.transactionMerchant, { color: colors.text }]}>
                            {transaction.name || 'Unknown Merchant'}
                          </Text>
                          <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                            {new Date(transaction.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[
                          styles.transactionAmount,
                          { color: transaction.amount >= 0 ? colors.success : colors.error }
                        ]}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyTransactionsContainer}>
                    <CreditCard size={32} color={colors.textSecondary} />
                    <Text style={[styles.emptyTransactionsText, { color: colors.text }]}>
                      No transactions yet
                    </Text>
                    <Text style={[styles.emptyTransactionsText, { color: colors.textSecondary }]}>
                      Transactions will appear here once your accounts sync
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

        {/* Active Challenges */}
        <Card style={styles.challengesCard}>
          <TouchableOpacity 
            style={styles.challengesHeader}
            onPress={() => setChallengesExpanded(!challengesExpanded)}
          >
            <View style={styles.challengesHeaderLeft}>
              <Target size={20} color={colors.primary} />
              <Text style={[styles.challengesTitle, { color: colors.text }]}>
                Active Challenges ({challengeTracking.activeChallenges.length})
              </Text>
            </View>
            {challengesExpanded ? <ChevronDown size={20} color={colors.textSecondary} /> : <ChevronRight size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
          
          {/* Show challenges only when expanded */}
          {challengesExpanded && (
            <View style={styles.challengesList}>
              {challengeTracking.activeChallenges.length > 0 ? (
                challengeTracking.activeChallenges.map((challenge) => (
                  <Swipeable
                    key={challenge.id}
                    renderRightActions={(progress, dragX) => renderChallengeRightActions(progress, dragX, challenge)}
                    rightThreshold={30}
                    friction={1.5}
                    overshootRight={false}
                  >
                    <View style={styles.challengeItem}>
                      <View style={styles.challengeItemLeft}>
                        <View style={styles.challengeItemInfo}>
                          <Text style={[styles.challengeItemTitle, { color: colors.text }]}>
                            {challenge.challenge_name}
                          </Text>
                          <Text style={[styles.challengeItemDescription, { color: colors.textSecondary }]}>
                            {challenge.description}
                          </Text>
                          <Text style={[styles.challengeProgressText, { color: colors.textSecondary }]}>
                            {formatCurrency(challenge.current_amount)} / {formatCurrency(challenge.target_amount)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.challengeItemRight}>
                        <View style={styles.challengeItemProgressBar}>
                          <View 
                            style={[
                              styles.challengeItemProgressFill,
                              { 
                                width: `${Math.min(100, challenge.progress_percentage)}%`,
                                backgroundColor: challenge.status === 'completed' ? colors.success : colors.primary
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.challengeItemProgressText, { color: colors.textSecondary }]}>
                          {Math.round(challenge.progress_percentage)}%
                        </Text>
                        <Text style={[styles.challengePoints, { color: colors.primary }]}>
                          {challenge.points_reward} XP
                        </Text>
                      </View>
                    </View>
                  </Swipeable>
                ))
              ) : (
                <View style={styles.emptyChallengesContainer}>
                  <Target size={32} color={colors.textSecondary} />
                  <Text style={[styles.emptyChallengesTitle, { color: colors.text }]}>
                    {state.isFirstTime ? "Ready to Start Your Financial Journey?" : "No Active Challenges"}
                  </Text>
                  <Text style={[styles.emptyChallengesSubtitle, { color: colors.textSecondary }]}>
                    {state.isFirstTime 
                      ? "Complete challenges to earn XP, unlock badges, and build better financial habits!"
                      : "Start a challenge to begin earning points and badges!"
                    }
                  </Text>
                  <View style={styles.buttonRow}>
                    <Button
                      title="Browse Challenges"
                      onPress={() => {
                        // TODO: Open challenge selection modal
                        console.log('Open challenge selection');
                      }}
                      variant='outline'
                      size='small'
                      style={styles.browseChallengesButton}
                    />
                    <Button
                      title="View Badges"
                      onPress={() => setShowBadgeGallery(true)}
                      variant='outline'
                      size='small'
                      style={styles.browseChallengesButton}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Active Goals */}
        <Card style={styles.goalsCard}>
          <TouchableOpacity 
            style={styles.goalsHeader}
            onPress={() => setGoalsExpanded(!goalsExpanded)}
          >
            <View style={styles.goalsHeaderLeft}>
              <Zap size={20} color={colors.warning} />
              <Text style={[styles.goalsTitle, { color: colors.text }]}>
                Active Goals ({challengeTracking.activeMicroGoals.length})
              </Text>
            </View>
            {goalsExpanded ? <ChevronDown size={20} color={colors.textSecondary} /> : <ChevronRight size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
          
          {/* Show goals only when expanded */}
          {goalsExpanded && (
            <View style={styles.goalsList}>
              {challengeTracking.activeMicroGoals.length > 0 ? (
                challengeTracking.activeMicroGoals.map((goal) => (
                  <Swipeable
                    key={goal.id}
                    renderRightActions={(progress, dragX) => renderGoalRightActions(progress, dragX, goal)}
                    rightThreshold={30}
                    friction={1.5}
                    overshootRight={false}
                  >
                    <View style={styles.goalItem}>
                      <View style={styles.goalItemLeft}>
                        <View style={styles.goalItemInfo}>
                          <Text style={[styles.goalItemTitle, { color: colors.text }]}>
                            {goal.title}
                          </Text>
                          <Text style={[styles.goalItemDescription, { color: colors.textSecondary }]}>
                            {goal.description}
                          </Text>
                          <Text style={[styles.goalItemProgress, { color: colors.textSecondary }]}>
                            Day {goal.currentDay || 1} of {goal.duration}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.goalItemRight}>
                        <View style={styles.goalProgressBar}>
                          <View 
                            style={[
                              styles.goalProgressFill,
                              { 
                                width: `${goal.progress || 0}%`,
                                backgroundColor: colors.warning
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.goalProgressText, { color: colors.textSecondary }]}>
                          {goal.progress || 0}%
                        </Text>
                        <Text style={[styles.goalPoints, { color: colors.primary }]}>
                          {goal.xpReward} XP
                        </Text>
                      </View>
                    </View>
                  </Swipeable>
                ))
              ) : (
                <View style={styles.emptyGoalsContainer}>
                  <Zap size={32} color={colors.textSecondary} />
                  <Text style={[styles.emptyGoalsTitle, { color: colors.text }]}>
                    {state.isFirstTime ? "Build Daily Financial Habits" : "No Active Goals"}
                  </Text>
                  <Text style={[styles.emptyGoalsSubtitle, { color: colors.textSecondary }]}>
                    {state.isFirstTime 
                      ? "Set small, achievable daily goals to build lasting financial habits and earn XP!"
                      : "Start a micro goal to begin building positive habits!"
                    }
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Dynamic Challenge Suggestions */}
        <DynamicChallengeSuggestions 
          onChallengeSelect={(challenge) => {
            console.log('Challenge selected:', challenge);
          }}
        />

        {/* Micro Goals */}
        <MicroGoals 
          onGoalComplete={(goal) => {
            console.log('Goal completed:', goal);
          }}
        />

        {/* Elite Milestones */}
        <EliteMilestones 
          onMilestonePress={(milestone) => {
            console.log('Milestone pressed:', milestone);
          }}
        />
      </ScrollView>
      
      {/* Plaid Link Component */}
      <PlaidLinkComponent />
      
      {/* Badge Gallery Modal */}
      <BadgeGalleryModal
        visible={showBadgeGallery}
        onClose={() => setShowBadgeGallery(false)}
      />
      
      {/* Weekly Recap Modal */}
      <WeeklyRecapModal
        visible={showWeeklyRecap}
        onClose={() => setShowWeeklyRecap(false)}
      />
    </SafeAreaView>
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
  totalBalanceCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  totalBalance: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  balanceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  connectButton: {
    marginBottom: Spacing.xl,
  },
  accountCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  accountInstitution: {
    fontSize: 13,
    fontWeight: '400',
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  transactionCategory: {
    fontSize: 13,
    fontWeight: '400',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  connectButtonContainer: {
    marginTop: 24, // ENFORCED: 24pt spacing from card above
    marginBottom: 24, // ENFORCED: 24pt spacing to next element
    paddingHorizontal: 20, // ENFORCED: Horizontal margins for full-width button
  },

  // Banking UI Styles
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  accountType: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d5a2d',
  },
  balanceSection: {
    alignItems: 'flex-start',
  },

  // Spending Overview Styles
  spendingCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  spendingHeader: {
    marginBottom: Spacing.lg,
  },
  spendingAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  spendingComparison: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesContainer: {
    marginTop: Spacing.md,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  categoriesList: {
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '400',
  },

  // Transactions Styles
  transactionsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionCategoryContainer: {
    marginBottom: Spacing.xs,
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Footer Styles
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerLeft: {
    flex: 1,
    gap: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastSynced: {
    fontSize: 12,
    fontWeight: '400',
  },

  // Empty State Styles
  emptyAccountContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  bankIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyAccountTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyAccountSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  connectAccountButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySpendingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptySpendingText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyTransactionsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },

  // New Banking UI Styles
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Connected Accounts Styles
  accountItemCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountItemDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  accountItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  accountItemInstitution: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: Spacing.xs,
  },
  accountItemUpdated: {
    fontSize: 12,
    fontWeight: '400',
  },
  accountItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accountItemBalance: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Financial Health Summary Styles
  healthCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  healthCard: {
    flex: 1,
    minWidth: '30%',
    padding: Spacing.md,
  },
  healthCardContent: {
    alignItems: 'center',
  },
  healthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  healthCardIcon: {
    fontSize: 20,
  },
  healthCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  healthCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  healthCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  healthCardTrendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Challenges Styles
  challengeCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'transparent', // Will be set dynamically based on theme
  },
  challengeContent: {
    gap: Spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  challengeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeDetails: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  challengeDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  challengeStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  challengeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    // Color will be set inline with theme colors
  },
  challengeProgress: {
    gap: Spacing.xs,
  },
  challengeProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeProgressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  challengeProgressPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // New Refactored Styles
  primaryAccountCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  primaryAccountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryAccountInfo: {
    flex: 1,
  },
  primaryAccountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  primaryAccountType: {
    fontSize: 14,
    fontWeight: '400',
  },
  balanceToggle: {
    padding: Spacing.xs,
  },
  primaryBalanceSection: {
    alignItems: 'flex-start',
  },
  primaryBalanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  primaryBalanceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  primaryTrendText: {
    fontSize: 14,
    fontWeight: '500',
  },

  connectCard: {
    marginBottom: Spacing.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  connectCardContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  connectTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  connectSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },

  accountsCard: {
    marginBottom: Spacing.md,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  accountsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accountsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  accountItemInfo: {
    flex: 1,
  },

  healthSummaryCard: {
    marginBottom: Spacing.md,
  },
  healthSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  healthSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  healthMetrics: {
    gap: Spacing.md,
  },
  healthMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthMetricLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  healthMetricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  healthMetricAmount: {
    fontSize: 16,
    fontWeight: '600',
  },

  challengesCard: {
    marginBottom: Spacing.md,
  },
  challengesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  challengesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  challengesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  challengesList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  challengesExpandedList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  challengeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  challengeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  challengeItemIcon: {
    fontSize: 16,
  },
  challengeItemInfo: {
    flex: 1,
  },
  challengeItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  challengeItemDescription: {
    fontSize: 12,
    fontWeight: '400',
  },
  challengeItemRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  challengeItemProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  challengeItemProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  challengeItemProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  challengePoints: {
    fontSize: 10,
    fontWeight: '600',
  },
  scoreBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyChallengesContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyChallengesTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyChallengesSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  browseChallengesButton: {
    marginTop: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  transactionsCardSecondary: {
    marginBottom: Spacing.md,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  transactionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },


  // Active Items Styles
  activeItemsCard: {
    marginBottom: Spacing.md,
  },
  activeItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  activeItemsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activeItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeItemsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  activeItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeItemInfo: {
    flex: 1,
  },
  activeItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeItemDescription: {
    fontSize: 12,
    fontWeight: '400',
  },
  activeItemProgress: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  activeItemRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  activeItemProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  activeItemProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  activeItemProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeItemPoints: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyActiveItemsContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyActiveItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyActiveItemsSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Goals Styles
  goalsCard: {
    marginBottom: Spacing.md,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  goalsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  goalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  goalItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalItemInfo: {
    flex: 1,
  },
  goalItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalItemDescription: {
    fontSize: 12,
    fontWeight: '400',
  },
  goalItemProgress: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  goalItemRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  goalProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalPoints: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyGoalsContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyGoalsSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Swipe Actions Styles (matching TransactionItem pattern)
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 70,
    paddingRight: Spacing.md,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Connect Bank Card Styles
  connectBankCard: {
    marginBottom: Spacing.md,
    padding: Spacing.xl,
  },
  connectBankContent: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  connectBankHeader: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  connectBankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBankTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  connectBankSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  connectBankButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  expoNotice: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  expoNoticeText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: Spacing.xs,
    maxWidth: '90%',
    marginTop: Spacing.sm,
  },
  securityIconContainer: {
    marginTop: 2, // Align icon with first line of text
  },
  securityText: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

});
