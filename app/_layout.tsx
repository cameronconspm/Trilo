import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FinanceProvider } from "@/context/FinanceContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import CustomSplashScreen from "@/components/SplashScreen";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Add 2.5 second delay for splash screen
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 2500);
    }
  }, [loaded]);

  useEffect(() => {
    // Set body background color for web to match splash screen
    if (Platform.OS === 'web') {
      document.body.style.backgroundColor = '#4E91F9';
      // Also set the html element background
      document.documentElement.style.backgroundColor = '#4E91F9';
    }
  }, []);

  if (!loaded) {
    // Show custom splash screen while loading
    return <CustomSplashScreen />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  useEffect(() => {
    // Reset body background color after splash screen
    if (Platform.OS === 'web') {
      const timer = setTimeout(() => {
        document.body.style.backgroundColor = '';
        document.documentElement.style.backgroundColor = '';
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SettingsProvider>
          <FinanceProvider>
            <NotificationProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </NotificationProvider>
          </FinanceProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}