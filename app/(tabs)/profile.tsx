import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useSettings } from '@/context/SettingsContext';
import { useFinance } from '@/context/FinanceContext';
import { useAlert } from '@/hooks/useAlert';
import Header from '@/components/Header';
import SettingsItem from '@/components/SettingsItem';
import Card from '@/components/Card';
import Button from '@/components/Button';
import AlertModal from '@/components/AlertModal';
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
  const { alertState, showAlert, hideAlert } = useAlert();
  
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showWeekStartOptions, setShowWeekStartOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const handleThemeChange = async (newTheme: 'system' | 'light' | 'dark') => {
    try {
      await setTheme(newTheme);
      setShowThemeOptions(false);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to save theme setting. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };
  
  const handleWeekStartChange = async (day: string) => {
    try {
      await setWeekStartDay(day as any);
      setShowWeekStartOptions(false);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to save week start day. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
    }
  };
  
  const handleBankConnection = async () => {
    if (isBankConnected) {
      showAlert({
        title: 'Disconnect Bank Account',
        message: 'Are you sure you want to disconnect your bank account? This will stop automatic transaction imports.',
        type: 'warning',
        actions: [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          { 
            text: 'Disconnect', 
            onPress: async () => {
              try {
                await disconnectBank();
                showAlert({
                  title: 'Success',
                  message: 'Bank account disconnected successfully.',
                  type: 'success',
                  actions: [{ text: 'OK', onPress: () => {} }],
                });
              } catch (error) {
                showAlert({
                  title: 'Error',
                  message: 'Failed to disconnect bank account. Please try again.',
                  type: 'error',
                  actions: [{ text: 'OK', onPress: () => {} }],
                });
              }
            },
            style: 'destructive'
          }
        ],
      });
    } else {
      showAlert({
        title: 'Connect Bank Account',
        message: 'Connect your bank account to automatically import transactions and get real-time balance updates.',
        type: 'info',
        actions: [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          { 
            text: 'Connect', 
            onPress: async () => {
              try {
                await connectBank();
                showAlert({
                  title: 'Success',
                  message: 'Bank account connected successfully!',
                  type: 'success',
                  actions: [{ text: 'OK', onPress: () => {} }],
                });
              } catch (error) {
                showAlert({
                  title: 'Error',
                  message: 'Failed to connect bank account. Please try again.',
                  type: 'error',
                  actions: [{ text: 'OK', onPress: () => {} }],
                });
              }
            }
          }
        ],
      });
    }
  };
  
  const handleResetData = () => {
    showAlert({
      title: 'Reset All Data',
      message: `This will permanently delete all ${transactions.length} transactions and reset your financial data. This action cannot be undone.`,
      type: 'warning',
      actions: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { 
          text: 'Reset Everything', 
          onPress: async () => {
            try {
              await clearAllData();
              await resetData();
              showAlert({
                title: 'Success',
                message: 'All data has been reset successfully.',
                type: 'success',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            } catch (error) {
              showAlert({
                title: 'Error',
                message: 'Failed to reset data. Please try again.',
                type: 'error',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
          style: 'destructive'
        }
      ],
    });
  };
  
  const handleExportData = async () => {
    if (transactions.length === 0) {
      showAlert({
        title: 'No Data',
        message: 'You have no transactions to export. Add some transactions first.',
        type: 'info',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
      return;
    }
    
    try {
      setIsExporting(true);
      const exportedData = await exportData();
      
      showAlert({
        title: 'Export Complete',
        message: `Successfully exported ${transactions.length} transactions. In a real app, this would save to your device or share via email.`,
        type: 'success',
        actions: [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              showAlert({
                title: 'Copied',
                message: 'Export data copied to clipboard (simulated)',
                type: 'success',
                actions: [{ text: 'OK', onPress: () => {} }],
              });
            }
          },
          { text: 'OK', onPress: () => {} }
        ],
      });
    } catch (error) {
      showAlert({
        title: 'Export Failed',
        message: 'Failed to export your data. Please try again.',
        type: 'error',
        actions: [{ text: 'OK', onPress: () => {} }],
      });
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
    <>
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
              onPress={() => showAlert({
                title: 'Notifications',
                message: 'Push notification settings would open here with options for budget alerts, bill reminders, and weekly summaries.',
                type: 'info',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
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
              onPress={() => showAlert({
                title: 'Privacy Policy',
                message: 'Privacy policy would open here.',
                type: 'info',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
            />
            
            <SettingsItem 
              title="Terms of Service" 
              onPress={() => showAlert({
                title: 'Terms of Service',
                message: 'Terms of service would open here.',
                type: 'info',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
              isLast
            />
          </Card>
          
          {/* Help & Support */}
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <Card variant="subtle">
            <SettingsItem 
              title="Help Center" 
              onPress={() => showAlert({
                title: 'Help Center',
                message: 'Help articles and tutorials would open here.',
                type: 'info',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
            />
            
            <SettingsItem 
              title="Contact Support" 
              onPress={() => showAlert({
                title: 'Contact Support',
                message: 'Support contact form would open here with options for email, chat, or phone support.',
                type: 'info',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
            />
            
            <SettingsItem 
              title="Send Feedback" 
              onPress={() => showAlert({
                title: 'Send Feedback',
                message: 'Feedback form would open here to help improve the app.',
                type: 'info',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
            />
            
            <SettingsItem 
              title="Rate App" 
              onPress={() => showAlert({
                title: 'Rate App',
                message: 'App store rating would open here.',
                type: 'info',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
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
              onPress={() => showAlert({
                title: 'Delete Account',
                message: 'Account deletion would permanently remove all data and cannot be undone. Contact support for assistance.',
                type: 'warning',
                actions: [{ text: 'OK', onPress: () => {} }],
              })}
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
      
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        actions={alertState.actions}
        onClose={hideAlert}
      />
    </>
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