import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing } from '@/constants/spacing';

interface SettingsItemProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactElement;
  isDestructive?: boolean;
  isLast?: boolean;
}

export default function SettingsItem({ 
  title, 
  subtitle,
  value, 
  icon,
  isDestructive = false,
  isLast = false,
  disabled = false,
  ...props 
}: SettingsItemProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { borderBottomColor: colors.border }, 
        isLast && styles.lastItem,
        disabled && { opacity: 0.5 }
      ]} 
      activeOpacity={0.7}
      disabled={disabled}
      {...props}
    >
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            { color: colors.text },
            isDestructive && { color: colors.error }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
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
  textContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 16,
  },
});