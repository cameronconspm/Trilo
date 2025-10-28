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
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Zap,
  ArrowRight,
  Star,
  Award
} from 'lucide-react-native';
import { ChallengeTemplate } from '@/types/finance';

interface SuggestedChallenge {
  id: string;
  template: ChallengeTemplate;
  reason: string;
  confidence: number; // 0-100
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  personalizedMessage: string;
  xpReward: number;
  progressPercentage?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'started';
}

interface DynamicChallengeSuggestionsProps {
  style?: any;
  onChallengeSelect?: (challenge: SuggestedChallenge) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const horizontalPadding = 32; // 16px padding on each side from parent banking screen
const internalPadding = 48; // 24px on each side for better viewability
const cardSpacing = 16; // Standard spacing between cards
const cardWidth = screenWidth - horizontalPadding - internalPadding; // screenWidth - 80
const snapInterval = cardWidth + cardSpacing; // cardWidth + spacing between cards

export function DynamicChallengeSuggestions({ style, onChallengeSelect }: DynamicChallengeSuggestionsProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const challengeTracking = useChallengeTracking();
  const typography = getResponsiveTypography(screenWidth);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pressedCard, setPressedCard] = useState<string | null>(null);
  
  // Safety check to prevent hook call errors
  if (!challengeTracking) {
    return null;
  }
  
  const { activeChallenges, userBadges, financialScore, createChallenge, getChallengeTemplates } = challengeTracking;
  
