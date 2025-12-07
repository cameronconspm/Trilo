import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useChallengeTracking } from '@/context/ChallengeTrackingContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { ModalWrapper } from './ModalWrapper';
import Card from '@/components/layout/Card';
import Button from '@/components/layout/Button';
import { LevelBadge } from '@/components/badges';
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  Share as ShareIcon,
  X,
  Star,
  Zap,
  Award
} from 'lucide-react-native';
import { Animated } from 'react-native';

interface WeeklyRecapData {
  weekStart: string;
  weekEnd: string;
  debtPaidDown: number;
  savingsAdded: number;
  transactionsCategorized: number;
  challengesCompleted: number;
  pointsEarned: number;
  badgesUnlocked: number;
  levelProgress: {
    currentLevel: number;
    levelName: string;
    pointsToNext: number;
    progressPercentage: number;
  };
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  achievements: Array<{
    type: 'challenge' | 'badge' | 'milestone';
    title: string;
    description: string;
    points: number;
  }>;
}

interface WeeklyRecapModalProps {
  visible: boolean;
  onClose: () => void;
  data?: WeeklyRecapData;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Simple confetti pieces for animation
const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

export function WeeklyRecapModal({ visible, onClose, data }: WeeklyRecapModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { financialScore, userBadges, completedChallenges } = useChallengeTracking();
  
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiAnimations = useRef<Animated.Value[]>([]).current;
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Generate mock data if not provided
  const recapData: WeeklyRecapData = data || {
    weekStart: '2024-01-15',
    weekEnd: '2024-01-21',
    debtPaidDown: 150.00,
    savingsAdded: 200.00,
    transactionsCategorized: 23,
    challengesCompleted: 2,
    pointsEarned: 450,
    badgesUnlocked: 1,
    levelProgress: {
      currentLevel: financialScore?.current_level || 2,
      levelName: financialScore?.level_name || 'Apprentice',
      pointsToNext: 550,
      progressPercentage: 75
    },
    topCategories: [
      { name: 'Groceries', amount: 120.50, percentage: 35 },
      { name: 'Transportation', amount: 85.00, percentage: 25 },
      { name: 'Entertainment', amount: 65.75, percentage: 19 },
      { name: 'Utilities', amount: 45.25, percentage: 13 },
      { name: 'Other', amount: 28.50, percentage: 8 }
    ],
    achievements: [
      {
        type: 'challenge',
        title: 'Weekly Debt Paydown',
        description: 'Paid off $100 in debt this week',
        points: 150
      },
      {
        type: 'badge',
        title: 'Debt Buster',
        description: 'Earned your first debt payoff badge',
        points: 100
      },
      {
        type: 'milestone',
        title: 'Savings Streak',
        description: 'Saved money for 3 weeks in a row',
        points: 200
      }
    ]
  };

  useEffect(() => {
    if (visible) {
      // Start entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 15,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 15,
        }),
      ]).start();
      
