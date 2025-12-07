import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BarChart3, CreditCard, LineChart, User } from 'lucide-react-native';
import { Platform, useColorScheme, StatusBar, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import { useSettings } from '@/context/SettingsContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SavingsProvider } from '@/context/SavingsContext';
import { UINotificationProvider } from '@/context/UINotificationContext';
import { ReminderProvider } from '@/context/ReminderContext';
import { ChallengeProvider } from '@/context/ChallengeTrackingContext';
import { PlaidProvider } from '@/context/PlaidContext';
import { TutorialProvider } from '@/context/TutorialContext';
import NotificationContainer from '@/components/NotificationContainer';
import { useAuth } from '@/context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from '@/context/SubscriptionContext';
import { BlockingPaywallModal } from '@/components/modals/BlockingPaywallModal';
import { TooltipOverlay } from '@/components/onboarding/TooltipOverlay';
import { TutorialService } from '@/services/TutorialService';
import { SUBSCRIPTIONS_ENABLED } from '@/constants/features';

function StatusBarManager() {
  const { theme } = useSettings();
  
  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      // For iOS, explicitly ensure status bar is visible and uses correct style
      StatusBar.setHidden(false, 'fade'); // Explicitly show status bar with fade animation
      StatusBar.setBarStyle(
        theme === 'dark' ? 'light-content' : 'dark-content',
        true // animated
      );
      // iOS status bar shows native UI elements (time, battery, wifi) when not hidden
    } else if (Platform.OS === 'android') {
      // For Android, set both style and background
      StatusBar.setHidden(false, 'fade'); // Explicitly show status bar
      StatusBar.setBarStyle(
        theme === 'dark' ? 'light-content' : 'dark-content',
        true // animated
      );
      StatusBar.setBackgroundColor(
        theme === 'dark' ? '#000000' : '#ffffff',
        true // animated
      );
      StatusBar.setTranslucent(false);
    }
  }, [theme]);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <StatusBar
      barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={Platform.OS === 'android' ? (theme === 'dark' ? '#000000' : '#ffffff') : 'transparent'}
      translucent={Platform.OS === 'android' ? false : undefined}
      hidden={false}
    />
  );
}

// Memoized icon components to prevent recreation on every render
const TabIcon = React.memo<{ 
  Icon: typeof Home; 
  focused: boolean; 
  color: string; 
}>(({ Icon, focused, color }) => (
  <Icon
    size={24}
    color={color}
    strokeWidth={focused ? 2.5 : 2}
    style={iconStyle.base}
  />
));
TabIcon.displayName = 'TabIcon';

// Static icon style to prevent recreation
const iconStyle = StyleSheet.create({
  base: {
    marginBottom: -2, // Nudge icon up slightly
  },
});

