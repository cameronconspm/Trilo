import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface InsightCardProps {
  text: string;
}

export default function InsightCard({ text }: InsightCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <TrendingUp size={18} color={Colors.primary} strokeWidth={2.5} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadow.medium,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});