  const [suggestions, setSuggestions] = useState<SuggestedChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Handle scroll to update current index
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    setCurrentIndex(index);
  };

  // Handle scroll end to snap to closest card
  const handleScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    
    // Ensure index is within bounds
    const clampedIndex = Math.max(0, Math.min(index, suggestions.length - 1));
    
    // Snap to the closest card
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: clampedIndex * snapInterval,
        animated: true,
      });
    }
    setCurrentIndex(clampedIndex);
  };

  // Scroll to specific challenge
  const scrollToIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, suggestions.length - 1));
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: clampedIndex * snapInterval,
        animated: true,
      });
    }
    setCurrentIndex(clampedIndex);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return colors.success; // Green
      case 'medium': return colors.warning; // Yellow
      case 'hard': return colors.error; // Red
      default: return colors.primary;
    }
  };

  // User financial behavior data
  const userBehavior = {
    averageDebtPayment: 150,
    averageSavingsAmount: 200,
    spendingPattern: 'moderate',
    challengeCompletionRate: 0.75,
    preferredChallengeTypes: ['debt_paydown', 'savings'],
    lastChallengeType: 'debt_paydown',
  };

  useEffect(() => {
    generateSuggestions();
  }, [activeChallenges, userBadges, refreshCounter]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    
    try {
      // Get available challenge templates
      const templates = await getChallengeTemplates();
      
      // Generate personalized suggestions based on user behavior and refresh counter
      const newSuggestions: SuggestedChallenge[] = [];
      
      // Create different challenge sets based on refresh counter
      const challengeSets = [
        // Set 1: Focus on savings and emergency fund
        [
          {
            id: 'challenge_refresh_1_savings',
            template: {
              id: 'template_003',
              name: 'Emergency Fund Builder',
              description: 'Save $1000 this month to build your emergency fund',
              type: 'savings',
              difficulty: 'hard',
              duration_days: 30,
              target_amount: 1000,
              points_reward: 500
            } as ChallengeTemplate,
            reason: 'Financial security',
            confidence: 95,
            estimatedDifficulty: 'hard' as const,
            personalizedMessage: 'Build your financial safety net with a substantial emergency fund.',
            xpReward: 500,
            status: 'not_started' as const
          },
          {
            id: 'challenge_refresh_1_debt',
            template: {
              id: 'template_001',
              name: 'Debt Destroyer',
              description: 'Pay off $300 in credit card debt this month',
              type: 'debt_paydown',
              difficulty: 'hard',
              duration_days: 30,
              target_amount: 300,
              points_reward: 600
            } as ChallengeTemplate,
            reason: 'Debt reduction',
            confidence: 88,
            estimatedDifficulty: 'hard' as const,
            personalizedMessage: 'Take control of your finances by eliminating high-interest debt.',
            xpReward: 600,
            status: 'not_started' as const
          },
          {
            id: 'challenge_refresh_1_spending',
            template: {
              id: 'template_004',
              name: 'Monthly Budget Master',
              description: 'Keep monthly spending under $800 for 4 weeks',
              type: 'spending_limit',
              difficulty: 'medium',
              duration_days: 28,
              target_amount: 800,
              points_reward: 350
            } as ChallengeTemplate,
            reason: 'Spending discipline',
            confidence: 75,
            estimatedDifficulty: 'medium' as const,
            personalizedMessage: 'Master your monthly budget with disciplined spending habits.',
            xpReward: 350,
            status: 'not_started' as const
          }
        ],
        // Set 2: Focus on weekly habits and smaller goals
        [
          {
            id: 'challenge_refresh_2_savings',
            template: {
              id: 'template_002',
              name: 'Weekly Savings Habit',
              description: 'Save $100 every week for 4 weeks',
              type: 'savings',
              difficulty: 'easy',
              duration_days: 28,
              target_amount: 400,
              points_reward: 250
            } as ChallengeTemplate,
            reason: 'Consistent savings',
            confidence: 90,
            estimatedDifficulty: 'easy' as const,
            personalizedMessage: 'Build a consistent weekly savings habit that sticks.',
            xpReward: 250,
            status: 'not_started' as const
          },
          {
            id: 'challenge_refresh_2_debt',
            template: {
              id: 'debt_reduction_starter',
              name: 'Debt Reduction Starter',
              description: 'Pay off $150 in credit card debt this month',
              type: 'debt_paydown',
              difficulty: 'medium',
              duration_days: 30,
              target_amount: 150,
              points_reward: 400
            } as ChallengeTemplate,
            reason: 'Debt reduction',
            confidence: 85,
            estimatedDifficulty: 'medium' as const,
            personalizedMessage: 'Start your debt-free journey with this manageable challenge.',
            xpReward: 400,
            status: 'not_started' as const
          },
          {
            id: 'challenge_refresh_2_spending',
            template: {
              id: 'weekly_spending_control',
              name: 'Weekly Spending Control',
              description: 'Keep weekly spending under $150 for 4 weeks',
              type: 'spending_limit',
              difficulty: 'easy',
              duration_days: 28,
              target_amount: 150,
              points_reward: 200
            } as ChallengeTemplate,
            reason: 'Spending discipline',
            confidence: 80,
            estimatedDifficulty: 'easy' as const,
            personalizedMessage: 'Develop better spending habits with weekly control.',
            xpReward: 200,
            status: 'not_started' as const
          }
        ],
        // Set 3: Focus on aggressive goals and investment
        [
          {
            id: 'challenge_refresh_3_savings',
            template: {
              id: 'savings_sprint',
              name: 'Monthly Savings Sprint',
              description: 'Save $750 this month to accelerate your goals',
              type: 'savings',
              difficulty: 'hard',
              duration_days: 30,
              target_amount: 750,
              points_reward: 450
            } as ChallengeTemplate,
            reason: 'Accelerated savings',
            confidence: 92,
            estimatedDifficulty: 'hard' as const,
            personalizedMessage: 'Push yourself with an aggressive monthly savings goal.',
            xpReward: 450,
            status: 'not_started' as const
          },
          {
            id: 'challenge_refresh_3_debt',
            template: {
              id: 'credit_card_crusher',
              name: 'Credit Card Crusher',
              description: 'Pay off $400 in credit card debt this month',
              type: 'debt_paydown',
              difficulty: 'hard',
              duration_days: 30,
              target_amount: 400,
              points_reward: 700
            } as ChallengeTemplate,
            reason: 'Aggressive debt reduction',
            confidence: 90,
            estimatedDifficulty: 'hard' as const,
            personalizedMessage: 'Crush your credit card debt with this aggressive challenge.',
            xpReward: 700,
            status: 'not_started' as const
          },
          {
            id: 'challenge_refresh_3_spending',
            template: {
              id: 'two_week_challenge',
              name: 'Two-Week Spending Challenge',
              description: 'Keep spending under $100 per week for 2 weeks',
              type: 'spending_limit',
              difficulty: 'medium',
              duration_days: 14,
              target_amount: 100,
              points_reward: 300
            } as ChallengeTemplate,
            reason: 'Intensive spending control',
            confidence: 85,
            estimatedDifficulty: 'medium' as const,
            personalizedMessage: 'Test your spending discipline with this intensive two-week challenge.',
            xpReward: 300,
            status: 'not_started' as const
          }
        ]
      ];
      
      // Select challenge set based on refresh counter
      const selectedSet = challengeSets[refreshCounter % challengeSets.length];
      newSuggestions.push(...selectedSet);

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleChallengeSelect = async (suggestion: SuggestedChallenge) => {
    try {
      await createChallenge(suggestion.template.id);
      
      // Update the suggestion status to 'started' to hide it from the list
      setSuggestions(prev => prev.map(s => 
        s.id === suggestion.id ? { ...s, status: 'started' } : s
      ));
      
      onChallengeSelect?.(suggestion);
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return colors.success;
    if (confidence >= 70) return colors.warning;
    return colors.error;
  };

  const generateDynamicTitle = (template: ChallengeTemplate, userBehavior: any) => {
    const { type, difficulty, target_amount, duration_days } = template;
    
    switch (type) {
      case 'savings':
        if (target_amount >= 1000) {
          return `Emergency Fund Builder`;
        } else if (target_amount >= 500) {
          return `Monthly Savings Sprint`;
        } else {
          return `Weekly Savings Habit`;
        }
      
      case 'debt_paydown':
        if (target_amount >= 500) {
          return `Debt Destroyer`;
        } else if (target_amount >= 200) {
          return `Credit Card Crusher`;
        } else {
          return `Debt Reduction Starter`;
        }
      
      case 'spending_limit':
        if (duration_days >= 30) {
          return `Monthly Budget Master`;
        } else if (duration_days >= 14) {
          return `Two-Week Spending Challenge`;
        } else {
          return `Weekly Spending Control`;
        }
      
      case 'emergency_fund':
        return `Financial Safety Net`;
      
      default:
        // Fallback to template name but remove "Goal" and "Challenge" words
        return template.name
          .replace(/Goal|Challenge|Target/gi, '')
          .trim()
          .replace(/\s+/g, ' ');
    }
  };

  const renderSuggestion = (suggestion: SuggestedChallenge, index: number) => {
    const isPressed = pressedCard === suggestion.id;
    
    return (
      <TouchableOpacity
        key={suggestion.id}
        style={[
          styles.challengeCard,
          { 
            backgroundColor: colors.innerCard,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: isPressed ? 0.98 : 1 }],
            shadowOpacity: isPressed ? 0.2 : 0.1,
          }
        ]}
        onPress={() => handleChallengeSelect(suggestion)}
        onPressIn={() => setPressedCard(suggestion.id)}
        onPressOut={() => setPressedCard(null)}
        activeOpacity={1}
      >
        {/* Top Row - Title and XP Badge */}
        <View style={styles.cardTopRow}>
          <Text style={[styles.challengeTitle, typography.subhead, { color: colors.text, fontWeight: '700', fontSize: 16 }]}>
            {generateDynamicTitle(suggestion.template, userBehavior)}
          </Text>
          <View style={[styles.xpBadge, { 
            backgroundColor: colors.primary,
            minWidth: Math.max(45, `${suggestion.xpReward}`.length * 8 + 20) // Dynamic width based on XP amount
          }]}>
            <Text 
              style={[styles.xpText, { color: '#FFFFFF', fontSize: 10, fontWeight: '700' }]}
              numberOfLines={1}
              adjustsFontSizeToFit={false}
            >
              +{suggestion.xpReward} XP
            </Text>
          </View>
        </View>

        {/* Middle Section - Description */}
        <View style={styles.cardMiddleSection}>
          <Text style={[styles.challengeDescription, typography.caption, { color: colors.textSecondary, fontWeight: '400', fontSize: 13 }]}>
            {suggestion.template.description}
          </Text>
          
          {/* Difficulty and Metadata Row */}
          <View style={styles.metadataRow}>
            <View style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(suggestion.estimatedDifficulty) }]}>
              <Zap size={8} color="#FFFFFF" />
              <Text style={[styles.difficultyText, typography.captionSmall, { color: '#FFFFFF' }]}>
                {suggestion.estimatedDifficulty.charAt(0).toUpperCase() + suggestion.estimatedDifficulty.slice(1)}
              </Text>
            </View>
            
            <Text style={[styles.metadataSeparator, { color: colors.textSecondary }]}>•</Text>
            
            <View style={styles.metadataItem}>
              <Clock size={8} color={colors.textSecondary} />
              <Text style={[styles.metadataText, typography.captionSmall, { color: colors.textSecondary }]}>
                {suggestion.template.duration_days} days
              </Text>
            </View>
            
            <Text style={[styles.metadataSeparator, { color: colors.textSecondary }]}>•</Text>
            
            <View style={styles.metadataItem}>
              <DollarSign size={8} color={colors.textSecondary} />
              <Text style={[styles.metadataText, typography.captionSmall, { color: colors.textSecondary }]}>
                {suggestion.template.target_amount} goal
              </Text>
            </View>
          </View>
          
          {suggestion.progressPercentage && suggestion.progressPercentage > 0 ? (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBadge, { backgroundColor: colors.success }]}>
                <Text style={[styles.progressText, typography.captionSmall, { color: '#FFFFFF' }]}>
                  {suggestion.progressPercentage}% Complete
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Bottom Section - Action Button */}
        <View style={styles.cardBottomSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleChallengeSelect(suggestion)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, typography.caption, { color: '#FFFFFF', fontWeight: '600' }]}>
              {suggestion.status === 'in_progress' ? 'View Progress' : 'Start Challenge'}
            </Text>
            <ArrowRight size={10} color="#FFFFFF" />
          </TouchableOpacity>
          
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <Card style={[styles.container, style] as any}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analyzing your progress...
          </Text>
        </View>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card style={[styles.container, style] as any}>
        <View style={styles.emptyContainer}>
          <Lightbulb size={32} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Suggestions Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete some challenges to get personalized suggestions!
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.container, style] as any}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Lightbulb size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Suggested Challenges
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
          {suggestions
            .filter(suggestion => suggestion.status !== 'started')
            .map((suggestion, index) => (
              <View key={suggestion.id}>
                {renderSuggestion(suggestion, index)}
              </View>
            ))}
        </ScrollView>
      </View>

      {/* Page Indicators */}
      {suggestions.filter(s => s.status !== 'started').length > 1 && (
        <View style={styles.pageIndicators}>
          {suggestions
            .filter(s => s.status !== 'started')
            .map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pageIndicator,
                { 
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  width: index === currentIndex ? 24 : 8,
                  opacity: index === currentIndex ? 1 : 0.4,
                }
              ]}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      )}

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
  challengeCard: {
    width: cardWidth,
    borderRadius: 12,
    padding: 16,
    marginRight: cardSpacing, // Only right margin for spacing between cards
    height: 170,
    backgroundColor: 'transparent', // Will be set dynamically based on theme
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  challengeTitle: {
    // Typography applied at component level
    flex: 1,
    marginRight: Spacing.xs,
    lineHeight: 18,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    flexShrink: 0, // Prevent badge from shrinking
  },
  xpText: {
    // Typography applied at component level
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false, // Remove extra padding for more precise sizing
  },
  cardMiddleSection: {
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  challengeDescription: {
    // Typography applied at component level
    lineHeight: 14,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
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
    // Typography applied at component level
    fontWeight: '600',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    justifyContent: 'center',
  },
  metadataText: {
    // Typography applied at component level
  },
  metadataSeparator: {
    fontSize: 12,
    fontWeight: '400',
  },
  progressContainer: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  progressBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    // Typography applied at component level
    fontWeight: '600',
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
    // Typography applied at component level
    fontWeight: '600',
  },
  actionSubtext: {
    // Typography applied at component level
    textAlign: 'center',
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
  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerText: {
    // Typography applied at component level
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
