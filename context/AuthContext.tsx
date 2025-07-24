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
      console.log('AuthContext: Creating/updating user profile for:', user.id);
      
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('app_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('AuthContext: Error checking existing user:', fetchError);
        return;
      }

      if (!existingUser) {
        // User doesn't exist, create new profile
        const { error: insertError } = await supabase
          .from('app_users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('AuthContext: Error creating user profile:', insertError);
        } else {
          console.log('AuthContext: User profile created successfully');
        }
      } else {
        // User exists, update profile
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('AuthContext: Error updating user profile:', updateError);
        } else {
          console.log('AuthContext: User profile updated successfully');
        }
      }
    } catch (error) {
      console.error('AuthContext: Unexpected error in createOrUpdateUserProfile:', error);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        userId: session?.user?.id ?? null,
        isLoading: false,
      }));
      
      // Create or update user profile if session exists
      if (session?.user) {
        createOrUpdateUserProfile(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
          userId: session?.user?.id ?? null,
          isLoading: false,
        }));

        // Store user ID in AsyncStorage for persistence
        if (session?.user) {
          await AsyncStorage.setItem('userId', session.user.id);
          // Create or update user profile on sign in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await createOrUpdateUserProfile(session.user);
          }
        } else {
          await AsyncStorage.removeItem('userId');
        }
      }
    );

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

      if (error) {
        return { error: error.message };
      }

      // If email confirmation is disabled, the user will be automatically signed in
      // If email confirmation is enabled, the user will need to verify their email
      
      // If user is immediately available (email confirmation disabled), create profile
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

      // Create or update user profile on successful sign in
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
    createOrUpdateUserProfile,
  };

  return {
    ...authState,
    ...actions,
  };
});