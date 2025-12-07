import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { Spacing, BorderRadius, Shadow, getResponsiveTypography } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import Button from '@/components/layout/Button';
import AlertModal from '@/components/modals/AlertModal';
import { 
  Zap, 
  Clock, 
  Target, 
  DollarSign,
  Coffee,
  Car,
  ShoppingBag,
  PiggyBank,
  CheckCircle,
  Plus,
  Star,
  ArrowRight
} from 'lucide-react-native';

interface MicroGoal {
  id: string;
  title: string;
  description: string;
  category: 'spending' | 'savings' | 'habit' | 'quick_win';
  duration: number; // in days
  difficulty: 'easy' | 'medium' | 'hard';
  targetAmount: number; // dollar amount for the goal
  xpReward: number;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  startDate?: string;
  completionDate?: string;
  progress?: number; // 0-100
}

interface MicroGoalsProps {
  style?: any;
  onGoalComplete?: (goal: MicroGoal) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const horizontalPadding = 32; // 16px padding on each side from parent banking screen
const internalPadding = 48; // 24px on each side for better viewability
const cardSpacing = 16; // Standard spacing between cards
const cardWidth = screenWidth - horizontalPadding - internalPadding; // screenWidth - 80
const snapInterval = cardWidth + cardSpacing; // cardWidth + spacing between cards

export function MicroGoals({ style, onGoalComplete }: MicroGoalsProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const challengeTracking = useChallengeTracking();
  const typography = getResponsiveTypography(screenWidth);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [microGoals, setMicroGoals] = useState<MicroGoal[]>([]);
  const [activeGoals, setActiveGoals] = useState<MicroGoal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pressedCard, setPressedCard] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Alert modal state for custom modals
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


  // Available micro-goals
  const availableGoals: MicroGoal[] = [
    {
      id: 'micro_1',
      title: 'No Coffee Shop',
      description: 'Skip coffee shop purchases for 5 days',
      category: 'spending',
      duration: 5,
      difficulty: 'easy',
      targetAmount: 25, // $25 saved from not buying coffee
      xpReward: 50,
      icon: <Coffee size={20} color={colors.warning} />,
      isActive: false,
      isCompleted: false,
    },
    {
      id: 'micro_2',
      title: 'Walk Instead',
      description: 'Walk or bike instead of driving for 3 days',
      category: 'habit',
      duration: 3,
      difficulty: 'easy',
      targetAmount: 15, // $15 saved from gas
      xpReward: 75,
      icon: <Car size={20} color={colors.primary} />,
      isActive: false,
      isCompleted: false,
    },
    {
      id: 'micro_3',
      title: 'No Impulse Buys',
      description: 'Avoid impulse purchases for 7 days',
      category: 'spending',
      duration: 7,
      difficulty: 'medium',
      targetAmount: 50, // $50 saved from avoiding impulse buys
      xpReward: 100,
      icon: <ShoppingBag size={20} color={colors.error} />,
      isActive: false,
      isCompleted: false,
    },
    {
      id: 'micro_4',
      title: 'Daily $5 Save',
      description: 'Save $5 every day for 1 week',
      category: 'savings',
      duration: 7,
      difficulty: 'easy',
      targetAmount: 35, // $5 x 7 days = $35
      xpReward: 80,
      icon: <PiggyBank size={20} color={colors.success} />,
      isActive: false,
      isCompleted: false,
    },
    {
      id: 'micro_5',
      title: 'Spend $20 Less',
      description: 'Spend $20 less this week than last week',
      category: 'spending',
      duration: 7,
      difficulty: 'medium',
      targetAmount: 20, // $20 saved
      xpReward: 120,
      icon: <DollarSign size={20} color={colors.primary} />,
      isActive: false,
      isCompleted: false,
    },
    {
      id: 'micro_6',
      title: 'No Fast Food',
      description: 'Avoid fast food for 5 days',
      category: 'habit',
      duration: 5,
      difficulty: 'medium',
      targetAmount: 40, // $8 per day x 5 days = $40 saved
      xpReward: 90,
      icon: <Target size={20} color={colors.warning} />,
      isActive: false,
      isCompleted: false,
    },
    {
      id: 'micro_7',
      title: 'Weekly Budget Check',
      description: 'Check your budget every day for 1 week',
      category: 'habit',
      duration: 7,
      difficulty: 'easy',
      targetAmount: 0, // No monetary goal, just habit building
      xpReward: 60,
      icon: <Clock size={20} color={colors.secondary} />,
      isActive: false,
      isCompleted: false,
    },
    {
      id: 'micro_8',
      title: 'Emergency Fund Boost',
      description: 'Add $50 to emergency fund this week',
      category: 'savings',
      duration: 7,
      difficulty: 'medium',
      targetAmount: 50, // $50 emergency fund boost
      xpReward: 150,
      icon: <Star size={20} color={colors.success} />,
      isActive: false,
      isCompleted: false,
    }
  ];

