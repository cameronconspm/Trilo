import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, Appearance, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FinanceProvider } from "@/context/FinanceContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useSettings } from "@/context/SettingsContext";

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
    // Let the native splash screen show while loading
    return null;
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
          <StatusBarManager />
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

function StatusBarManager() {
  const { theme } = useSettings();
  
  useEffect(() => {
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