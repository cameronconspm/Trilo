import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { 
  Building2,
  PiggyBank,
  CreditCard,
  DollarSign,
  Wallet,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  CheckCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { usePlaid, BankAccount } from '@/context/PlaidContext';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';
import Card from '@/components/layout/Card';
import Button from '@/components/layout/Button';

interface AccountCarouselProps {
  onAddAccount?: () => void;
  onRefresh?: () => void;
}

export function AccountCarousel({ onAddAccount, onRefresh }: AccountCarouselProps) {
  const { state, toggleBalances, refreshData } = usePlaid();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = Spacing.lg; // 16px padding on each side
  const cardSpacing = Spacing.md; // 12px spacing between cards
  const cardWidth = screenWidth - (2 * horizontalPadding); // Full width minus padding
  const totalCards = state.accounts.length + (state.accounts.length > 0 ? 1 : 0); // +1 for add account card

  // Calculate the snap interval for proper card centering
  const snapInterval = cardWidth + cardSpacing;

  // Handle scroll to update current index
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    setCurrentIndex(index);
  };

  // Handle scroll end to snap to closest card
  const handleScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / snapInterval);
    
    // Ensure index is within bounds
    const clampedIndex = Math.max(0, Math.min(index, totalCards - 1));
    
    // Snap to the closest card
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: clampedIndex * snapInterval,
        animated: true,
      });
    }
    setCurrentIndex(clampedIndex);
  };

  // Scroll to specific account
  const scrollToAccount = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, totalCards - 1));
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: clampedIndex * snapInterval,
        animated: true,
      });
    }
    setCurrentIndex(clampedIndex);
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await refreshData();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get account icon based on type
  const getAccountIcon = (account: BankAccount) => {
    const iconProps = { size: 20, color: colors.primary };
    
    switch (account.type) {
      case 'depository':
        if (account.subtype === 'checking') {
          return <Building2 {...iconProps} />;
        } else if (account.subtype === 'savings') {
          return <PiggyBank {...iconProps} />;
        }
        return <Wallet {...iconProps} />;
      case 'credit':
        return <CreditCard {...iconProps} />;
      case 'loan':
        return <DollarSign {...iconProps} />;
      default:
        return <Wallet {...iconProps} />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  // Get account type color
  const getAccountTypeColor = (account: BankAccount) => {
    switch (account.type) {
      case 'depository':
        if (account.subtype === 'checking') {
          return colors.primary;
        } else if (account.subtype === 'savings') {
          return colors.success;
        }
        return colors.textSecondary;
      case 'credit':
        return colors.error;
      case 'loan':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  // Render individual account card
  const renderAccountCard = (account: BankAccount, index: number) => (
    <View 
      key={account.id} 
      style={[
        styles.accountCardWrapper,
        { width: cardWidth }
      ]}
    >
      <Card style={styles.accountCard}>
        <View style={styles.accountCardHeader}>
          <View style={styles.accountCardInfo}>
            <Text style={[styles.accountCardName, { color: colors.text }]}>
              {account.name}
            </Text>
            <Text style={[styles.accountCardType, { color: colors.textSecondary }]}>
              {account.type} ••••{account.mask}
            </Text>
            {account.institution_name && (
              <Text style={[styles.accountCardInstitution, { color: colors.textTertiary }]}>
                {account.institution_name}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.balanceToggle}
            onPress={toggleBalances}
          >
            {state.showBalances ? 
              <Eye size={20} color={colors.textSecondary} /> : 
              <EyeOff size={20} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        </View>
        
        <View style={styles.accountCardBalanceSection}>
          <Text style={[styles.accountCardBalanceAmount, { color: colors.text }]}>
            {state.showBalances ? formatCurrency(account.current_balance) : '••••••'}
          </Text>
          <View style={styles.accountCardBalanceTrend}>
            <TrendingUp size={14} color={colors.success} />
            <Text style={[styles.accountCardTrendText, { color: colors.success }]}>
              Available: {state.showBalances ? formatCurrency(account.available_balance) : '••••••'}
            </Text>
          </View>
        </View>

        <View style={styles.accountCardIcon}>
          {getAccountIcon(account)}
        </View>
      </Card>
    </View>
  );

  // Render "Add Another Bank" card
  const renderAddAccountCard = () => (
    <View style={[
      styles.accountCardWrapper,
      { width: cardWidth }
    ] as any}>
      <Card style={[styles.accountCard, styles.addAccountCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}40` }] as any}>
        <TouchableOpacity 
          style={styles.addAccountContent}
          onPress={onAddAccount}
          activeOpacity={0.8}
        >
          <View style={[styles.addAccountIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Plus size={32} color={colors.primary} />
          </View>
          <Text style={[styles.addAccountTitle, { color: colors.text }]}>
            Add Another Bank
          </Text>
          <Text style={[styles.addAccountSubtitle, { color: colors.textSecondary }]}>
            Connect additional accounts for a complete financial picture
          </Text>
        </TouchableOpacity>
      </Card>
    </View>
  );

  // Render "Connect Bank" card when no accounts are connected
  const renderConnectBankCard = () => (
    <View style={[
      styles.accountCardWrapper,
      { width: cardWidth }
    ]}>
      <Card style={[styles.connectBankCard, { backgroundColor: colors.card }]} contentStyle={[styles.connectBankCardContent, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.connectBankContent}
          onPress={onAddAccount}
          activeOpacity={0.8}
        >
          <View style={[styles.connectBankIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Building2 size={24} color={colors.primary} />
          </View>
          <View style={styles.connectBankText}>
            <Text style={[styles.connectBankTitle, { color: colors.text }]}>
              Connect Your Bank
            </Text>
            <Text style={[styles.connectBankSubtitle, { color: colors.textSecondary }]}>
              Link your bank accounts to track balances and transactions
            </Text>
          </View>
          <View style={[styles.connectBankButton, { backgroundColor: `${colors.primary}20` }]}>
            <Plus size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </Card>
    </View>
  );

  // If no accounts, show only the connect bank card - centered without scroll
  if (state.accounts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.connectBankContainer}>
          <View style={styles.connectBankCardWrapper}>
            <Card style={[styles.connectBankCard, { backgroundColor: colors.card }]} contentStyle={[styles.connectBankCardContent, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={styles.connectBankContent}
                onPress={onAddAccount}
                activeOpacity={0.8}
              >
                <View style={[styles.connectBankIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <Building2 size={24} color={colors.primary} />
                </View>
                <View style={styles.connectBankText}>
                  <Text style={[styles.connectBankTitle, { color: colors.text }]}>
                    Connect Your Bank
                  </Text>
                  <Text style={[styles.connectBankSubtitle, { color: colors.textSecondary }]}>
                    Link your bank accounts to track balances and transactions
                  </Text>
                </View>
                <View style={[styles.connectBankButton, { backgroundColor: `${colors.primary}20` }]}>
                  <Plus size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </Card>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Account Cards ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="center"
        pagingEnabled={false}
        bounces={true}
        overScrollMode="auto"
        contentInsetAdjustmentBehavior="never"
      >
        {state.accounts.map((account, index) => renderAccountCard(account, index))}
        {renderAddAccountCard()}
      </ScrollView>
      
      {/* Page Indicators */}
      {(state.accounts.length + 1) > 1 && (
        <View style={styles.pageIndicators}>
          {[...state.accounts, { id: 'add' }].map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pageIndicator,
                {
                  backgroundColor: index === currentIndex 
                    ? colors.primary 
                    : colors.border
                }
              ]}
              onPress={() => scrollToAccount(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    // Remove horizontal padding - Banking tab's scrollContent already provides it
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncTime: {
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.7,
  },
  refreshButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scrollContainer: {
    paddingVertical: Spacing.sm,
    alignItems: 'center', // For horizontal scroll view
    // No horizontal padding - parent banking screen provides it
  },
  connectBankContainer: {
    paddingVertical: Spacing.sm,
    alignItems: 'stretch', // Allow card to stretch to full width
    // No horizontal padding - parent banking screen provides it
  },
  accountCardWrapper: {
    marginRight: Spacing.md, // Gap between cards
  },
  connectBankCardWrapper: {
    width: '100%', // Full width to match other cards
  },
  accountCard: {
    position: 'relative',
    marginBottom: Spacing.md, // Match other cards margin
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  accountCardInfo: {
    flex: 1,
  },
  accountCardName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountCardType: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 2,
  },
  accountCardInstitution: {
    fontSize: 12,
    fontWeight: '400',
  },
  balanceToggle: {
    padding: Spacing.xs,
  },
  accountCardBalanceSection: {
    marginBottom: Spacing.md,
  },
  accountCardBalanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  accountCardBalanceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountCardTrendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountCardIcon: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    opacity: 0.1,
  },
  addAccountCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addAccountContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBankCard: {
    marginBottom: Spacing.md, // Match other cards margin
  },
  connectBankCardContent: {
    padding: Spacing.md, // Match Active Challenges card padding
    backgroundColor: 'transparent', // Will be set dynamically based on theme
  },
  connectBankContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120, // Consistent height with other cards
  },
  connectBankIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: Spacing.sm,
  },
  connectBankText: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  connectBankTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  connectBankSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  connectBankButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  addAccountIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  addAccountTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  addAccountSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default AccountCarousel;

