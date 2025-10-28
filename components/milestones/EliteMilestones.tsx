import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import { 
  Crown, 
  Gem, 
  Star, 
  Trophy,
  Target,
  DollarSign,
  Calendar,
  Award,
  Sparkles,
  TrendingUp,
  CreditCard,
  PiggyBank
} from 'lucide-react-native';

interface EliteMilestone {
  id: string;
  title: string;
  description: string;
  category: 'savings' | 'debt' | 'consistency' | 'achievement';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  target: number;
  current: number;
  isCompleted: boolean;
  completedDate?: string;
  pointsReward: number;
  icon: React.ReactNode;
}

interface EliteMilestonesProps {
  style?: any;
  onMilestonePress?: (milestone: EliteMilestone) => void;
}

export function EliteMilestones({ style, onMilestonePress }: EliteMilestonesProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { userBadges, completedChallenges, financialScore, activeChallenges, activeMicroGoals, completedMicroGoals } = useChallengeTracking();
  
  const [milestones, setMilestones] = useState<EliteMilestone[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate dynamic milestones based on user progress
  const generateDynamicMilestones = (): EliteMilestone[] => {
    // Calculate actual progress from user data
    const totalSavings = activeChallenges
      .filter(c => c.type === 'savings' || c.type === 'emergency_fund')
      .reduce((sum, c) => sum + (c.current_amount || 0), 0);

    const totalDebtPaid = activeChallenges
      .filter(c => c.type === 'debt_paydown')
      .reduce((sum, c) => sum + (c.current_amount || 0), 0);

    const challengesCompleted = completedChallenges.length;
    const completedGoalsCount = completedMicroGoals.length;
    const totalPoints = financialScore?.total_points || 0;

    return [
      {
        id: 'savings_bronze',
        title: 'Savings Starter',
        description: 'Save $500 total across all challenges',
        category: 'savings',
        tier: 'bronze',
        target: 500,
        current: Math.min(totalSavings, 500),
        isCompleted: totalSavings >= 500,
        pointsReward: 500,
        icon: <PiggyBank size={24} color="#CD7F32" />
      },
      {
        id: 'savings_silver',
        title: 'Savings Success',
        description: 'Save $1,500 total across all challenges',
        category: 'savings',
        tier: 'silver',
        target: 1500,
        current: Math.min(totalSavings, 1500),
        isCompleted: totalSavings >= 1500,
        pointsReward: 1000,
        icon: <DollarSign size={24} color="#C0C0C0" />
      },
      {
        id: 'savings_gold',
        title: 'Savings Master',
        description: 'Save $3,000 total across all challenges',
        category: 'savings',
        tier: 'gold',
        target: 3000,
        current: Math.min(totalSavings, 3000),
        isCompleted: totalSavings >= 3000,
        pointsReward: 1500,
        icon: <Star size={24} color="#FFD700" />
      },
      {
        id: 'savings_diamond',
        title: 'Savings Legend',
        description: 'Save $10,000 total across all challenges',
        category: 'savings',
        tier: 'diamond',
        target: 10000,
        current: Math.min(totalSavings, 10000),
        isCompleted: totalSavings >= 10000,
        pointsReward: 3000,
        icon: <Gem size={24} color="#2C3E50" />
      },
      {
        id: 'debt_bronze',
        title: 'Debt Fighter',
        description: 'Pay off $1,000 in total debt',
        category: 'debt',
        tier: 'bronze',
        target: 1000,
        current: Math.min(totalDebtPaid, 1000),
        isCompleted: totalDebtPaid >= 1000,
        pointsReward: 600,
        icon: <Target size={24} color="#CD7F32" />
      },
      {
        id: 'debt_silver',
        title: 'Debt Destroyer',
        description: 'Pay off $3,000 in total debt',
        category: 'debt',
        tier: 'silver',
        target: 3000,
        current: Math.min(totalDebtPaid, 3000),
        isCompleted: totalDebtPaid >= 3000,
        pointsReward: 1200,
        icon: <CreditCard size={24} color="#C0C0C0" />
      },
      {
        id: 'debt_gold',
        title: 'Debt Annihilator',
        description: 'Pay off $7,500 in total debt',
        category: 'debt',
        tier: 'gold',
        target: 7500,
        current: Math.min(totalDebtPaid, 7500),
        isCompleted: totalDebtPaid >= 7500,
        pointsReward: 2000,
        icon: <Trophy size={24} color="#FFD700" />
      },
      {
        id: 'debt_diamond',
        title: 'Debt Eliminator',
        description: 'Pay off $20,000 in total debt',
        category: 'debt',
        tier: 'diamond',
        target: 20000,
        current: Math.min(totalDebtPaid, 20000),
        isCompleted: totalDebtPaid >= 20000,
        pointsReward: 4000,
        icon: <Crown size={24} color="#2C3E50" />
      },
      {
        id: 'achievement_bronze',
        title: 'Challenge Newcomer',
        description: 'Complete 3 challenges successfully',
        category: 'achievement',
        tier: 'bronze',
        target: 3,
        current: Math.min(challengesCompleted, 3),
        isCompleted: challengesCompleted >= 3,
        pointsReward: 400,
        icon: <Award size={24} color="#CD7F32" />
      },
      {
        id: 'achievement_silver',
        title: 'Challenge Champion',
        description: 'Complete 10 challenges successfully',
        category: 'achievement',
        tier: 'silver',
        target: 10,
        current: Math.min(challengesCompleted, 10),
        isCompleted: challengesCompleted >= 10,
        pointsReward: 1000,
        icon: <Trophy size={24} color="#C0C0C0" />
      },
      {
        id: 'achievement_gold',
        title: 'Challenge Master',
        description: 'Complete 25 challenges successfully',
        category: 'achievement',
        tier: 'gold',
        target: 25,
        current: Math.min(challengesCompleted, 25),
        isCompleted: challengesCompleted >= 25,
        pointsReward: 2000,
        icon: <Star size={24} color="#FFD700" />
      },
      {
        id: 'achievement_diamond',
        title: 'Challenge Legend',
        description: 'Complete 50 challenges successfully',
        category: 'achievement',
        tier: 'diamond',
        target: 50,
        current: Math.min(challengesCompleted, 50),
        isCompleted: challengesCompleted >= 50,
        pointsReward: 5000,
        icon: <Gem size={24} color="#2C3E50" />
      },
      {
        id: 'consistency_bronze',
        title: 'Habit Builder',
        description: 'Complete 5 micro goals',
        category: 'consistency',
        tier: 'bronze',
        target: 5,
        current: Math.min(completedGoalsCount, 5),
        isCompleted: completedGoalsCount >= 5,
        pointsReward: 300,
        icon: <Calendar size={24} color="#CD7F32" />
      },
      {
        id: 'consistency_silver',
        title: 'Consistency Champion',
        description: 'Complete 15 micro goals',
        category: 'consistency',
        tier: 'silver',
        target: 15,
        current: Math.min(completedGoalsCount, 15),
        isCompleted: completedGoalsCount >= 15,
        pointsReward: 800,
        icon: <TrendingUp size={24} color="#C0C0C0" />
      },
      {
        id: 'consistency_gold',
        title: 'Consistency Master',
        description: 'Complete 30 micro goals',
        category: 'consistency',
        tier: 'gold',
        target: 30,
        current: Math.min(completedGoalsCount, 30),
        isCompleted: completedGoalsCount >= 30,
        pointsReward: 1500,
        icon: <Crown size={24} color="#FFD700" />
      },
      {
        id: 'consistency_diamond',
        title: 'Consistency Legend',
        description: 'Complete 50 micro goals',
        category: 'consistency',
        tier: 'diamond',
        target: 50,
        current: Math.min(completedGoalsCount, 50),
        isCompleted: completedGoalsCount >= 50,
        pointsReward: 3000,
        icon: <Gem size={24} color="#2C3E50" />
      }
    ];
  };

  useEffect(() => {
    const dynamicMilestones = generateDynamicMilestones();
    setMilestones(dynamicMilestones);
  }, [activeChallenges, completedChallenges, completedMicroGoals, financialScore]);

  const categories = [
    { id: 'all', name: 'All', icon: Crown },
    { id: 'savings', name: 'Savings', icon: DollarSign },
    { id: 'debt', name: 'Debt', icon: Target },
    { id: 'consistency', name: 'Consistency', icon: Calendar },
    { id: 'achievement', name: 'Achievement', icon: Trophy },
  ];

  const filteredMilestones = selectedCategory === 'all' 
    ? milestones 
    : milestones.filter(m => m.category === selectedCategory);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'diamond': return '#2C3E50'; // Dark blue-gray for better visibility
      default: return colors.primary;
    }
  };

  const getTierTextColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#FFFFFF';
      case 'silver': return '#FFFFFF';
      case 'gold': return '#FFFFFF';
      case 'diamond': return '#FFFFFF'; // White text on dark background
      default: return '#FFFFFF';
    }
  };

  const renderMilestone = (milestone: EliteMilestone) => {
    const progressPercentage = Math.min(100, (milestone.current / milestone.target) * 100);
    const tierColor = getTierColor(milestone.tier);
    const tierTextColor = getTierTextColor(milestone.tier);
    
    return (
      <TouchableOpacity
        key={milestone.id}
        onPress={() => onMilestonePress?.(milestone)}
        style={[
          styles.milestoneCard,
          { 
            backgroundColor: colors.innerCard,
            borderColor: colors.border,
          },
          milestone.isCompleted && styles.completedCard
        ]}
      >
        <View style={styles.milestoneHeader}>
          <View style={[styles.milestoneIcon, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {milestone.icon}
          </View>
          <View style={styles.milestoneInfo}>
            <View style={styles.milestoneTitleRow}>
              <Text style={[styles.milestoneTitle, { color: colors.text }]}>
                {milestone.title}
              </Text>
              {milestone.isCompleted && (
                <Sparkles size={16} color={tierColor} />
              )}
            </View>
            <Text style={[styles.milestoneDescription, { color: colors.textSecondary }]}>
              {milestone.description}
            </Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={[styles.tierText, { color: tierTextColor }]}>
              {milestone.tier.charAt(0).toUpperCase() + milestone.tier.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.milestoneProgress}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {milestone.current} / {milestone.target}
            </Text>
            <Text style={[styles.progressPercentage, { color: tierColor }]}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: tierColor
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.milestoneFooter}>
          <View style={styles.pointsReward}>
            <Award size={14} color={colors.primary} />
            <Text style={[styles.pointsText, { color: colors.primary }]}>
              {milestone.pointsReward} XP
            </Text>
          </View>
          {milestone.isCompleted && (
            <Text style={[styles.completedText, { color: colors.success }]}>
              ✓ Completed
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {categories.map((category) => {
        const IconComponent = category.icon;
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              { backgroundColor: colors.cardBackground },
              selectedCategory === category.id && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <IconComponent 
              size={16} 
              color={selectedCategory === category.id ? '#FFFFFF' : colors.textSecondary} 
            />
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === category.id ? '#FFFFFF' : colors.textSecondary }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const completedCount = milestones.filter(m => m.isCompleted).length;
  const totalCount = milestones.length;

  return (
    <Card style={[styles.container, style] as any}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Crown size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Elite Milestones
          </Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={[styles.statsText, { color: colors.primary }]}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      </View>

      {renderCategoryFilter()}

      <ScrollView 
        style={styles.milestonesList}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.milestonesContent}
      >
        {filteredMilestones.map(renderMilestone)}
      </ScrollView>

      {filteredMilestones.length === 0 && (
        <View style={styles.emptyContainer}>
          <Crown size={32} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Milestones Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Try selecting a different category
          </Text>
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
  statsBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryFilter: {
    marginBottom: Spacing.md,
  },
  categoryFilterContent: {
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  milestonesList: {
    height: 320,
  },
  milestonesContent: {
    gap: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  milestoneCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    backgroundColor: 'transparent', // Will be set dynamically based on theme
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  completedCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  milestoneDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  milestoneProgress: {
    marginBottom: Spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
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