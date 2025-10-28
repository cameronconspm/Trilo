import React from 'react';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';

interface BadgeProps {
  size?: number;
  variant?: 'static' | 'grayscale' | 'locked';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  showRarityBorder?: boolean;
}

// Debt Payoff Badge - Credit Conqueror
export function CreditConquerorBadge({ 
  size = 48, 
  variant = 'static', 
  rarity = 'common',
  showRarityBorder = false 
}: BadgeProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const isGrayscale = variant === 'grayscale' || variant === 'locked';
  
  const rarityColors = {
    common: { primary: '#6B7280', secondary: '#9CA3AF' },
    rare: { primary: '#3B82F6', secondary: '#60A5FA' },
    epic: { primary: '#8B5CF6', secondary: '#A78BFA' },
    legendary: { primary: '#F59E0B', secondary: '#FBBF24' }
  };
  
  const badgeColors = isGrayscale 
    ? { primary: '#9CA3AF', secondary: '#D1D5DB' }
    : rarityColors[rarity];

  return (
    <View style={[styles.badgeContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={badgeColors.primary} />
            <Stop offset="100%" stopColor={badgeColors.secondary} />
          </LinearGradient>
          {showRarityBorder && !isGrayscale && (
            <LinearGradient id="rarityBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={rarityColors[rarity].primary} />
              <Stop offset="50%" stopColor={rarityColors[rarity].secondary} />
              <Stop offset="100%" stopColor={rarityColors[rarity].primary} />
            </LinearGradient>
          )}
        </Defs>
        
        {/* Badge Background */}
        <Circle cx="24" cy="24" r="22" fill="url(#creditGradient)" />
        
        {/* Credit Card Icon */}
        <G transform="translate(12, 14)">
          <Path
            d="M24 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H24C25.1 20 26 19.1 26 18V6C26 4.9 25.1 4 24 4Z"
            fill={isGrayscale ? '#FFFFFF' : '#FFFFFF'}
            opacity={isGrayscale ? 0.8 : 1}
          />
          <Path
            d="M6 8H20V10H6V8Z"
            fill={isGrayscale ? '#9CA3AF' : '#1F2937'}
          />
          <Path
            d="M6 12H16V14H6V12Z"
            fill={isGrayscale ? '#9CA3AF' : '#1F2937'}
          />
          <Circle cx="20" cy="15" r="2" fill={isGrayscale ? '#9CA3AF' : '#EF4444'} />
        </G>
        
        {/* Rarity Border */}
        {showRarityBorder && !isGrayscale && (
          <Circle cx="24" cy="24" r="22" fill="none" stroke="url(#rarityBorder)" strokeWidth="2" />
        )}
      </Svg>
    </View>
  );
}

// Savings Milestone Badge - Emergency Hero
export function EmergencyHeroBadge({ 
  size = 48, 
  variant = 'static', 
  rarity = 'common',
  showRarityBorder = false 
}: BadgeProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const isGrayscale = variant === 'grayscale' || variant === 'locked';
  
  const rarityColors = {
    common: { primary: '#10B981', secondary: '#34D399' },
    rare: { primary: '#3B82F6', secondary: '#60A5FA' },
    epic: { primary: '#8B5CF6', secondary: '#A78BFA' },
    legendary: { primary: '#F59E0B', secondary: '#FBBF24' }
  };
  
  const badgeColors = isGrayscale 
    ? { primary: '#9CA3AF', secondary: '#D1D5DB' }
    : rarityColors[rarity];

  return (
    <View style={[styles.badgeContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="emergencyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={badgeColors.primary} />
            <Stop offset="100%" stopColor={badgeColors.secondary} />
          </LinearGradient>
          {showRarityBorder && !isGrayscale && (
            <LinearGradient id="rarityBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={rarityColors[rarity].primary} />
              <Stop offset="50%" stopColor={rarityColors[rarity].secondary} />
              <Stop offset="100%" stopColor={rarityColors[rarity].primary} />
            </LinearGradient>
          )}
        </Defs>
        
        {/* Badge Background */}
        <Circle cx="24" cy="24" r="22" fill="url(#emergencyGradient)" />
        
        {/* Shield Icon */}
        <G transform="translate(14, 12)">
          <Path
            d="M20 2L18 4H16V6H14V8H12V10H10V12H8V14H6V16H8V18H10V20H12V22H14V24H16V26H18V28H20V26H22V24H24V22H26V20H28V18H30V16H28V14H26V12H24V10H22V8H20V6H18V4H20V2Z"
            fill={isGrayscale ? '#FFFFFF' : '#FFFFFF'}
            opacity={isGrayscale ? 0.8 : 1}
          />
          <Path
            d="M16 8H14V10H16V8Z"
            fill={isGrayscale ? '#9CA3AF' : '#1F2937'}
          />
          <Path
            d="M18 10H12V12H18V10Z"
            fill={isGrayscale ? '#9CA3AF' : '#1F2937'}
          />
          <Path
            d="M20 12H10V14H20V12Z"
            fill={isGrayscale ? '#9CA3AF' : '#1F2937'}
          />
        </G>
        
        {/* Rarity Border */}
        {showRarityBorder && !isGrayscale && (
          <Circle cx="24" cy="24" r="22" fill="none" stroke="url(#rarityBorder)" strokeWidth="2" />
        )}
      </Svg>
    </View>
  );
}

// Spending Discipline Badge - No Spend Ninja
export function NoSpendNinjaBadge({ 
  size = 48, 
  variant = 'static', 
  rarity = 'common',
  showRarityBorder = false 
}: BadgeProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const isGrayscale = variant === 'grayscale' || variant === 'locked';
  
  const rarityColors = {
    common: { primary: '#6366F1', secondary: '#818CF8' },
    rare: { primary: '#3B82F6', secondary: '#60A5FA' },
    epic: { primary: '#8B5CF6', secondary: '#A78BFA' },
    legendary: { primary: '#F59E0B', secondary: '#FBBF24' }
  };
  
  const badgeColors = isGrayscale 
    ? { primary: '#9CA3AF', secondary: '#D1D5DB' }
    : rarityColors[rarity];

  return (
    <View style={[styles.badgeContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="ninjaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={badgeColors.primary} />
            <Stop offset="100%" stopColor={badgeColors.secondary} />
          </LinearGradient>
          {showRarityBorder && !isGrayscale && (
            <LinearGradient id="rarityBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={rarityColors[rarity].primary} />
              <Stop offset="50%" stopColor={rarityColors[rarity].secondary} />
              <Stop offset="100%" stopColor={rarityColors[rarity].primary} />
            </LinearGradient>
          )}
        </Defs>
        
        {/* Badge Background */}
        <Circle cx="24" cy="24" r="22" fill="url(#ninjaGradient)" />
        
        {/* Ninja Star Icon */}
        <G transform="translate(16, 16)">
          <Path
            d="M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6L8 0Z"
            fill={isGrayscale ? '#FFFFFF' : '#FFFFFF'}
            opacity={isGrayscale ? 0.8 : 1}
          />
          <Circle cx="8" cy="8" r="2" fill={isGrayscale ? '#9CA3AF' : '#1F2937'} />
        </G>
        
        {/* Rarity Border */}
        {showRarityBorder && !isGrayscale && (
          <Circle cx="24" cy="24" r="22" fill="none" stroke="url(#rarityBorder)" strokeWidth="2" />
        )}
      </Svg>
    </View>
  );
}

// Consistency & Streaks Badge - Streak Master
export function StreakMasterBadge({ 
  size = 48, 
  variant = 'static', 
  rarity = 'common',
  showRarityBorder = false 
}: BadgeProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const isGrayscale = variant === 'grayscale' || variant === 'locked';
  
  const rarityColors = {
    common: { primary: '#F59E0B', secondary: '#FBBF24' },
    rare: { primary: '#3B82F6', secondary: '#60A5FA' },
    epic: { primary: '#8B5CF6', secondary: '#A78BFA' },
    legendary: { primary: '#F59E0B', secondary: '#FBBF24' }
  };
  
  const badgeColors = isGrayscale 
    ? { primary: '#9CA3AF', secondary: '#D1D5DB' }
    : rarityColors[rarity];

  return (
    <View style={[styles.badgeContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={badgeColors.primary} />
            <Stop offset="100%" stopColor={badgeColors.secondary} />
          </LinearGradient>
          {showRarityBorder && !isGrayscale && (
            <LinearGradient id="rarityBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={rarityColors[rarity].primary} />
              <Stop offset="50%" stopColor={rarityColors[rarity].secondary} />
              <Stop offset="100%" stopColor={rarityColors[rarity].primary} />
            </LinearGradient>
          )}
        </Defs>
        
        {/* Badge Background */}
        <Circle cx="24" cy="24" r="22" fill="url(#streakGradient)" />
        
        {/* Flame Icon */}
        <G transform="translate(18, 14)">
          <Path
            d="M12 20C12 16.7 9.3 14 6 14C2.7 14 0 16.7 0 20C0 23.3 2.7 26 6 26C9.3 26 12 23.3 12 20Z"
            fill={isGrayscale ? '#FFFFFF' : '#FFFFFF'}
            opacity={isGrayscale ? 0.8 : 1}
          />
          <Path
            d="M6 8C6 4.7 8.7 2 12 2C15.3 2 18 4.7 18 8C18 11.3 15.3 14 12 14C8.7 14 6 11.3 6 8Z"
            fill={isGrayscale ? '#FFFFFF' : '#FFFFFF'}
            opacity={isGrayscale ? 0.8 : 1}
          />
          <Path
            d="M12 2C12 0.9 12.9 0 14 0C15.1 0 16 0.9 16 2C16 3.1 15.1 4 14 4C12.9 4 12 3.1 12 2Z"
            fill={isGrayscale ? '#FFFFFF' : '#FFFFFF'}
            opacity={isGrayscale ? 0.8 : 1}
          />
        </G>
        
        {/* Rarity Border */}
        {showRarityBorder && !isGrayscale && (
          <Circle cx="24" cy="24" r="22" fill="none" stroke="url(#rarityBorder)" strokeWidth="2" />
        )}
      </Svg>
    </View>
  );
}

// Level Badge Component
interface LevelBadgeProps {
  level: number;
  levelName: string;
  size?: number;
  showLevelNumber?: boolean;
}

export function LevelBadge({ 
  level, 
  levelName, 
  size = 32, 
  showLevelNumber = true 
}: LevelBadgeProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const getLevelTheme = (level: number) => {
    if (level >= 1 && level <= 2) return { color: '#CD7F32', name: 'Bronze' }; // Bronze
    if (level >= 3 && level <= 5) return { color: '#C0C0C0', name: 'Silver' }; // Silver
    if (level >= 6 && level <= 8) return { color: '#FFD700', name: 'Gold' }; // Gold
    if (level >= 9 && level <= 11) return { color: '#E5E4E2', name: 'Platinum' }; // Platinum
    return { color: '#B9F2FF', name: 'Diamond' }; // Diamond
  };
  
  const levelTheme = getLevelTheme(level);

  return (
    <View style={[styles.levelBadgeContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Defs>
          <LinearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={levelTheme.color} />
            <Stop offset="100%" stopColor={`${levelTheme.color}CC`} />
          </LinearGradient>
        </Defs>
        
        {/* Badge Background */}
        <Path
          d="M16 2C8.3 2 2 8.3 2 16C2 23.7 8.3 30 16 30C23.7 30 30 23.7 30 16C30 8.3 23.7 2 16 2Z"
          fill="url(#levelGradient)"
        />
        
        {/* Level Number */}
        {showLevelNumber && (
          <SvgText
            x="16"
            y="20"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            fill="#FFFFFF"
          >
            {level}
          </SvgText>
        )}
        
        {/* Border */}
        <Path
          d="M16 2C8.3 2 2 8.3 2 16C2 23.7 8.3 30 16 30C23.7 30 30 23.7 30 16C30 8.3 23.7 2 16 2Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Badge Factory Function
export function getBadgeComponent(badgeType: string) {
  switch (badgeType) {
    case 'credit_conqueror':
    case 'debt_buster':
    case 'debt_destroyer':
      return CreditConquerorBadge;
    case 'emergency_hero':
    case 'saver_star':
    case 'consistent_saver':
      return EmergencyHeroBadge;
    case 'no_spend_ninja':
    case 'spending_wise':
      return NoSpendNinjaBadge;
    case 'streak_master':
    case 'consistency':
      return StreakMasterBadge;
    default:
      return CreditConquerorBadge;
  }
}
