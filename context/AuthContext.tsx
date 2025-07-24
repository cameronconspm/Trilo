import React, { useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, getRedirectUrl } from '@/services/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

interface AuthActions {
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>; 
  signIn: (email: string, password: string) => Promise<{ error?: string }>; 
  signOut: () => Promise<void>; 
  checkEmailVerification: () => Promise<{ verified: boolean; error?: string }>; 
  resendVerificationEmail: (email: string) => Promise<{ error?: string }>; 
  createOrUpdateUserProfile: (user: User) => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    userId: null,
  });

  const createOrUpdateUserProfile = useCallback(async (user: User): Promise<void> => {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('app_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('AuthContext: Error checking existing user:', JSON.stringify(fetchError, null, 2));
        return;
      }

      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('app_users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          });

        if (insertError) {
          console.error('AuthContext: Error creating user profile:', JSON.stringify(insertError, null, 2));
        }
      } else {
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('AuthContext: Error updating user profile:', JSON.stringify(updateError, null, 2));
        }
      }
    } catch (error) {
      console.error('AuthContext: Unexpected error in createOrUpdateUserProfile:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        userId: session?.user?.id ?? null,
        isLoading: false,
      }));

      if (session?.user) {
        createOrUpdateUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        userId: session?.user?.id ?? null,
        isLoading: false,
      }));

      if (session?.user) {
        await AsyncStorage.setItem('userId', session.user.id);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await createOrUpdateUserProfile(session.user);
        }
      } else {
        await AsyncStorage.removeItem('userId');
      }
    });

    return () => subscription.unsubscribe();
  }, [createOrUpdateUserProfile]);

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
          data: {
            full_name: fullName || email.split('@')[0],
          }
        }
      });

      if (error) return { error: error.message };

      if (data.user && data.session) {
        await createOrUpdateUserProfile(data.user);
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { error: error.message };

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        return { error: 'Please verify your email before signing in. Check your inbox for a verification link.' };
      }

      if (data.user) {
        await createOrUpdateUserProfile(data.user);
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
      if (error) return { verified: false, error: error.message };
      return { verified: !!user?.email_confirmed_at };
    } catch (error) {
      return { verified: false, error: 'An unexpected error occurred' };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { error: error.message };
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
    createOrUpdateUserProfile,
  };

  return {
    ...authState,
    ...actions,
  };
});