      // Show confetti if there are achievements
      if (recapData.achievements.length > 0) {
        setTimeout(() => {
          setShowConfetti(true);
          // Create confetti animations
          confettiAnimations.length = 0; // Clear existing animations
          for (let i = 0; i < 20; i++) {
            const anim = new Animated.Value(0);
            confettiAnimations.push(anim);
            
            Animated.sequence([
              Animated.delay(i * 50),
              Animated.timing(anim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }, 500);
      }
    } else {
      // Reset animations
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      setShowConfetti(false);
    }
  }, [visible, scaleAnim, opacityAnim, slideAnim]);

  const handleShare = async () => {
    try {
      const shareMessage = `🏆 Weekly Financial Progress Report 🏆\n\n` +
        `💰 Debt Paid Down: $${recapData.debtPaidDown.toFixed(2)}\n` +
        `💎 Savings Added: $${recapData.savingsAdded.toFixed(2)}\n` +
        `🎯 Challenges Completed: ${recapData.challengesCompleted}\n` +
        `⭐ XP Earned: ${recapData.pointsEarned}\n` +
        `🏅 Badges Unlocked: ${recapData.badgesUnlocked}\n` +
        `📈 Level: ${recapData.levelProgress.levelName} (${recapData.levelProgress.currentLevel})\n\n` +
        `Keep up the great work! 💪`;

      if (Platform.OS === 'ios') {
        await Share.share({
          message: shareMessage,
          title: 'My Weekly Financial Progress',
        });
      } else {
        await Share.share({
          message: shareMessage,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { translateY: slideAnim }
    ],
    opacity: opacityAnim,
  };

  const renderStatCard = (icon: React.ReactNode, title: string, value: string, color: string) => (
    <Card style={[styles.statCard, { backgroundColor: colors.cardBackground }] as any}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <View style={styles.statText}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
      </View>
    </Card>
  );

  const renderConfettiPiece = (index: number) => {
    const color = confettiColors[index % confettiColors.length];
    const left = Math.random() * screenWidth;
    const animation = confettiAnimations[index];
    
    if (!animation) return null;
    
    const animatedStyle = {
      transform: [
        {
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -screenHeight],
          }),
        },
        {
          rotate: animation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
      ],
      opacity: animation.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 1, 1, 0],
      }),
    };
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.confettiPiece,
          {
            left,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    );
  };

  const renderAchievement = (achievement: any, index: number) => {
    const getIcon = () => {
      switch (achievement.type) {
        case 'challenge': return <Target size={20} color={colors.primary} />;
        case 'badge': return <Trophy size={20} color={colors.success} />;
        case 'milestone': return <Award size={20} color={colors.warning} />;
        default: return <Star size={20} color={colors.primary} />;
      }
    };

    return (
      <Animated.View
        key={achievement.title}
        style={[
          styles.achievementItem,
          { backgroundColor: colors.cardBackground },
          animatedStyle
        ]}
      >
        <View style={styles.achievementContent}>
          <View style={styles.achievementIcon}>
            {getIcon()}
          </View>
          <View style={styles.achievementText}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>
              {achievement.title}
            </Text>
            <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
              {achievement.description}
            </Text>
          </View>
          <View style={styles.achievementPoints}>
            <Text style={[styles.pointsText, { color: colors.primary }]}>
              +{achievement.points}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ModalWrapper visible={visible} onClose={onClose} animationType="fade" maxWidth={500}>
      <Animated.View style={[styles.container, animatedStyle]}>
          <Card style={[styles.modalCard, { backgroundColor: colors.cardBackground }] as any}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Calendar size={24} color={colors.primary} />
                <View style={styles.headerText}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Weekly Recap
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {new Date(recapData.weekStart).toLocaleDateString()} - {new Date(recapData.weekEnd).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Level Progress */}
              <Card style={[styles.levelCard, { backgroundColor: colors.primary + '10' }] as any}>
                <View style={styles.levelContent}>
                  <LevelBadge 
                    level={recapData.levelProgress.currentLevel}
                    levelName={recapData.levelProgress.levelName}
                    size={50}
                    showLevelNumber={true}
                  />
                  <View style={styles.levelInfo}>
                    <Text style={[styles.levelName, { color: colors.text }]}>
                      {recapData.levelProgress.levelName}
                    </Text>
                    <Text style={[styles.levelProgress, { color: colors.textSecondary }]}>
                      {recapData.levelProgress.progressPercentage}% to next level
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${recapData.levelProgress.progressPercentage}%`,
                            backgroundColor: colors.primary
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </Card>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                {renderStatCard(
                  <TrendingUp size={20} color={colors.success} />,
                  'Debt Paid Down',
                  `$${recapData.debtPaidDown.toFixed(2)}`,
                  colors.success
                )}
                {renderStatCard(
                  <DollarSign size={20} color={colors.primary} />,
                  'Savings Added',
                  `$${recapData.savingsAdded.toFixed(2)}`,
                  colors.primary
                )}
                {renderStatCard(
                  <Target size={20} color={colors.warning} />,
                  'Challenges Completed',
                  `${recapData.challengesCompleted}`,
                  colors.warning
                )}
                {renderStatCard(
                  <Star size={20} color={colors.secondary} />,
                  'Points Earned',
                  `${recapData.pointsEarned}`,
                  colors.secondary
                )}
              </View>

              {/* Achievements */}
              {recapData.achievements.length > 0 && (
                <View style={styles.achievementsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    🎉 This Week's Achievements
                  </Text>
                  {recapData.achievements.map((achievement, index) => 
                    renderAchievement(achievement, index)
                  )}
                </View>
              )}

              {/* Top Categories */}
              <View style={styles.categoriesSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  📊 Top Spending Categories
                </Text>
                {recapData.topCategories.map((category, index) => (
                  <View key={category.name} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {category.name}
                      </Text>
                      <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                        ${category.amount.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.categoryBar}>
                      <View 
                        style={[
                          styles.categoryBarFill,
                          { 
                            width: `${category.percentage}%`,
                            backgroundColor: colors.primary
                          }
                        ]} 
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Button
                title="Share Your Progress"
                onPress={handleShare}
                variant="primary"
                size="large"
                style={styles.shareButton}
              />
            </View>
          </Card>
          {/* Confetti Animation */}
          {showConfetti && (
            <View style={styles.confettiContainer}>
              {confettiAnimations.map((_, index) => renderConfettiPiece(index))}
            </View>
          )}
        </Animated.View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: screenHeight * 0.9,
  },
  modalCard: {
    borderRadius: BorderRadius.lg,
    ...Shadow.heavy,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    maxHeight: screenHeight * 0.6,
  },
  levelCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  levelProgress: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    marginBottom: Spacing.sm,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  achievementsSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  achievementItem: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadow.light,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  achievementPoints: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoriesSection: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  categoryItem: {
    marginBottom: Spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  shareButton: {
    width: '100%',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: screenHeight,
  },
});
