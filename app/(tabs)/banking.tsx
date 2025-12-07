import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Swipeable, PanGestureHandler, LongPressGestureHandler, State } from 'react-native-gesture-handler';
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
  Info,
  Settings2,
  ChevronUp,
  GripVertical
} from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { usePlaid } from '@/context/PlaidContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { Transaction as PlaidTransaction } from '@/context/PlaidContext';
import { Spacing, BorderRadius } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import Button from '@/components/layout/Button';
import AccountCarousel from '@/components/AccountCarousel';
import PlaidLinkComponent, { usePlaidLink } from '@/components/PlaidLinkComponent';
import MerchantLogo from '@/components/shared/MerchantLogo';
import { BadgeGalleryModal } from '@/components/badges';
import { DynamicChallengeSuggestions } from '@/components/challenges/DynamicChallengeSuggestions';
import { EliteMilestones } from '@/components/milestones/EliteMilestones';
import { MicroGoals } from '@/components/goals/MicroGoals';
import { WeeklyRecapModal } from '@/components/modals/WeeklyRecapModal';
import AlertModal from '@/components/modals/AlertModal';
import { ModalWrapper } from '@/components/modals/ModalWrapper';

// User ID from auth system
const userId = 'user_123';

export default function BankingScreen() {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { spacing } = useResponsiveDesign();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const challengeTracking = useChallengeTracking();
  const { state, refreshData, clearError, disconnectBank, reorderAccounts } = usePlaid();
  const { openLink, isConnecting } = usePlaidLink();
  const { user, mfaEnabled, mfaVerified } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Wrapper for openLink with error handling and logging
  const handleConnectBank = async () => {
    try {
      console.log('[Banking] 🔘 Connect Bank button pressed');
      console.log('[Banking]   isConnecting:', isConnecting);
      console.log('[Banking]   hasLinkToken:', !!state.linkToken);
      
      // Check if MFA is enabled but not verified - require verification before Plaid Link
      // Note: Users without MFA enabled will be prompted to enable it in settings
      if (mfaEnabled && !mfaVerified) {
        Alert.alert(
          'Multi-Factor Authentication Required',
          'Please verify your identity with your authenticator app before connecting a bank account. You can enable MFA in Settings if you haven\'t already.',
          [
            {
              text: 'Go to Settings',
              onPress: () => {
                router.push('/(tabs)/profile');
              },
            },
            {
              text: 'Verify MFA',
              onPress: () => {
                // Navigate to sign-in screen to complete MFA verification
                router.push('/signin');
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
      
      // If MFA is not enabled, show warning but allow (for now - in production this should be required)
      if (!mfaEnabled && user) {
        Alert.alert(
          'Enable Multi-Factor Authentication',
          'For your security and to comply with Plaid requirements, we recommend enabling two-factor authentication before connecting bank accounts.',
          [
            {
              text: 'Enable MFA',
              onPress: () => {
                router.push('/(tabs)/profile');
              },
            },
            {
              text: 'Continue Anyway',
              style: 'default',
              onPress: async () => {
                // Allow connecting but show warning
                try {
                  await openLink();
                } catch (error) {
                  // Error handling in openLink
                }
              },
            },
          ]
        );
        return;
      }
      
      await openLink();
      
      console.log('[Banking] ✅ openLink completed');
    } catch (error) {
      console.error('[Banking] ❌ Error in handleConnectBank:', error);
      // Error is already shown by openLink, but log it here too
    }
  };

  // Sync managedAccounts when state.accounts changes (e.g., after connect/disconnect)
  useEffect(() => {
    setManagedAccounts(state.accounts);
  }, [state.accounts]);

  // Handle account removal - dedicated function
  const handleRemoveAccount = async (accountId: string, accountName: string) => {
    console.log('[Banking] 🗑️  ========== handleRemoveAccount START ==========');
    console.log('[Banking]   Account ID:', accountId);
    console.log('[Banking]   Account name:', accountName);
    console.log('[Banking]   Current accounts count:', state.accounts.length);
    console.log('[Banking]   Current account IDs:', state.accounts.map(a => a.id));
    
    // Set removing state
    setRemovingAccountId(accountId);
    
    try {
      console.log('[Banking]   Step 1: Calling disconnectBank...');
      await disconnectBank(accountId);
      console.log('[Banking]   Step 2: disconnectBank completed successfully');
      
      // The state has already been updated optimistically in disconnectBank
      // The useEffect hook will sync managedAccounts when state.accounts changes
      // No need to wait or check - the UI will update automatically
      console.log('[Banking]   Step 3: State updated optimistically, UI will refresh automatically');
      
      console.log('[Banking] ✅ ========== Account removal process COMPLETE ==========');
    } catch (error) {
      console.error('[Banking] ❌ ========== ERROR in handleRemoveAccount ==========');
      console.error('[Banking]   Error type:', error?.constructor?.name);
      console.error('[Banking]   Error message:', error instanceof Error ? error.message : String(error));
      console.error('[Banking]   Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to remove account. Please try again.';
      
      // Show error using AlertModal
      setAlertConfig({
        title: 'Error Removing Account',
        message: errorMessage,
        type: 'error',
        actions: [{ 
          text: 'OK',
          onPress: () => {
            console.log('[Banking]   Error alert OK pressed');
            setShowAlert(false);
          },
        }],
      });
      setShowAlert(true);
    } finally {
      // Always clear removing state after a delay
      console.log('[Banking]   Cleaning up - setting removingAccountId to null');
      setTimeout(() => {
        setRemovingAccountId(null);
      }, 200);
    }
  };
  
  // Collapsible sections state
  const [challengesExpanded, setChallengesExpanded] = useState(false);
  const [transactionsExpanded, setTransactionsExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  
  // Badge gallery state
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  
  // New engagement features state
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  
  // Custom alert modal state (replaces native Alert.alert)
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    actions: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    title: '',
    message: '',
    type: 'info',
    actions: [],
  });

  // Account management modal state
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [managedAccounts, setManagedAccounts] = useState(state.accounts);
  const [draggedAccountId, setDraggedAccountId] = useState<string | null>(null);
  const dragYAnimsRef = useRef<Record<string, Animated.Value>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(null);
  const [accountToRemove, setAccountToRemove] = useState<{ id: string; name: string } | null>(null);

  // Debug: Log when accountToRemove changes
  useEffect(() => {
    console.log('[Banking] 🔍 accountToRemove state changed:', accountToRemove);
    if (accountToRemove) {
      console.log('[Banking]   ✅ Modal should be visible now');
      console.log('[Banking]   Account ID:', accountToRemove.id);
      console.log('[Banking]   Account name:', accountToRemove.name);
    } else {
      console.log('[Banking]   ❌ Modal should be hidden now');
    }
  }, [accountToRemove]);

  // Initialize drag animations for accounts
  useEffect(() => {
    managedAccounts.forEach(account => {
      if (!dragYAnimsRef.current[account.id]) {
        dragYAnimsRef.current[account.id] = new Animated.Value(0);
      }
    });
  }, [managedAccounts]);

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
    setAlertConfig({
      title: 'Remove Challenge',
      message: `Are you sure you want to remove "${challenge.challenge_name}"?`,
      type: 'warning',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await challengeTracking.deleteChallenge(challenge.id);
            } catch (error) {
              console.error('Error removing challenge:', error);
              setAlertConfig({
                title: 'Error',
                message: 'Failed to remove challenge. Please try again.',
                type: 'error',
                actions: [{ text: 'OK' }],
              });
              setShowAlert(true);
            }
          },
        },
      ],
    });
    setShowAlert(true);
  };

  // Handle removing goals
  const handleRemoveGoal = (goal: any) => {
    setAlertConfig({
      title: 'Remove Goal',
      message: `Are you sure you want to remove "${goal.title}"?`,
      type: 'warning',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await challengeTracking.deleteMicroGoal(goal.id);
            } catch (error) {
              console.error('Error removing goal:', error);
              setAlertConfig({
                title: 'Error',
                message: 'Failed to remove goal. Please try again.',
                type: 'error',
                actions: [{ text: 'OK' }],
              });
              setShowAlert(true);
            }
          },
        },
      ],
    });
    setShowAlert(true);
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

  // Landscape-optimized content width
  const contentMaxWidth = isLandscape ? 1200 : '100%';
  const horizontalPadding = isLandscape ? Math.max(Spacing.xl, (width - 1200) / 2) : Spacing.lg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: isLandscape ? 'center' : 'stretch',
          }
        ]}
        showsVerticalScrollIndicator={!isLandscape || height < 400}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Banking</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Financial overview & account management
            </Text>
          </View>
          
          {state.hasAccounts && (
            <TouchableOpacity
              style={styles.manageAccountsButton}
              onPress={() => setShowAccountsModal(true)}
              activeOpacity={0.8}
            >
              <Settings2 size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Account Carousel - Always show (handles both connected and unconnected states) */}
        <AccountCarousel 
          onAddAccount={handleConnectBank}
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
                        <MerchantLogo
                          logoUrl={(transaction as any).logo_url || undefined}
                          merchantName={transaction.name}
                          category={transaction.category}
                          size={44}
                        />
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
                    containerStyle={styles.swipeContainer}
                  >
                    <View style={[styles.contentContainer, { backgroundColor: colors.card }]}>
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
                    containerStyle={styles.swipeContainer}
                  >
                    <View style={[styles.contentContainer, { backgroundColor: colors.card }]}>
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
            if (__DEV__) {
              console.log('Challenge selected:', challenge);
            }
          }}
        />

        {/* Micro Goals */}
        <MicroGoals 
          onGoalComplete={(goal) => {
            if (__DEV__) {
              console.log('Goal completed:', goal);
            }
          }}
        />

        {/* Elite Milestones */}
        <EliteMilestones 
          onMilestonePress={(milestone) => {
            if (__DEV__) {
              console.log('Milestone pressed:', milestone);
            }
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
      
      {/* Custom Alert Modal (replaces native Alert.alert) */}
      <AlertModal
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
        onClose={() => setShowAlert(false)}
      />

      {/* Account Removal Confirmation Modal - Custom implementation to avoid AlertModal issues */}
      {accountToRemove && (
        <ModalWrapper
          visible={true}
          onClose={() => {
            if (!removingAccountId) {
              console.log('[Banking]   Removal confirmation cancelled via backdrop');
              setAccountToRemove(null);
            }
          }}
          animationType="fade"
          maxWidth={380}
          disableBackdropPress={!!removingAccountId}
        >
          <View style={[styles.removeConfirmContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.removeConfirmTitle, { color: colors.text }]}>
              Remove Account
            </Text>
            <Text style={[styles.removeConfirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to disconnect "{accountToRemove.name}" from Trilo? You'll need to add it again using Plaid if you want to use it in the future.
            </Text>
            <View style={styles.removeConfirmActions}>
              <TouchableOpacity
                onPress={() => {
                  if (!removingAccountId) {
                    console.log('[Banking]   Removal cancelled via Cancel button');
                    setAccountToRemove(null);
                  }
                }}
                style={[styles.removeConfirmButton, styles.removeConfirmCancel, { borderColor: colors.border }]}
                disabled={!!removingAccountId}
              >
                <Text style={[styles.removeConfirmButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  console.log('[Banking] 🔴🔴🔴 Remove confirmed - starting removal!');
                  console.log('[Banking]   Account to remove:', accountToRemove);
                  const account = { ...accountToRemove }; // Copy to avoid closure issues
                  setAccountToRemove(null); // Close modal immediately
                  
                  // Start removal in next tick to avoid state conflicts
                  setTimeout(() => {
                    console.log('[Banking]   Starting handleRemoveAccount with:', account);
                    handleRemoveAccount(account.id, account.name).catch(err => {
                      console.error('[Banking] ❌ Unhandled error:', err);
                    });
                  }, 100);
                }}
                style={[
                  styles.removeConfirmButton, 
                  styles.removeConfirmRemove, 
                  { 
                    backgroundColor: removingAccountId === accountToRemove?.id ? colors.textSecondary : colors.error,
                    opacity: removingAccountId ? 0.6 : 1,
                  }
                ]}
                disabled={!!removingAccountId}
              >
                <Text style={[styles.removeConfirmButtonText, { color: '#FFFFFF' }]}>
                  {removingAccountId === accountToRemove?.id ? 'Removing...' : 'Remove'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ModalWrapper>
      )}

      {/* Manage Accounts Modal */}
      <ModalWrapper
        visible={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        animationType="fade"
        maxWidth={420}
      >
        <View style={[styles.manageModalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.manageModalHeader}>
            <Text style={[styles.manageModalTitle, { color: colors.text }]}>
              Manage Accounts
            </Text>
            <TouchableOpacity
              onPress={() => setShowAccountsModal(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.manageModalDone, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {managedAccounts.length === 0 ? (
            <View style={styles.emptyManageContainer}>
              <Text style={[styles.emptyManageText, { color: colors.textSecondary }]}>
                No connected accounts yet.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.manageModalSubtitle, { color: colors.textSecondary }]}>
                Reorder accounts or remove them from Trilo.
              </Text>

              <ScrollView
                ref={scrollViewRef}
                style={styles.manageAccountsList}
                contentContainerStyle={styles.manageAccountsListContent}
                showsVerticalScrollIndicator={true}
                scrollEnabled={draggedAccountId === null}
                onScroll={(event) => {
                  scrollY.current = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
              >
                {managedAccounts.map((account, index) => {
                  const rowHeight = 70; // Approximate row height
                  const isDragging = draggedAccountId === account.id;
                  const dragYAnim = dragYAnimsRef.current[account.id] || new Animated.Value(0);

                  const handleLongPress = () => {
                    setDraggedAccountId(account.id);
                  };

                  const handlePanGesture = (event: any) => {
                    if (draggedAccountId !== account.id) return;
                    const { translationY } = event.nativeEvent;
                    dragYAnim.setValue(translationY);

                    // Auto-scroll when dragging near edges
                    const scrollThreshold = 80; // Distance from edge to trigger scroll
                    const scrollSpeed = 8; // Pixels to scroll per frame
                    const viewportHeight = 400; // Approximate viewport height
                    const currentScrollY = scrollY.current;
                    
                    // Calculate item's position relative to viewport
                    const itemTop = index * rowHeight;
                    const itemBottom = itemTop + rowHeight;
                    const itemTopInViewport = itemTop - currentScrollY;
                    const itemBottomInViewport = itemBottom - currentScrollY;
                    const dragTopInViewport = itemTopInViewport + translationY;
                    const dragBottomInViewport = itemBottomInViewport + translationY;
                    
                    // Scroll up if dragging near top edge
                    if (dragTopInViewport < scrollThreshold && currentScrollY > 0) {
                      const newScrollY = Math.max(0, currentScrollY - scrollSpeed);
                      scrollY.current = newScrollY;
                      scrollViewRef.current?.scrollTo({ y: newScrollY, animated: false });
                    }
                    // Scroll down if dragging near bottom edge
                    else if (dragBottomInViewport > viewportHeight - scrollThreshold) {
                      const totalContentHeight = managedAccounts.length * rowHeight;
                      const maxScroll = Math.max(0, totalContentHeight - viewportHeight);
                      const newScrollY = Math.min(maxScroll, currentScrollY + scrollSpeed);
                      scrollY.current = newScrollY;
                      scrollViewRef.current?.scrollTo({ y: newScrollY, animated: false });
                    }

                    // Calculate which index we should swap to
                    const newIndex = Math.round(index + translationY / rowHeight);
                    const clampedIndex = Math.max(0, Math.min(managedAccounts.length - 1, newIndex));
                    
                    if (clampedIndex !== index) {
                      const updated = [...managedAccounts];
                      const [movedItem] = updated.splice(index, 1);
                      updated.splice(clampedIndex, 0, movedItem);
                      setManagedAccounts(updated);
                      // Reset all animations
                      Object.values(dragYAnimsRef.current).forEach(anim => anim.setValue(0));
                    }
                  };

                  const handlePanEnd = () => {
                    if (draggedAccountId !== null) {
                      reorderAccounts(managedAccounts.map(a => a.id));
                    }
                    Animated.spring(dragYAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                      tension: 100,
                      friction: 8,
                    }).start();
                    setDraggedAccountId(null);
                  };

                  return (
                    <LongPressGestureHandler
                      key={account.id}
                      onHandlerStateChange={(event) => {
                        if (event.nativeEvent.state === State.ACTIVE) {
                          handleLongPress();
                        }
                      }}
                      minDurationMs={200}
                    >
                      <PanGestureHandler
                        onGestureEvent={handlePanGesture}
                        onHandlerStateChange={(event) => {
                          if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
                            handlePanEnd();
                          }
                        }}
                        enabled={draggedAccountId === account.id}
                      >
                        <Animated.View
                          style={[
                            styles.manageRow,
                            {
                              transform: [{ translateY: dragYAnim }],
                              opacity: isDragging ? 0.7 : 1,
                              zIndex: isDragging ? 1000 : 1,
                            },
                          ]}
                        >
                          <View style={styles.manageRowLeft}>
                            <View
                              style={[
                                styles.manageRowIcon,
                                { backgroundColor: `${colors.primary}15` },
                              ]}
                            >
                              <Building2 size={20} color={colors.primary} />
                            </View>
                            <View style={styles.manageRowText}>
                              <Text style={[styles.manageRowTitle, { color: colors.text }]}>
                                {account.name || 'Bank Account'}
                              </Text>
                              <Text
                                style={[styles.manageRowSubtitle, { color: colors.textSecondary }]}
                              >
                                {account.institution_name || account.institution_id || 'Plaid'}
                                {account.mask ? ` •••• ${account.mask}` : ''}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.manageRowRight}>
                            <View style={styles.dragHandle}>
                              <GripVertical size={20} color={colors.textSecondary} />
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                console.log('[Banking] 🗑️  Trash icon pressed for account:', account.id);
                                console.log('[Banking]   Account name:', account.name);
                                console.log('[Banking]   Manage Accounts modal is open:', showAccountsModal);
                                
                                // Close Manage Accounts modal first to avoid modal conflicts
                                if (showAccountsModal) {
                                  console.log('[Banking]   Closing Manage Accounts modal first');
                                  setShowAccountsModal(false);
                                }
                                
                                // Wait a moment for modal to close, then show removal confirmation
                                setTimeout(() => {
                                  const accountData = { id: account.id, name: account.name || 'Account' };
                                  console.log('[Banking]   Setting accountToRemove to:', accountData);
                                  setAccountToRemove(accountData);
                                  console.log('[Banking]   setAccountToRemove called');
                                }, 300);
                              }}
                              style={styles.iconButton}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              disabled={removingAccountId === account.id || !!accountToRemove}
                            >
                              <Trash2 
                                size={18} 
                                color={removingAccountId === account.id ? colors.textSecondary : colors.error} 
                              />
                            </TouchableOpacity>
                          </View>
                        </Animated.View>
                      </PanGestureHandler>
                    </LongPressGestureHandler>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </ModalWrapper>
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
    minHeight: '100%',
  },
  header: {
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  manageAccountsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageModalContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.xxl,
    maxHeight: 600,
    minHeight: 300,
  },
  manageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  manageModalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  manageModalDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  manageModalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  manageAccountsList: {
    maxHeight: 400,
    marginTop: Spacing.sm,
  },
  manageAccountsListContent: {
    paddingBottom: Spacing.md,
  },
  emptyManageContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyManageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  manageRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  manageRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  manageRowText: {
    flex: 1,
  },
  manageRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  manageRowSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  manageRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: Spacing.xs,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.3,
  },
  removeButton: {
    padding: Spacing.xs,
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
    marginLeft: Spacing.md,
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
    maxWidth: 600, // Constrain card width in landscape for better appearance
    alignSelf: 'center', // Center the card in landscape
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
    maxWidth: 500, // Fixed max width instead of percentage for better landscape behavior
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
    maxWidth: 500, // Fixed max width instead of percentage for better landscape behavior
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

  // Swipe container styles (matching TransactionItem)
  swipeContainer: {
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
  },
  
  // Account Removal Confirmation Modal Styles
  removeConfirmContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.xxl,
    minWidth: 300,
  },
  removeConfirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  removeConfirmMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  removeConfirmActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  removeConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  removeConfirmCancel: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  removeConfirmRemove: {
    // backgroundColor set dynamically
  },
  removeConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
