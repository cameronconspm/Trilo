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
import { initializeRevenueCat } from '@/lib/revenuecat';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 2500);
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.backgroundColor = '#4E91F9';
      document.documentElement.style.backgroundColor = '#4E91F9';
    }
  }, []);

  // Initialize RevenueCat when app starts
  useEffect(() => {
    initializeRevenueCat().catch((error) => {
      console.error('Failed to initialize RevenueCat:', error);
    });
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <SubscriptionProvider>
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
                name="(tabs)" 
                options={{ 
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationDuration: 250,
                }} 
              />
            </Stack>
          </SubscriptionProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}