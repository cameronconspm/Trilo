import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing } from '@/constants/spacing';

interface SettingsItemProps extends TouchableOpacityProps {
  title: string;
  value?: string;
  icon?: React.ReactElement;
  isDestructive?: boolean;
  isLast?: boolean;
}

export default function SettingsItem({ 
  title, 
  value, 
  icon,
  isDestructive = false,
  isLast = false,
  ...props 
}: SettingsItemProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  return (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: colors.border }, isLast && styles.lastItem]} 
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[
          styles.title,
          { color: colors.text },
          isDestructive && { color: colors.error }
        ]}>
          {title}
        </Text>
      </View>
      <View style={styles.rightContent}>
        {value && <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>}
        <ChevronRight size={18} color={colors.inactive} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 15,
    marginRight: Spacing.sm,
    fontWeight: '500',
  },
});