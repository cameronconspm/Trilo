import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COMMON_STORAGE_KEYS } from '@/utils/storageKeys';

const ONBOARDING_STORAGE_KEY = COMMON_STORAGE_KEYS.ONBOARDING_COMPLETED;

export default function Index() {
  const { user, loading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Check if onboarding was completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setOnboardingCompleted(completed === 'true');
      } catch (error) {
        // On error, assume onboarding not completed
        setOnboardingCompleted(false);
      }
    };

    if (!loading && !user) {
      checkOnboarding();
    }
  }, [loading, user]);

  // Show nothing while loading auth or checking onboarding
  if (loading || (!user && onboardingCompleted === null)) {
    return null;
  }

  // Let AuthContext handle navigation for signed-in users
  // This prevents navigation conflicts - AuthContext will navigate authenticated users to tabs
  if (user) {
    return null;
  }

  // If onboarding was completed, go to signin
  // Otherwise, show onboarding (only once per device)
  if (onboardingCompleted) {
    return <Redirect href="/signin" />;
  }

  return <Redirect href="/onboarding" />;
}