function TabLayoutContent() {
  const { theme } = useSettings();
  const systemColorScheme = useColorScheme();
  const colors = useThemeColors(theme);
  const { spacing } = useResponsiveDesign();
  const insets = useSafeAreaInsets();
  
  // Wrap tabs in themed container to prevent white flash
  const TabsWrapper = React.useCallback(({ children }: { children: React.ReactNode }) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </View>
  ), [colors.background]);

  // Dynamic theme colors that respect system appearance
  const activeColor = colors.primary; // Brand blue
  const inactiveColor = colors.textSecondary; // Theme secondary gray
  
  // Safe-area spacing calculations
  const tabBarHeight = 56 + insets.bottom;
  const tabBarPaddingBottom = Math.max(6, insets.bottom - 2);
  const tabBarPaddingTop = 6; // Small top padding
  
  // Memoize tab bar style to prevent recreation on every render
  const tabBarStyle = React.useMemo(() => ({
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: tabBarHeight,
    paddingBottom: tabBarPaddingBottom,
    paddingTop: tabBarPaddingTop,
    paddingHorizontal: spacing.tabHorizontal,
    elevation: 0,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  }), [colors.card, colors.border, colors.shadowColor, tabBarHeight, tabBarPaddingBottom, tabBarPaddingTop, spacing.tabHorizontal]);
  
  // Memoize tab bar item style to prevent recreation
  const tabBarItemStyle = React.useMemo(() => ({
    paddingVertical: 8, // Ensure tap targets remain ≥44x44
    minHeight: 44, // Minimum touch target size
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 2, // Reduced padding to fit 5 tabs
  }), []);
  
  // Memoize tab bar label style to prevent recreation
  const tabBarLabelStyle = React.useMemo(() => ({
    fontSize: 10, // Reduced to fit 5 tabs
    fontWeight: '400' as const, // Normal weight for inactive, will be overridden by active state
    marginTop: Platform.OS === 'ios' ? 4 : 2,
    letterSpacing: -0.1,
    textAlign: 'center' as const,
    includeFontPadding: false,
    textAlignVertical: 'center' as const,
    opacity: 1, // Labels always visible
    lineHeight: 12, // Reduced line height
    ...(Platform.OS === 'android' && {
      marginTop: 2,
      fontSize: 10, // Reduced for Android too
    }),
  }), []);
  
  // Memoize screen options to prevent recreation
  const screenOptions = React.useMemo(() => ({
    tabBarActiveTintColor: activeColor, // Brand blue for active tabs
    tabBarInactiveTintColor: inactiveColor, // Theme secondary gray for inactive tabs
    tabBarShowLabel: true, // Labels always visible
    animationEnabled: true, // Enable smooth animations for fluid transitions
    swipeEnabled: true,
    lazy: true, // Lazy load tabs for better performance
    tabBarStyle: tabBarStyle,
    tabBarItemStyle: tabBarItemStyle,
    tabBarLabelStyle: tabBarLabelStyle,
    headerShown: false,
  }), [activeColor, inactiveColor, tabBarStyle, tabBarItemStyle, tabBarLabelStyle]);
  
  // Memoize icon renderer functions to prevent recreation on every render
  const homeIconRenderer = React.useCallback(
    ({ focused, color }: { focused: boolean; color: string }) => (
      <TabIcon Icon={Home} focused={focused} color={color} />
    ),
    []
  );
  
  const budgetIconRenderer = React.useCallback(
    ({ focused, color }: { focused: boolean; color: string }) => (
      <TabIcon Icon={BarChart3} focused={focused} color={color} />
    ),
    []
  );
  
  const bankingIconRenderer = React.useCallback(
    ({ focused, color }: { focused: boolean; color: string }) => (
      <TabIcon Icon={CreditCard} focused={focused} color={color} />
    ),
    []
  );
  
  const insightsIconRenderer = React.useCallback(
    ({ focused, color }: { focused: boolean; color: string }) => (
      <TabIcon Icon={LineChart} focused={focused} color={color} />
    ),
    []
  );
  
  const profileIconRenderer = React.useCallback(
    ({ focused, color }: { focused: boolean; color: string }) => (
      <TabIcon Icon={User} focused={focused} color={color} />
    ),
    []
  );
  
  return (
    <TabsWrapper>
      <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Overview',
          tabBarLabel: 'Overview',
          headerShown: false,
          tabBarIcon: homeIconRenderer,
        }}
      />
      <Tabs.Screen
        name='budget'
        options={{
          title: 'Budget',
          tabBarLabel: 'Budget',
          headerShown: false,
          tabBarIcon: budgetIconRenderer,
        }}
      />
      <Tabs.Screen
        name='banking'
        options={{
          title: 'Banking',
          tabBarLabel: 'Banking',
          headerShown: false,
          tabBarIcon: bankingIconRenderer,
        }}
      />
      <Tabs.Screen
        name='insights'
        options={{
          title: 'Insights',
          tabBarLabel: 'Insights',
          headerShown: false,
          tabBarIcon: insightsIconRenderer,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerShown: false,
          tabBarIcon: profileIconRenderer,
        }}
      />
    </Tabs>
    </TabsWrapper>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [checkingSetup, setCheckingSetup] = React.useState(true);

  // Check if setup is needed
  React.useEffect(() => {
    let isMounted = true;
    
    const checkSetup = async () => {
      // If auth is still loading, wait
      if (loading) {
        return;
      }

      // If no user, don't check setup (will redirect to signin)
      if (!user) {
        if (isMounted) {
          setCheckingSetup(false);
        }
        return;
      }

      try {
        // Add timeout to prevent blocking
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            if (isMounted) {
              setCheckingSetup(false);
            }
            resolve();
          }, 2000); // 2 second timeout
        });

        const setupKey = `@trilo:setup_completed_${user.id}`;
        const setupPromise = (async () => {
          const setupCompleted = await AsyncStorage.getItem(setupKey);

          const tutorialService = new TutorialService(user.id);
          const tutorialStatus = await tutorialService.ensureStatus();

          // If tutorial is completed but setup is not, redirect to setup
          if (
            tutorialStatus.tutorial_completed &&
            setupCompleted !== 'true' &&
            !tutorialStatus.needs_tutorial
          ) {
            router.replace('/setup');
          }
        })();

        // Race between setup check and timeout
        await Promise.race([setupPromise, timeoutPromise]);
      } catch (error) {
        console.error('Failed to check setup status:', error);
      } finally {
        // Always set checkingSetup to false after check completes or times out
        if (isMounted) {
          setCheckingSetup(false);
        }
      }
    };

    checkSetup();

    return () => {
      isMounted = false;
    };
  }, [user, loading, router]);

  // Show loading state while checking auth or setup - use themed background
  if (loading || checkingSetup) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Loading state */}
      </View>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    return <Redirect href="/signin" />;
  }

  return (
    <SavingsProvider>
          <NotificationProvider>
            <ReminderProvider>
              <ChallengeProvider>
                <PlaidProvider userId={user.id}>
                  <TutorialProvider>
                    <UINotificationProvider>
                      <StatusBarManager />
                      <NotificationContainer>
                        <TabLayoutContent />
                        <BlockingPaywallHandler />
                        <TooltipOverlay />
                      </NotificationContainer>
                    </UINotificationProvider>
                  </TutorialProvider>
                </PlaidProvider>
              </ChallengeProvider>
            </ReminderProvider>
          </NotificationProvider>
        </SavingsProvider>
  );
}

function BlockingPaywallHandler() {
  // Disabled when subscriptions are disabled
  if (!SUBSCRIPTIONS_ENABLED) {
    return null;
  }

  const { status, isLoading } = useSubscription();
  
  // Show blocking paywall if trial expired and user hasn't activated a plan
  const shouldShowBlockingPaywall = !isLoading && status === 'expired';
  
  return (
    <BlockingPaywallModal visible={shouldShowBlockingPaywall} />
  );
}
