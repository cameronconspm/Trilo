import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
}

export default function Header({ title, subtitle, showAddButton = false }: HeaderProps) {
  const router = useRouter();
  
  const handleAddPress = () => {
    Alert.alert(
      'Add Transaction',
      'What would you like to add?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Expense', onPress: () => router.push('/add-expense') },
        { text: 'Add Income', onPress: () => router.push('/add-income') },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {showAddButton && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPress}
          activeOpacity={0.8}
        >
          <Plus size={24} color={Colors.background} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.screenTop,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.medium,
  },
});