import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
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
  color = Colors.primary,
  backgroundColor = Colors.border,
  height = 8,
  showPercentage = false,
  label,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{clampedProgress.toFixed(0)}%</Text>
          )}
        </View>
      )}
      
      <View style={[
        styles.track,
        { backgroundColor, height, borderRadius: height / 2 }
      ]}>
        <View style={[
          styles.fill,
          {
            backgroundColor: color,
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
    color: Colors.textSecondary,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});