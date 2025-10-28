import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Bell } from 'lucide-react-native';
import AddTransactionModal from '@/components/modals/AddTransactionModal';
import { useThemeColors, getThemeColors, Theme } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useReminders } from '@/context/ReminderContext';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  showReminderButton?: boolean;
  onReminderPress?: () => void;
}

export default function Header({
  title,
  subtitle,
  showAddButton = false,
  showReminderButton = false,
  onReminderPress,
}: HeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const { spacing, typography } = useResponsiveDesign();
  
  // Add error boundary for context hooks
  let theme: Theme;
  let Colors;
  let reminders: any[] = [];
  
  try {
    const settingsContext = useSettings();
    theme = (settingsContext?.theme as Theme) || 'light';
    Colors = useThemeColors(theme);
    
    // Always call useReminders hook, but only use the result when needed
    const reminderContext = useReminders();
    reminders = reminderContext?.reminders || [];
  } catch (error) {
    console.warn('Header: Context not available:', error);
    // Fallback values
    theme = 'light';
    Colors = getThemeColors('light');
    reminders = [];
  }

  // Styles with Apple HIG design
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: SpacingValues.screenHorizontal,
      paddingBottom: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      ...Typography.largeTitle, // Apple's Large Title style
      color: Colors.text,
    },
    subtitle: {
      ...Typography.bodySmall,
      marginTop: Spacing.xs,
      fontWeight: '500',
      color: Colors.textSecondary,
    },
    addButton: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.full, // Fully rounded Apple-style
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      ...Shadow.medium, // Apple-style shadow
    },
    reminderButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.cardSecondary,
      borderWidth: 1,
      borderColor: Colors.border,
      marginRight: Spacing.sm,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <>
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        {(showAddButton || showReminderButton) && (
          <View style={styles.buttonContainer}>
            {showReminderButton && (
              <TouchableOpacity
                style={styles.reminderButton}
                onPress={onReminderPress}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Bell 
                  size={20} 
                  color={reminders?.filter(r => !r.isCompleted).length > 0 ? Colors.primary : Colors.textSecondary} 
                  strokeWidth={2} 
                />
              </TouchableOpacity>
            )}
            
            {showAddButton && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowModal(true)}
                activeOpacity={0.8}
              >
                <Plus size={24} color={Colors.card} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <AddTransactionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
