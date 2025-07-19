import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inVerificationFlow = segments[0] === 'verify-email' || segments[0] === 'verify';

    if (!isAuthenticated && inAuthGroup) {
      // User is not authenticated but trying to access protected routes
      router.replace('/discovery');
    } else if (isAuthenticated && !inAuthGroup && !inVerificationFlow) {
      // User is authenticated but on auth screens (excluding verification flow)
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}