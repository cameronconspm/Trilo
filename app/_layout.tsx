import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { initializeRevenueCat } from '@/lib/revenuecat';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SUBSCRIPTIONS_ENABLED } from '@/constants/features';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent auto-hiding splash screen
// Catch errors in case native module isn't available (e.g., in Expo Go)
SplashScreen.preventAutoHideAsync().catch((error) => {
  // Ignore errors in Expo Go where native splash screen might not be available
  console.warn('Splash screen preventAutoHide error (can be ignored):', error);
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      // Font errors should always be logged, even in production
      console.error('Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide splash screen after fonts are loaded
      // Use a small delay to ensure native module is ready
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          // Ignore splash screen errors in Expo Go or if already hidden
          // This can happen if the native module isn't fully initialized
          console.warn('Splash screen hide error (can be ignored in Expo Go):', error);
        }
      };
      
      // Small delay to ensure native module is ready
      setTimeout(hideSplash, 500);
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.backgroundColor = '#4E91F9';
      document.documentElement.style.backgroundColor = '#4E91F9';
    }
  }, []);

  // Initialize RevenueCat when app starts (DISABLED when subscriptions are disabled)
  useEffect(() => {
    if (SUBSCRIPTIONS_ENABLED) {
      initializeRevenueCat().catch((error) => {
        // RevenueCat initialization errors should always be logged
        console.error('Failed to initialize RevenueCat:', error);
      });
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary context="App Root">
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <SubscriptionProvider>
              <SettingsProvider>
                <FinanceProvider>
                  <Stack 
                screenOptions={{ 
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationDuration: 250,
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  transitionSpec: {
                    open: {
                      animation: 'timing',
                      config: {
                        duration: 250,
                      },
                    },
                    close: {
                      animation: 'timing',
                      config: {
                        duration: 200,
                      },
                    },
                  },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen 
                  name="onboarding" 
                  options={{ 
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 300,
                  }} 
                />
                <Stack.Screen 
                  name="signin" 
                  options={{ 
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 300,
                  }} 
                />
                <Stack.Screen 
                  name="signup" 
                  options={{ 
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 300,
                  }} 
                />
                <Stack.Screen 
                  name="setup" 
                  options={{ 
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 250,
                  }} 
                />
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ 
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 250,
                  }} 
                />
              </Stack>
                </FinanceProvider>
              </SettingsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}