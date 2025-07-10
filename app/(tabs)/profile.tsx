import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSettings } from '@/context/SettingsContext';
import Header from '@/components/Header';
import SettingsItem from '@/components/SettingsItem';
import Card from '@/components/Card';
import Colors from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

export default function ProfileScreen() {
  const { 
    theme, 
    setTheme, 
    weekStartDay, 
    setWeekStartDay,
    isBankConnected,
    connectBank,
    disconnectBank,
    resetData
  } = useSettings();
  
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showWeekStartOptions, setShowWeekStartOptions] = useState(false);
  
  const handleThemeChange = (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    setShowThemeOptions(false);
  };
  
  const handleWeekStartChange = (day: string) => {
    setWeekStartDay(day as any);
    setShowWeekStartOptions(false);
  };
  
  const handleBankConnection = () => {
    if (isBankConnected) {
      Alert.alert(
        'Disconnect Bank Account',
        'Are you sure you want to disconnect your bank account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disconnect', 
            style: 'destructive',
            onPress: disconnectBank
          }
        ]
      );
    } else {
      Alert.alert(
        'Connect Bank Account',
        'This feature connects to your bank for automatic transaction import.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Connect', 
            onPress: connectBank
          }
        ]
      );
    }
  };
  
  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your financial data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetData
        }
      ]
    );
  };
  
  const formatWeekStartDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };
  
  return (
    <View style={styles.container}>
      <Header title="Settings" subtitle="Preferences & account" />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card variant="subtle">
          {showThemeOptions ? (
            <>
              <SettingsItem 
                title="System (Default)" 
                onPress={() => handleThemeChange('system')}
              />
              <SettingsItem 
                title="Light" 
                onPress={() => handleThemeChange('light')}
              />
              <SettingsItem 
                title="Dark" 
                onPress={() => handleThemeChange('dark')}
                isLast
              />
            </>
          ) : (
            <SettingsItem 
              title="Color Theme" 
              value={theme.charAt(0).toUpperCase() + theme.slice(1)}
              onPress={() => setShowThemeOptions(true)}
              isLast
            />
          )}
        </Card>
        
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card variant="subtle">
          <SettingsItem 
            title="Notifications" 
            onPress={() => Alert.alert('Notifications', 'Notification settings would open here.')}
          />
          
          <SettingsItem 
            title="Bank Account" 
            value={isBankConnected ? 'Connected' : 'Not Connected'}
            onPress={handleBankConnection}
          />
          
          {showWeekStartOptions ? (
            <>
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day, index, array) => (
                <SettingsItem 
                  key={day}
                  title={formatWeekStartDay(day)} 
                  onPress={() => handleWeekStartChange(day)}
                  isLast={index === array.length - 1}
                />
              ))}
            </>
          ) : (
            <SettingsItem 
              title="Week start day" 
              value={formatWeekStartDay(weekStartDay)}
              onPress={() => setShowWeekStartOptions(true)}
              isLast
            />
          )}
        </Card>
        
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <Card variant="subtle">
          <SettingsItem 
            title="Contact Support" 
            onPress={() => Alert.alert('Contact Support', 'Support contact options would open here.')}
          />
          
          <SettingsItem 
            title="Knowledge Base" 
            onPress={() => Alert.alert('Knowledge Base', 'Help articles would open here.')}
          />
          
          <SettingsItem 
            title="FAQs" 
            onPress={() => Alert.alert('FAQs', 'Frequently asked questions would open here.')}
            isLast
          />
        </Card>
        
        <Text style={styles.sectionTitle}>Data</Text>
        <Card variant="subtle">
          <SettingsItem 
            title="Reset data" 
            isDestructive
            onPress={handleResetData}
          />
          
          <SettingsItem 
            title="Deactivate account" 
            isDestructive
            onPress={() => Alert.alert('Deactivate Account', 'Account deactivation would be handled here.')}
          />
          
          <SettingsItem 
            title="Delete account" 
            isDestructive
            onPress={() => Alert.alert('Delete Account', 'Account deletion would be handled here.')}
            isLast
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
});