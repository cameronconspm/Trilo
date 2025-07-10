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
        <TrendingUp size={16} color={Colors.primary} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    ...Shadow.medium,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
});