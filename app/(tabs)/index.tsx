import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinance } from '@/context/FinanceContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/constants/colors';
import Header from '@/components/Header';
import Card from '@/components/Card';
import CircularProgress from '@/components/CircularProgress';
import CategoryCard from '@/components/CategoryCard';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';
import AddTransactionModal from '@/components/AddTransactionModal';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { Transaction, CategoryType } from '@/types/finance';

// Define spending categories for the transaction view
const SPENDING_CATEGORIES = [
  { id: 'shopping', name: 'Shopping', color: '#FF6B6B' },
  { id: 'food_drinks', name: 'Food & Drinks', color: '#4ECDC4' },
  { id: 'services', name: 'Services', color: '#45B7D1' },
  { id: 'transportation', name: 'Transportation', color: '#96CEB4' },
  { id: 'entertainment', name: 'Entertainment', color: '#FFEAA7' },
  { id: 'other', name: 'Other', color: '#DDA0DD' },
] as const;

export default function OverviewScreen() {
  const { weeklyOverview, transactions, isLoading } = useFinance();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | undefined>(undefined);
  const [preselectedCategory, setPreselectedCategory] = useState<CategoryType | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [isBankConnected, setIsBankConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { weekIncome, remainingBalance, utilization, contributions, upcomingExpenses, pastExpenses, currentPayPeriod } = weeklyOverview;
  
  // Get current month and year
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  
  const hasContributions = Object.keys(contributions).length > 0;
  const hasUpcomingExpenses = upcomingExpenses.length > 0;
  const hasPastExpenses = pastExpenses.length > 0;
  
  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowAddModal(true);
  };
  
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditTransaction(undefined);
    setPreselectedCategory(undefined);
  };

  const handleCategoryCardPress = (category: CategoryType) => {
    setPreselectedCategory(category);
    setShowAddModal(true);
  };

  const handleBankConnect = () => {
    Alert.alert(
      'Connect Your Bank',
      'This will launch Plaid Link to securely connect your bank account and automatically import transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Connect', 
          onPress: () => {
            // TODO: Implement Plaid Link or bank connection flow
            console.log('Connecting to bank...');
            // For now, simulate connection
            setTimeout(() => {
              setIsBankConnected(true);
              Alert.alert('Success', 'Bank account connected successfully!');
            }, 1000);
          }
        }
      ]
    );
  };

  const handleBankSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    console.log('Syncing bank data...');
    
    // TODO: Implement actual bank data sync
    // For now, simulate sync
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert('Success', 'Bank data synced successfully! New transactions have been imported.');
    }, 2000);
  };

  // Calculate spending by category for current pay period
  const spendingByCategory = useMemo(() => {
    const today = new Date();
    const currentPayPeriodTransactions = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const transactionDate = new Date(t.date);
      // For now, use current month as pay period approximation
      return transactionDate.getMonth() === today.getMonth() && 
             transactionDate.getFullYear() === today.getFullYear();
    });

    // Map existing categories to spending categories (simplified mapping)
    const categoryMapping: Record<string, string> = {
      'bill': 'services',
      'subscription': 'services', 
      'debt': 'other',
      'one_time_expense': 'shopping',
      'given_expenses': 'other',
    };

    const spending: Record<string, number> = {};
    SPENDING_CATEGORIES.forEach(cat => {
      spending[cat.id] = 0;
    });

    currentPayPeriodTransactions.forEach(transaction => {
      const mappedCategory = categoryMapping[transaction.category] || 'other';
      spending[mappedCategory] += transaction.amount;
    });

    return spending;
  }, [transactions]);

  // Get recent transactions (last 10 transactions)
  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);
  
  if (isLoading) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Header 
          title={`${month} ${year}`}
          subtitle={currentPayPeriod || 'No pay period'}
          showAddButton
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.inactive }]}>Loading...</Text>
        </View>
      </SafeAreaView>
      </>
    );
  }
  
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header 
        title={`${month} ${year}`}
        subtitle={currentPayPeriod || 'No pay period'}
        showAddButton={activeTab === 'overview'}
        showBankButton={activeTab === 'transactions'}
        isBankConnected={isBankConnected}
        isSyncing={isSyncing}
        onBankConnect={handleBankConnect}
        onBankSync={handleBankSync}
      />
      
      {/* Tab Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: colors.cardSecondary }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && { backgroundColor: colors.card },
            activeTab === 'overview' && styles.activeTab
          ]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'overview' ? colors.text : colors.textSecondary }
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'transactions' && { backgroundColor: colors.card },
            activeTab === 'transactions' && styles.activeTab
          ]}
          onPress={() => setActiveTab('transactions')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'transactions' ? colors.text : colors.textSecondary }
          ]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
      >
        {activeTab === 'overview' ? (
          <>
            <Card variant="elevated" style={styles.incomeCard}>
              <View style={styles.incomeContainer}>
                <View style={styles.incomeTextContainer}>
                  <Text style={[styles.incomeLabel, { color: colors.textSecondary }]}>Pay period income</Text>
                  <Text style={[styles.incomeValue, { color: colors.text }]}>
                    ${weekIncome > 0 ? weekIncome.toFixed(2) : '0.00'}
                  </Text>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Remaining balance</Text>
                  <Text style={[
                    styles.balanceValue,
                    { color: colors.text },
                    remainingBalance < 0 && { color: colors.error }
                  ]}>
                    ${remainingBalance.toFixed(2)}
                  </Text>
                </View>
                <CircularProgress 
                  percentage={utilization} 
                  size={100} 
                  color={utilization > 90 ? colors.warning : colors.primary}
                />
              </View>
            </Card>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pay Period Contributions</Text>
            <View style={styles.categoryGrid}>
              {(['bill', 'subscription', 'debt', 'given_expenses', 'one_time_expense'] as const).map((categoryId) => {
                const data = contributions[categoryId] || { total: 0, count: 0 };
                return (
                  <CategoryCard 
                    key={categoryId}
                    category={categoryId} 
                    amount={data.total}
                    count={data.count}
                    onPress={() => handleCategoryCardPress(categoryId)}
                  />
                );
              })}
            </View>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Expenses</Text>
            <Card variant="default">
              {hasUpcomingExpenses ? (
                upcomingExpenses.map((expense, index) => (
                  <TransactionItem 
                    key={expense.id} 
                    transaction={expense}
                    isLast={index === upcomingExpenses.length - 1}
                    onEdit={handleEditTransaction}
                    enableSwipeActions={true}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="trending"
                  title="No upcoming expenses"
                  subtitle="You're all caught up for this pay period!"
                />
              )}
            </Card>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Past Expenses</Text>
            <Card variant="default">
              {hasPastExpenses ? (
                pastExpenses.map((expense, index) => (
                  <TransactionItem 
                    key={expense.id} 
                    transaction={expense}
                    isLast={index === pastExpenses.length - 1}
                    onEdit={handleEditTransaction}
                    enableSwipeActions={true}
                    isPastExpense={true}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="clock"
                  title="No past expenses"
                  subtitle="Past expenses from this pay period will appear here"
                />
              )}
            </Card>
          </>
        ) : (
          <>
            {/* Spending Overview Card */}
            <Card variant="elevated" style={styles.incomeCard}>
              <View style={styles.incomeContainer}>
                <View style={styles.incomeTextContainer}>
                  <Text style={[styles.incomeLabel, { color: colors.textSecondary }]}>Total Spent</Text>
                  <Text style={[styles.incomeValue, { color: colors.text }]}>
                    ${Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.spendingChartContainer}>
                  {Object.values(spendingByCategory).some(amount => amount > 0) ? (
                    <View style={[styles.pieChartPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.pieChartText, { color: colors.background }]}>
                        Chart
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.emptyPieChart, { backgroundColor: colors.cardSecondary }]}>
                      <Text style={[styles.emptyPieChartText, { color: colors.textSecondary }]}>
                        No spending data
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>

            {/* Spending Categories Grid */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Categories</Text>
            <View style={styles.spendingCategoryGrid}>
              {SPENDING_CATEGORIES.map((category) => (
                <View key={category.id} style={[styles.spendingCategoryCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryAmount, { color: colors.text }]}>
                    ${spendingByCategory[category.id]?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Recent Transactions Section */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <Card variant="default">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction}
                    isLast={index === recentTransactions.length - 1}
                    onEdit={handleEditTransaction}
                    enableSwipeActions={true}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="clock"
                  title="No recent transactions"
                  subtitle="Your recent expense transactions will appear here"
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>
      
      <AddTransactionModal 
        visible={showAddModal}
        onClose={handleCloseModal}
        editTransaction={editTransaction}
        preselectedCategory={preselectedCategory}
      />
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal, // 16px horizontal padding
    paddingTop: Spacing.cardMargin, // 16px padding between header and first card
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  incomeCard: {
    minHeight: 120, // Equal height for all cards
  },
  incomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 120, // Consistent card height
  },
  incomeTextContainer: {
    flex: 1,
  },
  incomeLabel: {
    fontSize: 14, // Standard subheader font
    marginBottom: Spacing.xs,
    fontWeight: '500', // Medium gray
    lineHeight: 18,
  },
  incomeValue: {
    fontSize: 28, // Balanced large currency display
    fontWeight: '700',
    marginBottom: Spacing.lg,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
    fontWeight: '500',
    lineHeight: 18,
  },
  balanceValue: {
    fontSize: 20, // Balanced medium currency display
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20, // Balanced header font
    fontWeight: '600', // Bold
    marginTop: Spacing.sectionSpacing, // 24px between sections
    marginBottom: Spacing.lg, // 16px before cards
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, // Optimized gap for 3-column layout
    justifyContent: 'space-between',
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screenHorizontal,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    ...Shadow.light,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  spendingCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  spendingCategoryCard: {
    width: '31%', // Approximately 1/3 width with gaps
    height: 100,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadow.light,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  budgetHeader: {
    marginBottom: Spacing.lg,
  },
  budgetTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
    fontWeight: '500',
    lineHeight: 18,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  spendingChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pieChartPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  emptyPieChart: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPieChartText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});