  useEffect(() => {
    // Load saved micro-goals from storage
    loadMicroGoals();
  }, [refreshCounter]);

  const loadMicroGoals = async () => {
    try {
      // Create different goal sets based on refresh counter
      const goalSets = [
        // Set 1: Spending control focus
        [
          {
            id: 'goal_refresh_1_coffee',
            title: 'No Coffee Shop',
            description: 'Skip coffee shop purchases for 5 days',
            category: 'spending' as const,
            duration: 5,
            difficulty: 'easy' as const,
            targetAmount: 25,
            xpReward: 50,
            icon: <Coffee size={20} color={colors.warning} />,
            isActive: false,
            isCompleted: false,
          },
          {
            id: 'goal_refresh_1_impulse',
            title: 'No Impulse Buys',
            description: 'Avoid impulse purchases for 7 days',
            category: 'spending' as const,
            duration: 7,
            difficulty: 'medium' as const,
            targetAmount: 50,
            xpReward: 100,
            icon: <ShoppingBag size={20} color={colors.error} />,
            isActive: false,
            isCompleted: false,
          },
          {
            id: 'goal_refresh_1_spend_less',
            title: 'Spend $20 Less',
            description: 'Spend $20 less this week than last week',
            category: 'spending' as const,
            duration: 7,
            difficulty: 'medium' as const,
            targetAmount: 20,
            xpReward: 120,
            icon: <DollarSign size={20} color={colors.primary} />,
            isActive: false,
            isCompleted: false,
          }
        ],
        // Set 2: Savings focus
        [
          {
            id: 'goal_refresh_2_daily_save',
            title: 'Daily $5 Save',
            description: 'Save $5 every day for 1 week',
            category: 'savings' as const,
            duration: 7,
            difficulty: 'easy' as const,
            targetAmount: 35,
            xpReward: 80,
            icon: <PiggyBank size={20} color={colors.success} />,
            isActive: false,
            isCompleted: false,
          },
          {
            id: 'goal_refresh_2_emergency',
            title: 'Emergency Fund Boost',
            description: 'Add $50 to emergency fund this week',
            category: 'savings' as const,
            duration: 7,
            difficulty: 'medium' as const,
            targetAmount: 50,
            xpReward: 150,
            icon: <Star size={20} color={colors.success} />,
            isActive: false,
            isCompleted: false,
          },
          {
            id: 'goal_refresh_2_weekly_save',
            title: 'Weekly $25 Save',
            description: 'Save $25 this week for future goals',
            category: 'savings' as const,
            duration: 7,
            difficulty: 'easy' as const,
            targetAmount: 25,
            xpReward: 90,
            icon: <Target size={20} color={colors.success} />,
            isActive: false,
            isCompleted: false,
          }
        ],
        // Set 3: Habit building focus
        [
          {
            id: 'goal_refresh_3_walk',
            title: 'Walk Instead',
            description: 'Walk or bike instead of driving for 3 days',
            category: 'habit' as const,
            duration: 3,
            difficulty: 'easy' as const,
            targetAmount: 15,
            xpReward: 75,
            icon: <Car size={20} color={colors.primary} />,
            isActive: false,
            isCompleted: false,
          },
          {
            id: 'goal_refresh_3_no_fast_food',
            title: 'No Fast Food',
            description: 'Avoid fast food for 5 days',
            category: 'habit' as const,
            duration: 5,
            difficulty: 'medium' as const,
            targetAmount: 40,
            xpReward: 90,
            icon: <Target size={20} color={colors.warning} />,
            isActive: false,
            isCompleted: false,
          },
          {
            id: 'goal_refresh_3_budget_check',
            title: 'Weekly Budget Check',
            description: 'Check your budget every day for 1 week',
            category: 'habit' as const,
            duration: 7,
            difficulty: 'easy' as const,
            targetAmount: 0,
            xpReward: 60,
            icon: <Clock size={20} color={colors.secondary} />,
            isActive: false,
            isCompleted: false,
          }
        ]
      ];
      
      // Select goal set based on refresh counter
      const selectedSet = goalSets[refreshCounter % goalSets.length];
      setMicroGoals(selectedSet);
      setActiveGoals([]);
    } catch (error) {
      console.error('Error loading micro-goals:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleStartGoal = async (goal: MicroGoal) => {
    try {
      await challengeTracking.startMicroGoal(goal);
      
      // Update local state to mark goal as active (will hide it from available list)
      setMicroGoals(prev => prev.map(g => 
        g.id === goal.id ? { ...g, isActive: true } : g
      ));
      
      // Show custom success modal
      setAlertConfig({
        title: 'Goal Started! 🎯',
        message: `You've started "${goal.title}". Good luck!`,
        type: 'success',
        actions: [{ text: 'OK' }],
      });
      setShowAlert(true);
    } catch (error) {
      console.error('Error starting goal:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to start goal. Please try again.',
        type: 'error',
        actions: [{ text: 'OK' }],
      });
      setShowAlert(true);
    }
  };

  const handleCompleteGoal = async (goal: MicroGoal) => {
    try {
      await challengeTracking.completeMicroGoal(goal.id);
      
      // Update local state to mark goal as completed (will hide it from available list)
      setMicroGoals(prev => prev.map(g => 
        g.id === goal.id ? { ...g, isCompleted: true, isActive: false } : g
      ));
      
      // Award XP (in production, this would update user score)
      setAlertConfig({
        title: 'Goal Completed! 🎉',
        message: `Congratulations! You earned ${goal.xpReward} XP for completing "${goal.title}".`,
        type: 'success',
        actions: [{ text: 'Awesome!' }],
      });
      setShowAlert(true);

      onGoalComplete?.(goal);
    } catch (error) {
      console.error('Error completing goal:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to complete goal. Please try again.',
        type: 'error',
        actions: [{ text: 'OK' }],
      });
      setShowAlert(true);
    }
  };

