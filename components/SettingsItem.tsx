import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

interface SettingsItemProps extends TouchableOpacityProps {
  title: string;
  value?: string;
  isDestructive?: boolean;
  isLast?: boolean;
}

export default function SettingsItem({ 
  title, 
  value, 
  isDestructive = false,
  isLast = false,
  ...props 
}: SettingsItemProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, isLast && styles.lastItem]} 
      activeOpacity={0.7}
      {...props}
    >
      <Text style={[
        styles.title,
        isDestructive && styles.destructiveText
      ]}>
        {title}
      </Text>
      <View style={styles.rightContent}>
        {value && <Text style={styles.value}>{value}</Text>}
        <ChevronRight size={18} color={Colors.inactive} />
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
    borderBottomColor: Colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    fontWeight: '500',
  },
  destructiveText: {
    color: Colors.error,
  },
});