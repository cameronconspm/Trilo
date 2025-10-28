import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BarChart3, CreditCard, LineChart, User } from 'lucide-react-native';
import { Platform, useColorScheme, StatusBar, View } from 'react-native';
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
import NotificationContainer from '@/components/NotificationContainer';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

function StatusBarManager() {
  const { theme } = useSettings();
  
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      StatusBar.setBarStyle(
        theme === 'dark' ? 'light-content' : 'dark-content',
        true
      );
      
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(
          theme === 'dark' ? '#000000' : '#ffffff',
          true
        );
      }
    }
  }, [theme]);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <StatusBar
      barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={theme === 'dark' ? '#000000' : '#ffffff'}
      translucent={false}
    />
  );
}

function TabLayoutContent() {
  const { theme } = useSettings();
  const systemColorScheme = useColorScheme();
  const colors = useThemeColors(theme);
  const { spacing } = useResponsiveDesign();
  const insets = useSafeAreaInsets();
  
  // Wrap tabs in themed container to prevent white flash
  const TabsWrapper = ({ children }: { children: React.ReactNode }) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </View>
  );

  // Dynamic theme colors that respect system appearance
  const activeColor = colors.primary; // Brand blue
  const inactiveColor = colors.textSecondary; // Theme secondary gray
  
  // Safe-area spacing calculations
  const tabBarHeight = 56 + insets.bottom;
  const tabBarPaddingBottom = Math.max(6, insets.bottom - 2);
  const tabBarPaddingTop = 6; // Small top padding
  
  // Debug logging for tab bar colors
  console.log('TabLayout: Theme:', theme, 'System:', systemColorScheme, 'Colors:', {
    active: activeColor,
    inactive: inactiveColor,
    height: tabBarHeight,
    paddingBottom: tabBarPaddingBottom
  });
  
  return (
    <TabsWrapper>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: activeColor, // Brand blue for active tabs
        tabBarInactiveTintColor: inactiveColor, // Theme secondary gray for inactive tabs
        tabBarShowLabel: true, // Labels always visible
        animationEnabled: false, // Disable animations for instant transitions
        swipeEnabled: true,
        lazy: false,
        lazyLoadPlaceholderEnabled: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight, // 56 + insets.bottom
          paddingBottom: tabBarPaddingBottom, // Math.max(6, insets.bottom - 2)
          paddingTop: tabBarPaddingTop, // Small top padding
          paddingHorizontal: spacing.tabHorizontal,
          elevation: 0,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 8, // Ensure tap targets remain ≥44x44
          minHeight: 44, // Minimum touch target size
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 2, // Reduced padding to fit 5 tabs
        },
        tabBarLabelStyle: {
          fontSize: 10, // Reduced to fit 5 tabs
          fontWeight: '400', // Normal weight for inactive, will be overridden by active state
          marginTop: Platform.OS === 'ios' ? 4 : 2,
          letterSpacing: -0.1,
          textAlign: 'center',
          includeFontPadding: false,
          textAlignVertical: 'center',
          opacity: 1, // Labels always visible
          lineHeight: 12, // Reduced line height
          ...(Platform.OS === 'android' && {
            marginTop: 2,
            fontSize: 10, // Reduced for Android too
          }),
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Overview',
          tabBarLabel: 'Overview',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Home
              size={24}
              color={color} // Use the color from tabBarActiveTintColor/tabBarInactiveTintColor
              strokeWidth={focused ? 2.5 : 2}
              style={{ marginBottom: -2 }} // Nudge icon up slightly
            />
          ),
        }}
      />
      <Tabs.Screen
        name='budget'
        options={{
          title: 'Budget',
          tabBarLabel: 'Budget',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <BarChart3
              size={24}
              color={color} // Use the color from tabBarActiveTintColor/tabBarInactiveTintColor
              strokeWidth={focused ? 2.5 : 2}
              style={{ marginBottom: -2 }} // Nudge icon up slightly
            />
          ),
        }}
      />
      <Tabs.Screen
        name='banking'
        options={{
          title: 'Banking',
          tabBarLabel: 'Banking',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <CreditCard
              size={24}
              color={color} // Use the color from tabBarActiveTintColor/tabBarInactiveTintColor
              strokeWidth={focused ? 2.5 : 2}
              style={{ marginBottom: -2 }} // Nudge icon up slightly
            />
          ),
        }}
      />
      <Tabs.Screen
        name='insights'
        options={{
          title: 'Insights',
          tabBarLabel: 'Insights',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <LineChart
              size={24}
              color={color} // Use the color from tabBarActiveTintColor/tabBarInactiveTintColor
              strokeWidth={focused ? 2.5 : 2}
              style={{ marginBottom: -2 }} // Nudge icon up slightly
            />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <User
              size={24}
              color={color} // Use the color from tabBarActiveTintColor/tabBarInactiveTintColor
              strokeWidth={focused ? 2.5 : 2}
              style={{ marginBottom: -2 }} // Nudge icon up slightly
            />
          ),
        }}
      />
    </Tabs>
    </TabsWrapper>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  // Show loading state while checking auth - use themed background
  if (loading) {
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
    <SettingsProvider>
      <FinanceProvider>
        <SavingsProvider>
          <NotificationProvider>
            <ReminderProvider>
              <ChallengeProvider>
                <PlaidProvider userId={user.id}>
                  <UINotificationProvider>
                    <StatusBarManager />
                    <NotificationContainer>
                      <TabLayoutContent />
                    </NotificationContainer>
                  </UINotificationProvider>
                </PlaidProvider>
              </ChallengeProvider>
            </ReminderProvider>
          </NotificationProvider>
        </SavingsProvider>
      </FinanceProvider>
    </SettingsProvider>
  );
}