  const handleCancelGoal = (goal: MicroGoal) => {
    setAlertConfig({
      title: 'Cancel Goal',
      message: `Are you sure you want to cancel "${goal.title}"?`,
      type: 'warning',
      actions: [
        { 
          text: 'Keep Going', 
          style: 'cancel',
        },
        { 
          text: 'Cancel Goal', 
          style: 'destructive',
          onPress: () => {
            setActiveGoals(prev => prev.filter(g => g.id !== goal.id));
            setMicroGoals(prev => 
              prev.map(g => g.id === goal.id ? { ...g, isActive: false } : g)
            );
          }
        }
      ],
    });
    setShowAlert(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return colors.success; // Green
      case 'medium': return colors.warning; // Yellow
      case 'hard': return colors.error; // Red
      default: return colors.primary;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spending': return colors.error;
      case 'savings': return colors.success;
      case 'habit': return colors.primary;
      case 'quick_win': return colors.secondary;
      default: return colors.primary;
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * snapInterval,
      animated: true,
    });
  };

  const renderMicroGoal = (goal: MicroGoal) => {
    const difficultyColor = getDifficultyColor(goal.difficulty);
    const categoryColor = getCategoryColor(goal.category);
    const isPressed = pressedCard === goal.id;

    const goalTitle = (
      <Text style={[styles.goalTitle, { color: colors.text }]}>
        {goal.title}
      </Text>
    );

    const xpBadge = (
      <View style={[styles.xpBadge, { 
        backgroundColor: colors.primary,
        minWidth: Math.max(45, `${goal.xpReward}`.length * 8 + 20) // Dynamic width based on XP amount
      }]}>
        <Text 
          style={styles.xpText}
          numberOfLines={1}
          adjustsFontSizeToFit={false}
        >
          +{goal.xpReward} XP
        </Text>
      </View>
    );

    const cardTopRow = (
      <View style={styles.cardTopRow}>
        {goalTitle}
        {xpBadge}
      </View>
    );

    const goalDescription = (
      <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>
        {goal.description}
      </Text>
    );

    const difficultyTag = (
      <View style={[styles.difficultyTag, { backgroundColor: difficultyColor }]}>
        <Zap size={8} color="#FFFFFF" />
        <Text style={[styles.difficultyText, typography.captionSmall, { color: '#FFFFFF' }]}>{goal.difficulty}</Text>
      </View>
    );

    const infoItem = (icon: React.ReactNode, text: string) => (
      <View style={styles.infoItem}>
        {icon}
        <Text style={[styles.infoText, typography.captionSmall, { color: colors.textSecondary }]}>{text}</Text>
      </View>
    );

    const metadataRow = (
      <View style={styles.metadataRow}>
        {difficultyTag}
        <Text style={[styles.metadataSeparator, { color: colors.textSecondary }]}>•</Text>
        {infoItem(<Clock size={8} color={colors.textSecondary} />, `${goal.duration} days`)}
        <Text style={[styles.metadataSeparator, { color: colors.textSecondary }]}>•</Text>
        {goal.targetAmount > 0 ? (
          infoItem(<DollarSign size={8} color={colors.textSecondary} />, `$${goal.targetAmount} goal`)
        ) : (
          infoItem(<View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />, goal.category)
        )}
      </View>
    );

    const cardMiddleSection = (
      <View style={styles.cardMiddleSection}>
        {goalDescription}
        
        {/* Difficulty and Metadata Row */}
        {metadataRow}
        
        {goal.isActive && goal.progress !== undefined && (
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{goal.progress}% Complete</Text>
          </View>
        )}
      </View>
    );

    const getActionButton = () => {
      if (goal.isCompleted) {
        return (
          <View style={[styles.actionButton, { backgroundColor: colors.success }]}>
            <CheckCircle size={10} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, typography.caption, { color: '#FFFFFF', fontWeight: '600' }]}>Completed</Text>
          </View>
        );
      } else if (goal.isActive) {
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleCompleteGoal(goal)}
            activeOpacity={0.8}
          >
            <CheckCircle size={10} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, typography.caption, { color: '#FFFFFF', fontWeight: '600' }]}>Complete Goal</Text>
          </TouchableOpacity>
        );
      } else {
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleStartGoal(goal)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, typography.caption, { color: '#FFFFFF', fontWeight: '600' }]}>Start Goal</Text>
            <ArrowRight size={10} color="#FFFFFF" />
          </TouchableOpacity>
        );
      }
    };

    const actionSubtext = goal.isCompleted ? (
      <Text style={[styles.actionSubtext, { color: colors.textSecondary }]}>+{goal.xpReward} XP earned</Text>
    ) : null;

    const cardBottomSection = (
      <View style={styles.cardBottomSection}>
        {getActionButton()}
        {actionSubtext}
      </View>
    );

    return (
      <TouchableOpacity
        key={goal.id}
        style={[
          styles.goalCard,
          {
            backgroundColor: colors.innerCard,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: isPressed ? 0.98 : 1 }],
            shadowOpacity: isPressed ? 0.15 : 0.1,
          },
        ]}
        onPress={() => {
          if (goal.isActive) {
            handleCompleteGoal(goal);
          } else if (!goal.isCompleted) {
            handleStartGoal(goal);
          }
        }}
        onPressIn={() => setPressedCard(goal.id)}
        onPressOut={() => setPressedCard(null)}
        activeOpacity={0.8}
      >
        {cardTopRow}
        {cardMiddleSection}
        {cardBottomSection}
      </TouchableOpacity>
    );
  };

  const activeGoalsCount = activeGoals.length;
  const completedGoalsCount = microGoals.filter(g => g.isCompleted).length;
  const filteredAvailableGoals = microGoals.filter(goal => !goal.isActive && !goal.isCompleted);


  // Handle scroll end to snap to closest card
  const handleScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    
    // Ensure index is within bounds
    const clampedIndex = Math.max(0, Math.min(index, filteredAvailableGoals.length - 1));
    
    // Snap to the closest card
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: clampedIndex * snapInterval,
        animated: true,
      });
    }
    setCurrentIndex(clampedIndex);
  };

  return (
    <Card style={[styles.container, style] as any}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Zap size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Micro Goals
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: colors.primary }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scrollWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={snapInterval}
          snapToAlignment="center"
          pagingEnabled={false}
          bounces={true}
          overScrollMode="auto"
          contentInsetAdjustmentBehavior="never"
        >
          {filteredAvailableGoals.map(goal => (
            <View key={goal.id}>
              {renderMicroGoal(goal)}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Page Indicators */}
      {filteredAvailableGoals.length > 1 && (
        <View style={styles.pageIndicators}>
          {filteredAvailableGoals.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pageIndicator,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  width: index === currentIndex ? 24 : 8,
                  opacity: index === currentIndex ? 1 : 0.4,
                },
              ]}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      )}

      {/* Custom Alert Modal for goal actions */}
      <AlertModal
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
        onClose={() => setShowAlert(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: cardSpacing / 2, // Add half spacing on each side to center cards
    alignItems: 'center', // Center cards vertically
    // No horizontal padding - parent banking screen provides it
  },
  goalCard: {
    width: cardWidth,
    borderRadius: 12,
    padding: 16,
    marginRight: cardSpacing, // Only right margin for spacing between cards
    height: 170,
    backgroundColor: 'transparent', // Will be set dynamically based on theme
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: Spacing.xs,
    lineHeight: 18,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    flexShrink: 0, // Prevent badge from shrinking
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false, // Remove extra padding for more precise sizing
  },
  cardMiddleSection: {
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  goalDescription: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 14,
  },
  progressBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  difficultyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  infoText: {
    fontSize: 9,
    fontWeight: '500',
  },
  metadataSeparator: {
    fontSize: 10,
    fontWeight: '400',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardBottomSection: {
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    minHeight: 28,
    maxWidth: '80%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  actionSubtext: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  pageIndicator: {
    height: 6,
    borderRadius: 3,
  },
  personalizationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  personalizationText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '400',
  },
});
