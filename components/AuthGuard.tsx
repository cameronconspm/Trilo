import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or show a loading spinner
  }

  if (!user) {
    return <Redirect href="/signin" />;
  }

  return <>{children}</>;
}

