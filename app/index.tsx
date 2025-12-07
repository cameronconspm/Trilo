import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import React from 'react';

export default function Index() {
  const { user, loading } = useAuth();

  // Show nothing while loading auth
  if (loading) {
    return null;
  }

  // Let AuthContext handle navigation for signed-in users
  if (user) {
    return null;
  }

  // Always show onboarding when user is not logged in
  // This ensures onboarding is shown every time for unauthenticated users
  return <Redirect href="/onboarding" />;
}

