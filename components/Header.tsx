import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import AddTransactionModal from '@/components/AddTransactionModal';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
}

export default function Header({ title, subtitle, showAddButton = false }: HeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const { theme } = useSettings();
  const Colors = useThemeColors(theme);
  
  return (
    <>
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: Colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        
        {showAddButton && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: Colors.primary }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={24} color={Colors.card} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
      
      <AddTransactionModal 
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.cardMargin, // 16px after safe area
    paddingTop: Spacing.cardMargin, // 16px margin-top after safe area
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26, // Balanced header font size
    fontWeight: '700', // Bold weight
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14, // Standard subtext size
    marginTop: Spacing.xs,
    fontWeight: '500', // Medium gray
    color: '#666', // Will be overridden by theme
    lineHeight: 18,
  },
  addButton: {
    width: Math.max(52, Spacing.minTouchTarget),
    height: Math.max(52, Spacing.minTouchTarget),
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.medium,
  },
});