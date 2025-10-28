import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { Spacing, BorderRadius, Shadow, getResponsiveTypography } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import { BadgeAnalytics } from './BadgeAnalytics';
import { 
  CreditConquerorBadge, 
  EmergencyHeroBadge, 
  NoSpendNinjaBadge, 
  StreakMasterBadge,
  getBadgeComponent 
} from './BadgeComponents';
import { BadgeUnlockAnimation, MicroAnimation } from './BadgeAnimations';
import { X, Filter, Trophy, Star, Zap, Shield } from 'lucide-react-native';
import { UserBadge } from '@/types/finance';

interface BadgeGalleryModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

// Badge categories for filtering
const badgeCategories = [
  { id: 'all', name: 'All', icon: Trophy },
  { id: 'debt_paydown', name: 'Debt Payoff', icon: Shield },
  { id: 'savings', name: 'Savings', icon: Star },
  { id: 'consistency', name: 'Consistency', icon: Zap },
  { id: 'milestone', name: 'Milestones', icon: Trophy },
];

export function BadgeGalleryModal({ visible, onClose }: BadgeGalleryModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { userBadges, completedChallenges, completedMicroGoals, activeChallenges, financialScore } = useChallengeTracking();
  const typography = getResponsiveTypography(screenWidth);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Removed selectedBadge state - badges are now display-only
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // Generate dynamic badges based on user progress
  const allBadges = useMemo(() => {
    // Calculate user progress
    const totalSavings = activeChallenges
      .filter(c => c.type === 'savings' || c.type === 'emergency_fund')
      .reduce((sum, c) => sum + (c.current_amount || 0), 0);

    const totalDebtPaid = activeChallenges
      .filter(c => c.type === 'debt_paydown')
      .reduce((sum, c) => sum + (c.current_amount || 0), 0);

    const challengesCompleted = completedChallenges.length;
    const goalsCompleted = completedMicroGoals.length;
    const totalPoints = financialScore?.total_points || 0;

    return [
      // Debt Payoff Badges
      {
        id: 'debt_buster',
        name: 'Debt Buster',
        description: 'Pay off your first $100 in debt',
        category: 'debt_paydown',
        rarity: 'common',
        isEarned: totalDebtPaid >= 100,
        progress: Math.min(totalDebtPaid, 100),
        target: 100
      },
      {
        id: 'debt_destroyer',
        name: 'Debt Destroyer',
        description: 'Pay off $1,000 in debt',
        category: 'debt_paydown',
        rarity: 'rare',
        isEarned: totalDebtPaid >= 1000,
        progress: Math.min(totalDebtPaid, 1000),
        target: 1000
      },
      {
        id: 'credit_card_conqueror',
        name: 'Credit Conqueror',
        description: 'Pay off $5,000 in debt',
        category: 'debt_paydown',
        rarity: 'epic',
        isEarned: totalDebtPaid >= 5000,
        progress: Math.min(totalDebtPaid, 5000),
        target: 5000
      },
      
      // Savings Badges
      {
        id: 'first_saver',
        name: 'First Saver',
        description: 'Save your first $100',
        category: 'savings',
        rarity: 'common',
        isEarned: totalSavings >= 100,
        progress: Math.min(totalSavings, 100),
        target: 100
      },
      {
        id: 'saver_star',
        name: 'Saver Star',
        description: 'Save $1,000 total',
        category: 'savings',
        rarity: 'rare',
        isEarned: totalSavings >= 1000,
        progress: Math.min(totalSavings, 1000),
        target: 1000
      },
      {
        id: 'emergency_hero',
        name: 'Emergency Hero',
        description: 'Build $5,000 emergency fund',
        category: 'savings',
        rarity: 'epic',
        isEarned: totalSavings >= 5000,
        progress: Math.min(totalSavings, 5000),
        target: 5000
      },
      
      // Consistency Badges
      {
        id: 'consistent_saver',
        name: 'Consistent Saver',
        description: 'Complete 5 micro goals',
        category: 'consistency',
        rarity: 'rare',
        isEarned: goalsCompleted >= 5,
        progress: Math.min(goalsCompleted, 5),
        target: 5
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Complete 10 micro goals',
        category: 'consistency',
        rarity: 'epic',
        isEarned: goalsCompleted >= 10,
        progress: Math.min(goalsCompleted, 10),
        target: 10
      },
      
      // Achievement Badges
      {
        id: 'challenge_newcomer',
        name: 'Challenge Newcomer',
        description: 'Complete your first challenge',
        category: 'milestone',
        rarity: 'common',
        isEarned: challengesCompleted >= 1,
        progress: Math.min(challengesCompleted, 1),
        target: 1
      },
      {
        id: 'challenge_champion',
        name: 'Challenge Champion',
        description: 'Complete 5 challenges',
        category: 'milestone',
        rarity: 'rare',
        isEarned: challengesCompleted >= 5,
        progress: Math.min(challengesCompleted, 5),
        target: 5
      },
      {
        id: 'challenge_master',
        name: 'Challenge Master',
        description: 'Complete 10 challenges',
        category: 'milestone',
        rarity: 'epic',
        isEarned: challengesCompleted >= 10,
        progress: Math.min(challengesCompleted, 10),
        target: 10
      },
      {
        id: 'challenge_legend',
        name: 'Challenge Legend',
        description: 'Complete 20 challenges',
        category: 'milestone',
        rarity: 'legendary',
        isEarned: challengesCompleted >= 20,
        progress: Math.min(challengesCompleted, 20),
        target: 20
      },
      
      // Points Badges
      {
        id: 'points_collector',
        name: 'Points Collector',
        description: 'Earn 1,000 total points',
        category: 'milestone',
        rarity: 'common',
        isEarned: totalPoints >= 1000,
        progress: Math.min(totalPoints, 1000),
        target: 1000
      },
      {
        id: 'points_accumulator',
        name: 'Points Accumulator',
        description: 'Earn 5,000 total points',
        category: 'milestone',
        rarity: 'rare',
        isEarned: totalPoints >= 5000,
        progress: Math.min(totalPoints, 5000),
        target: 5000
      },
      {
        id: 'points_master',
        name: 'Points Master',
        description: 'Earn 10,000 total points',
        category: 'milestone',
        rarity: 'epic',
        isEarned: totalPoints >= 10000,
        progress: Math.min(totalPoints, 10000),
        target: 10000
      },
      {
        id: 'points_legend',
        name: 'Points Legend',
        description: 'Earn 25,000 total points',
        category: 'milestone',
        rarity: 'legendary',
        isEarned: totalPoints >= 25000,
        progress: Math.min(totalPoints, 25000),
        target: 25000
      }
    ];
  }, [activeChallenges, completedChallenges, completedMicroGoals, financialScore]);

  // Filter badges based on selected category
  const filteredBadges = allBadges.filter(badge => 
    selectedCategory === 'all' || badge.category === selectedCategory
  );

  // Check if badge is earned
  const isBadgeEarned = useCallback((badgeId: string) => {
    const badge = allBadges.find(b => b.id === badgeId);
    return badge?.isEarned || false;
  }, [allBadges]);

  // Get badge data
  const getBadgeData = useCallback((badgeId: string) => {
    return allBadges.find(b => b.id === badgeId);
  }, [allBadges]);

  // Badges are now display-only (non-clickable)

  const getBadgePoints = (rarity: string) => {
    switch (rarity) {
      case 'common': return 100;
      case 'rare': return 250;
      case 'epic': return 500;
      case 'legendary': return 1000;
      default: return 100;
    }
  };

  const renderBadgeItem = ({ item: badge }: { item: any }) => {
    const BadgeComponent = getBadgeComponent(badge.id);
    const progressPercentage = Math.round((badge.progress / badge.target) * 100);
    
    return (
      <View
        style={[
          styles.badgeItem,
          { backgroundColor: colors.cardBackground },
          badge.isEarned && styles.earnedBadgeItem,
        ]}
      >
        <MicroAnimation trigger={badge.isEarned}>
          <BadgeComponent
            size={48}
            variant={badge.isEarned ? 'static' : 'locked'}
            rarity={badge.rarity}
            showRarityBorder={badge.isEarned}
          />
        </MicroAnimation>
        
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeName, typography.subhead, { color: colors.text }]}>
            {badge.name}
          </Text>
          <Text style={[styles.badgeDescription, typography.caption, { color: colors.textSecondary }]}>
            {badge.description}
          </Text>
          
          {badge.isEarned ? (
            <View style={styles.earnedInfo}>
              <Text style={[styles.earnedDate, typography.captionSmall, { color: colors.success }]}>
                ✓ Earned
              </Text>
              <Text style={[styles.earnedPoints, typography.captionSmall, { color: colors.primary }]}>
                {getBadgePoints(badge.rarity)} XP
              </Text>
            </View>
          ) : (
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, typography.captionSmall, { color: colors.textTertiary }]}>
                Progress: {badge.progress}/{badge.target} ({progressPercentage}%)
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: colors.primary
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
        
        {/* Rarity indicator */}
        <View style={[
          styles.rarityIndicator,
          { backgroundColor: getRarityColor(badge.rarity) }
        ]}>
          <Text style={styles.rarityText}>
            {badge.rarity.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilterContainer}>
      <Text style={[styles.filterTitle, typography.subhead, { color: colors.text }]}>
        Filter by Category
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {badgeCategories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <IconComponent 
                size={16} 
                color={isSelected ? '#FFFFFF' : colors.textSecondary} 
              />
              <Text style={[
                styles.categoryButtonText,
                typography.caption,
                { color: isSelected ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, typography.h2, { color: colors.text }]}>
            Badge Gallery
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge Analytics */}
          <BadgeAnalytics />

          {/* Category Filter */}
          {renderCategoryFilter()}

          {/* Section Divider */}
          <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

          {/* Badge List */}
          <View style={styles.badgeList}>
            {filteredBadges.map((badge) => (
              <View key={badge.id}>
                {renderBadgeItem({ item: badge })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Badge Detail Modal */}
        {/* Badge detail modal removed - badges are now display-only */}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    // Typography applied at component level
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  categoryFilterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterTitle: {
    // Typography applied at component level
  },
  categoryFilter: {
    // ScrollView styles
  },
  categoryFilterContent: {
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    minHeight: 44, // Apple HIG minimum touch target
  },
  categoryButtonText: {
    // Typography applied at component level
  },
  sectionDivider: {
    height: 1,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  badgeList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadow.light,
    minHeight: 80, // Consistent height for better visual balance
  },
  earnedBadgeItem: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  badgeInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: Spacing.xs,
  },
  badgeName: {
    // Typography applied at component level
    fontWeight: '600',
  },
  badgeDescription: {
    // Typography applied at component level
    lineHeight: 18,
  },
  earnedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  earnedDate: {
    // Typography applied at component level
  },
  earnedPoints: {
    // Typography applied at component level
    fontWeight: '600',
  },
  progressInfo: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  progressText: {
    // Typography applied at component level
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  rarityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  detailModal: {
    width: '100%',
    maxWidth: 320,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  detailDescription: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  detailInfo: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
});