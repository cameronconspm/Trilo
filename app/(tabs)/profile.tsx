import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useSettings } from '@/context/SettingsContext';
import { useFinance } from '@/context/FinanceContext';
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
    resetData,
    isLoading: settingsLoading
  } = useSettings();
  
  const { clearAllData, transactions, exportData } = useFinance();
  
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showWeekStartOptions, setShowWeekStartOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const handleThemeChange = async (newTheme: 'system' | 'light' | 'dark') => {
    try {
      await setTheme(newTheme);
      setShowThemeOptions(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save theme setting. Please try again.');
    }
  };
  
  const handleWeekStartChange = async (day: string) => {
    try {
      await setWeekStartDay(day as any);
      setShowWeekStartOptions(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save week start day. Please try again.');
    }
  };
  
  const handleBankConnection = async () => {
    if (isBankConnected) {
      Alert.alert(
        'Disconnect Bank Account',
        'Are you sure you want to disconnect your bank account? This will stop automatic transaction imports.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disconnect', 
            style: 'destructive',
            onPress: async () => {
              try {
                await disconnectBank();
                Alert.alert('Success', 'Bank account disconnected successfully.');
              } catch (error) {
                Alert.alert('Error', 'Failed to disconnect bank account. Please try again.');
              }
            }
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
            onPress: async () => {
              try {
                await connectBank();
                Alert.alert('Success', 'Bank account connected successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to connect bank account. Please try again.');
              }
            }
          }
        ]
      );
    }
  };
  
  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      `This will permanently delete all ${transactions.length} transactions and reset your financial data. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await resetData();
              Alert.alert('Success', 'All data has been reset successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleExportData = async () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'You have no transactions to export. Add some transactions first.');
      return;
    }
    
    try {
      setIsExporting(true);
      const exportedData = await exportData();
      
      // In a real app, you would use a sharing library like expo-sharing
      // For now, we'll just show a success message
      Alert.alert(
        'Export Complete', 
        `Successfully exported ${transactions.length} transactions. In a real app, this would save to your device or share via email.`,
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // In a real app, use expo-clipboard
              Alert.alert('Copied', 'Export data copied to clipboard (simulated)');
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const formatWeekStartDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };
  
  if (settingsLoading) {
    return (
      <View style={styles.container}>
        <Header title="Settings" subtitle="Loading..." />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }
  
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
              <Text style={styles.accountName}>Personal Account</Text>
              <Text style={styles.accountStatus}>
                {isBankConnected ? 'Bank Connected' : 'Local Account'}
              </Text>
              <Text style={styles.transactionCount}>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
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
            disabled={isExporting}
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
          <Text style={styles.storageInfo}>
            Data stored locally on your device
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.inactive,
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
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 13,
    color: Colors.inactive,
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
    marginBottom: Spacing.xs,
  },
  storageInfo: {
    fontSize: 11,
    color: Colors.inactive,
    fontStyle: 'italic',
  },
});