import React, { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, getRedirectUrl } from '@/services/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  checkEmailVerification: () => Promise<{ verified: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string }>;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
          isLoading: false,
        }));

        // Store user ID in AsyncStorage for persistence
        if (session?.user) {
          await AsyncStorage.setItem('userId', session.user.id);
        } else {
          await AsyncStorage.removeItem('userId');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
        }
      });

      if (error) {
        return { error: error.message };
      }

      // If email confirmation is disabled, the user will be automatically signed in
      // If email confirmation is enabled, the user will need to verify their email
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        // Sign out the user since email is not verified
        await supabase.auth.signOut();
        return { error: 'Please verify your email before signing in. Check your inbox for a verification link.' };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('userId');
  };

  const checkEmailVerification = async (): Promise<{ verified: boolean; error?: string }> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { verified: false, error: error.message };
      }

      return { verified: !!user?.email_confirmed_at };
    } catch (error) {
      return { verified: false, error: 'An unexpected error occurred' };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const actions: AuthActions = {
    signUp,
    signIn,
    signOut,
    checkEmailVerification,
    resendVerificationEmail,
  };

  return {
    ...authState,
    ...actions,
  };
});