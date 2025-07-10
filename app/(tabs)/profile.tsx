import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useSettings } from '@/context/SettingsContext';
import Header from '@/components/Header';
import SettingsItem from '@/components/SettingsItem';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

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
        'Are you sure you want to disconnect your bank account? This will stop automatic transaction imports.',
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
        'Connect your bank account to automatically import transactions and get real-time balance updates.',
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
      'This will permanently delete all your financial data including transactions, budgets, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: resetData
        }
      ]
    );
  };
  
  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your financial data as a CSV file for backup or analysis.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Export data') }
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
        {/* Account Overview */}
        <Card variant="elevated" style={styles.accountCard}>
          <View style={styles.accountInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>User Account</Text>
              <Text style={styles.accountStatus}>
                {isBankConnected ? 'Bank Connected' : 'Local Account'}
              </Text>
            </View>
          </View>
          
          <View style={styles.accountActions}>
            <Button
              title={isBankConnected ? 'Disconnect Bank' : 'Connect Bank'}
              onPress={handleBankConnection}
              variant={isBankConnected ? 'outline' : 'primary'}
              size="medium"
            />
          </View>
        </Card>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
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
              title="Appearance" 
              value={theme.charAt(0).toUpperCase() + theme.slice(1)}
              onPress={() => setShowThemeOptions(true)}
            />
          )}
          
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
              title="Week starts on" 
              value={formatWeekStartDay(weekStartDay)}
              onPress={() => setShowWeekStartOptions(true)}
            />
          )}
          
          <SettingsItem 
            title="Notifications" 
            onPress={() => Alert.alert('Notifications', 'Push notification settings would open here with options for budget alerts, bill reminders, and weekly summaries.')}
            isLast
          />
        </Card>
        
        {/* Data & Privacy */}
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <Card variant="subtle">
          <SettingsItem 
            title="Export Data" 
            onPress={handleExportData}
          />
          
          <SettingsItem 
            title="Privacy Policy" 
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy would open here.')}
          />
          
          <SettingsItem 
            title="Terms of Service" 
            onPress={() => Alert.alert('Terms of Service', 'Terms of service would open here.')}
            isLast
          />
        </Card>
        
        {/* Help & Support */}
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <Card variant="subtle">
          <SettingsItem 
            title="Help Center" 
            onPress={() => Alert.alert('Help Center', 'Help articles and tutorials would open here.')}
          />
          
          <SettingsItem 
            title="Contact Support" 
            onPress={() => Alert.alert('Contact Support', 'Support contact form would open here with options for email, chat, or phone support.')}
          />
          
          <SettingsItem 
            title="Send Feedback" 
            onPress={() => Alert.alert('Send Feedback', 'Feedback form would open here to help improve the app.')}
          />
          
          <SettingsItem 
            title="Rate App" 
            onPress={() => Alert.alert('Rate App', 'App store rating would open here.')}
            isLast
          />
        </Card>
        
        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Card variant="subtle">
          <SettingsItem 
            title="Reset all data" 
            isDestructive
            onPress={handleResetData}
          />
          
          <SettingsItem 
            title="Delete account" 
            isDestructive
            onPress={() => Alert.alert('Delete Account', 'Account deletion would permanently remove all data and cannot be undone. Contact support for assistance.')}
            isLast
          />
        </Card>
        
        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Finance Tracker</Text>
        </View>
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
  accountCard: {
    marginBottom: Spacing.lg,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.card,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  accountStatus: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  accountActions: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.sectionSpacing,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: Spacing.xs,
  },
  appCopyright: {
    fontSize: 12,
    color: Colors.inactive,
  },
});