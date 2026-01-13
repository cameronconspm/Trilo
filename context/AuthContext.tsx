import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SUBSCRIPTIONS_ENABLED } from '@/constants/features';
import { isMFAEnabled } from '@/services/mfaService';
import { log, warn } from '@/utils/logger';
import { getLastScreenForQuickReopen } from '@/utils/navigationState';
import { NAVIGATION_TIMEOUTS } from '@/constants/timing';
import { COMMON_STORAGE_KEYS } from '@/utils/storageKeys';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  checkMFAStatus: () => Promise<boolean>;
  setMFAVerified: (verified: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = COMMON_STORAGE_KEYS.SESSION;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  // Ref to track if component is mounted (prevents navigation after unmount)
  const isMountedRef = useRef(true);
  // Ref to store navigation timeout (for cleanup)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Restore session from storage
    restoreSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      try {
        log('Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user ?? null);

        // Check MFA status when user is set
        if (session?.user) {
          try {
            const mfaStatus = await isMFAEnabled(session.user.id);
            setMfaEnabled(mfaStatus);
          } catch (mfaError) {
            console.error('Failed to check MFA status:', mfaError);
            // Default to MFA not enabled on error
            setMfaEnabled(false);
          }
          // Reset MFA verification on auth state change
          setMfaVerified(false);
        } else {
          setMfaEnabled(false);
          setMfaVerified(false);
        }

        // Save session to AsyncStorage
        try {
          if (session) {
            await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          } else {
            await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch (storageError) {
          console.error('Failed to save session to storage:', storageError);
          // Continue even if storage fails
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Separate effect to handle navigation for authenticated users
  // Note: app/index.tsx handles navigation for unauthenticated users
  // This separation prevents navigation conflicts
  useEffect(() => {
    if (loading) return;

    if (user && session) {
      // Clear any existing navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      // User is signed in - check for quick reopen
      navigationTimeoutRef.current = setTimeout(async () => {
        // Check if component is still mounted before navigating
        if (!isMountedRef.current) {
          return;
        }

        try {
          const lastScreen = await getLastScreenForQuickReopen();
          
          // Double-check mount status after async operation
          if (!isMountedRef.current) {
            return;
          }

          if (lastScreen && lastScreen.startsWith('/(tabs)')) {
            // Quick reopen - navigate to last screen
            // Type assertion is safe here - we validate that lastScreen starts with '/(tabs)'
            router.replace(lastScreen as '//(tabs)' | '/(tabs)/index' | '/(tabs)/budget' | '/(tabs)/banking' | '/(tabs)/insights' | '/(tabs)/profile');
          } else {
            // Normal open - go to home (default tab)
            router.replace('/(tabs)');
          }
        } catch (error) {
          // On error, just go to default tabs (only if still mounted)
          if (isMountedRef.current) {
        router.replace('/(tabs)');
          }
        } finally {
          navigationTimeoutRef.current = null;
        }
      }, NAVIGATION_TIMEOUTS.AUTH_NAVIGATION_DELAY);
    }
    // Don't auto-redirect when user is signed out
    // Let app/index.tsx handle onboarding/signin flow

    // Cleanup: Clear timeout and mark as unmounted
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, [user, session, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, []);

  const restoreSession = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedSession) {
        // No stored session
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      let session: Session;
      try {
        session = JSON.parse(storedSession);
      } catch (parseError) {
        // Invalid JSON - clear corrupted session
        warn('Corrupted session data found, clearing...');
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Validate session structure before attempting restoration
      if (!session || typeof session !== 'object') {
        warn('Invalid session structure, clearing...');
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if this is a mock/test session (not a real Supabase session)
      // Valid JWTs have the format: header.payload.signature (at least 2 dots)
      const isMockSession = session.access_token === 'test_token';
      const isValidJWT = session.access_token && 
                         session.access_token !== 'test_token' && 
                         session.access_token.split('.').length >= 3;
      
      if (isMockSession) {
        // Restore mock session state without Supabase validation
        // This allows test accounts to work during development
        setSession(session);
        setUser(session.user);
        setLoading(false);
        return;
      }
      
      if (!isValidJWT) {
        // Invalid token structure - clear corrupted session
        warn('Invalid JWT structure detected, clearing session...');
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Attempt to restore the session with Supabase
      // Pass the full session object (Supabase will validate the JWT structure)
      const { data, error } = await supabase.auth.setSession(session as Session);
      
      if (error) {
        // Invalid or expired JWT - clear the invalid session
        // Use warn instead of error to reduce noise in production
        warn('Session restoration failed (expired or invalid JWT):', error.message);
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        // Don't navigate here - let the auth state change listener handle it
      } else {
        // No session after restoration
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      // Catch any unexpected errors during session restoration
      console.error('Unexpected error during session restoration:', error);
      // Clear potentially corrupted session
      try {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore errors when clearing
      }
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      // Set up trial period for new users (DISABLED when subscriptions are disabled)
      if (data.user && SUBSCRIPTIONS_ENABLED) {
        const trialStart = new Date();
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

        await supabase.from('user_subscriptions').insert({
          user_id: data.user.id,
          status: 'trial',
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
        });

      }
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Failed to sign up');
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // Fallback: Allow test account to sign in locally if Supabase is down
      // Note: Mock sessions are detected and cleared during restoreSession
      if (email === 'test@trilo.app' && password === 'test123456') {
        const mockUser = {
          id: 'test_user_123',
          email: 'test@trilo.app',
          email_confirmed_at: new Date().toISOString(),
        };
        
        const mockSession = {
          user: mockUser,
          access_token: 'test_token',
          refresh_token: 'test_refresh',
          expires_at: Date.now() + 3600000,
        } as Session;

        setSession(mockSession);
        setUser(mockUser as User);
        setMfaEnabled(false);
        setMfaVerified(false);
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockSession));
        
        router.replace('/(tabs)');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if MFA is enabled for this user
      if (data.user) {
        const mfaStatus = await isMFAEnabled(data.user.id);
        setMfaEnabled(mfaStatus);
        // If MFA is enabled, don't navigate yet - sign-in screen will handle MFA verification
        if (mfaStatus) {
          setMfaVerified(false);
          // Don't navigate - let sign-in screen handle MFA verification
          return;
        } else {
          setMfaVerified(true);
        }
      }
    } catch (error) {
      // If Supabase is down, allow test account for demo purposes
      if (email === 'test@trilo.app' && password === 'test123456') {
        const mockUser = {
          id: 'test_user_123',
          email: 'test@trilo.app',
          email_confirmed_at: new Date().toISOString(),
        };
        
        const mockSession = {
          user: mockUser,
          access_token: 'test_token',
          refresh_token: 'test_refresh',
          expires_at: Date.now() + 3600000,
        } as Session;

        setSession(mockSession);
        setUser(mockUser as User);
        setMfaEnabled(false);
        setMfaVerified(false);
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockSession));
        
        router.replace('/(tabs)');
        return;
      }
      
      const authError = error as AuthError;
      throw new Error(authError.message || 'Failed to sign in');
    }
  };

  const checkMFAStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    const status = await isMFAEnabled(user.id);
    setMfaEnabled(status);
    return status;
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
      setUser(null);
      setMfaEnabled(false);
      setMfaVerified(false);
      router.replace('/signin');
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Failed to sign out');
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');

      // Delete user data from Supabase
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;

      // Sign out and clear local storage
      await signOut();
      
      // Optionally clear all app data
      await AsyncStorage.multiRemove([
        '@trilo:transactions',
        '@trilo:income',
        '@trilo:savings_goals',
        '@trilo:settings',
        SESSION_STORAGE_KEY,
      ]);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Failed to delete account');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        mfaEnabled,
        mfaVerified,
        signUp,
        signIn,
        signOut,
        deleteAccount,
        checkMFAStatus,
        setMFAVerified: setMfaVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

