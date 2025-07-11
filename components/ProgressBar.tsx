import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showPercentage?: boolean;
  label?: string;
}

export default function ProgressBar({
  progress,
  color,
  backgroundColor,
  height = 8,
  showPercentage = false,
  label,
}: ProgressBarProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const progressColor = color || colors.primary;
  const trackColor = backgroundColor || colors.border;
  
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          {showPercentage && (
            <Text style={[styles.percentage, { color: colors.text }]}>{clampedProgress.toFixed(0)}%</Text>
          )}
        </View>
      )}
      
      <View style={[
        styles.track,
        { backgroundColor: trackColor, height, borderRadius: height / 2 }
      ]}>
        <View style={[
          styles.fill,
          {
            backgroundColor: progressColor,
            width: `${clampedProgress}%`,
            height,
            borderRadius: height / 2,
          }
        ]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});