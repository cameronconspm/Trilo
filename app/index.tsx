import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import React from 'react';

export default function Index() {
  const { user, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // Let AuthContext handle navigation for signed-in users
  // Only redirect to signin if definitely not authenticated
  if (!user) {
    return <Redirect href="/signin" />;
  }

  // If user exists but not redirected by AuthContext yet, show loading
  return null;
}

