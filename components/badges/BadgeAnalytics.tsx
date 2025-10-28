import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { Spacing, BorderRadius, getResponsiveTypography } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import { Trophy, Clock, Target, TrendingUp } from 'lucide-react-native';

interface BadgeAnalyticsProps {
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export function BadgeAnalytics({ style }: BadgeAnalyticsProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { userBadges, completedChallenges, completedMicroGoals, activeChallenges, financialScore } = useChallengeTracking();
  const typography = getResponsiveTypography(screenWidth);

  // Calculate analytics data based on actual user progress
  const analytics = useMemo(() => {
    // Calculate total available badges based on user progress
    const totalAvailableBadges = 16; // Total badges that can be earned
    const earnedBadges = userBadges.length;
    const lockedBadges = totalAvailableBadges - earnedBadges;
    
    // Calculate completion percentage
    const completionPercentage = totalAvailableBadges > 0 
      ? Math.round((earnedBadges / totalAvailableBadges) * 100) 
      : 0;
    
    // Rarity breakdown based on actual earned badges
    const rarityBreakdown = {
      common: userBadges.filter(b => b.badge_type === 'debt_paydown' || b.badge_type === 'savings').length,
      rare: userBadges.filter(b => b.badge_type === 'consistency').length,
      epic: userBadges.filter(b => b.badge_type === 'milestone').length,
      legendary: userBadges.filter(b => b.badge_type === 'streak').length,
    };

    // Category breakdown based on actual earned badges
    const categoryBreakdown = {
      debt_paydown: userBadges.filter(b => b.badge_type === 'debt_paydown').length,
      savings: userBadges.filter(b => b.badge_type === 'savings').length,
      consistency: userBadges.filter(b => b.badge_type === 'consistency').length,
      milestone: userBadges.filter(b => b.badge_type === 'milestone').length,
      streak: userBadges.filter(b => b.badge_type === 'streak').length,
    };

    // Calculate average completion time based on actual completed challenges
    const averageCompletionTime = completedChallenges.length > 0 
      ? completedChallenges.reduce((sum, challenge) => {
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.completion_date);
          const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + daysDiff;
        }, 0) / completedChallenges.length
      : 0;

    // Find most earned category
    const mostEarnedCategory = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0] || ['none', 0];

    return {
      totalBadges: totalAvailableBadges,
      earnedBadges,
      lockedBadges,
      completionPercentage,
      rarityBreakdown,
      categoryBreakdown,
      averageCompletionTime,
      mostEarnedCategory,
    };
  }, [userBadges, completedChallenges]);

  const renderLegendOnly = (data: Record<string, number>, colorArray: string[]) => {
    return (
      <View style={styles.legend}>
        {Object.entries(data).map(([key, value], index) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colorArray[index] }]} />
            <Text style={[styles.legendText, typography.caption, { color: colors.textSecondary }]}>
              {key.replace('_', ' ')} ({value})
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStatItem = (icon: React.ReactNode, title: string, value: string, color: string) => (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, typography.currencySmall, { color }]}>{value}</Text>
        <Text style={[styles.statTitle, typography.caption, { color: colors.textTertiary }]}>
          {title}
        </Text>
      </View>
    </View>
  );

  const rarityColors = [colors.success, colors.primary, colors.warning, colors.secondary];
  const categoryColors = [colors.error, colors.success, colors.primary, colors.warning, colors.secondary];

  return (
    <Card style={[styles.container, style] as any}>
      <View style={styles.header}>
        <Trophy size={20} color={colors.primary} />
        <Text style={[styles.title, typography.h3, { color: colors.text }]}>
          Badge Analytics
        </Text>
      </View>

      <View style={styles.content}>
        {/* Main Stats */}
        <View style={styles.mainStats}>
          {renderStatItem(
            <Trophy size={16} color={colors.success} />,
            'Badges Earned',
            `${analytics.earnedBadges}/${analytics.totalBadges}`,
            colors.success
          )}
          {renderStatItem(
            <Target size={16} color={colors.primary} />,
            'Completion Rate',
            `${analytics.completionPercentage}%`,
            colors.primary
          )}
          {renderStatItem(
            <Clock size={16} color={colors.warning} />,
            'Avg. Time',
            `${Math.round(analytics.averageCompletionTime)} days`,
            colors.warning
          )}
          {renderStatItem(
            <TrendingUp size={16} color={colors.secondary} />,
            'Top Category',
            analytics.mostEarnedCategory[0].replace('_', ' '),
            colors.secondary
          )}
        </View>

        {/* Breakdown Sections */}
        <View style={styles.breakdownSection}>
          {/* Rarity Breakdown */}
          <View style={styles.breakdownContainer}>
            <Text style={[styles.breakdownTitle, typography.subhead, { color: colors.text }]}>
              Rarity Breakdown
            </Text>
            {renderLegendOnly(analytics.rarityBreakdown, rarityColors)}
          </View>

          {/* Category Breakdown */}
          <View style={styles.breakdownContainer}>
            <Text style={[styles.breakdownTitle, typography.subhead, { color: colors.text }]}>
              Category Breakdown
            </Text>
            {renderLegendOnly(analytics.categoryBreakdown, categoryColors)}
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.progressSummary}>
          <Text style={[styles.summaryTitle, typography.subhead, { color: colors.text }]}>
            Progress Summary
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              {/* Only show progress fill if completion percentage > 0 */}
              {analytics.completionPercentage > 0 && (
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${analytics.completionPercentage}%`,
                      backgroundColor: colors.primary
                    }
                  ]} 
                />
              )}
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, typography.captionSmall, { color: colors.textTertiary }]}>
                0%
              </Text>
              <Text style={[styles.progressLabel, typography.captionSmall, { color: colors.textTertiary }]}>
                {analytics.totalBadges} Total
              </Text>
            </View>
          </View>
          <Text style={[styles.summaryText, typography.caption, { color: colors.textSecondary }]}>
            {analytics.lockedBadges} badges remaining to unlock
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  title: {
    // Typography applied at component level
  },
  content: {
    gap: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  mainStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    gap: Spacing.md,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    // Typography applied at component level
  },
  statTitle: {
    // Typography applied at component level
  },
  breakdownSection: {
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'space-between',
  },
  breakdownContainer: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  breakdownTitle: {
    // Typography applied at component level
  },
  legend: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    // Typography applied at component level
  },
  progressSummary: {
    gap: Spacing.md,
  },
  summaryTitle: {
    // Typography applied at component level
  },
  progressContainer: {
    gap: Spacing.sm,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    // Typography applied at component level
  },
  summaryText: {
    // Typography applied at component level
    textAlign: 'center',
  },
});