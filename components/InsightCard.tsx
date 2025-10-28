import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';

interface InsightCardProps {
  text: string;
  isLast?: boolean;
}

export default function InsightCard({ text, isLast = false }: InsightCardProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { spacing } = useResponsiveDesign();

  return (
    <View
      style={[
        styles.container,
        { 
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          minHeight: 56, // Consistent item height as specified
        },
        isLast && styles.lastItem,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.cardSecondary },
        ]}
      >
        <TrendingUp size={18} color={colors.textSecondary} strokeWidth={2} />
      </View>
      <Text 
        style={[styles.text, { color: colors.text }]}
        numberOfLines={0} // Allow multiline as specified
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // Match TransactionItem spacing
    borderBottomWidth: 1,
    minHeight: 56, // Consistent item height as specified
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0, // Prevent icon from shrinking
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
    textAlign: 'left', // Ensure left alignment
  },
});
