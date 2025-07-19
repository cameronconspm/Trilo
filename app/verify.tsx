import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle } from 'lucide-react-native';
import Button from '@/components/Button';
import { useThemeColors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { Spacing } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

export default function VerifyScreen() {
  const colors = useThemeColors('light'); // Force light theme for onboarding
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleEmailVerification();
  }, []);

  const handleEmailVerification = async () => {
    try {
      // Check if we have verification tokens in the URL
      const { token_hash, type } = params;
      
      if (token_hash && type === 'email') {
        // Verify the email using the token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token_hash as string,
          type: 'email'
        });

        if (error) {
          setVerificationStatus('error');
          setErrorMessage(error.message);
          return;
        }
      }

      // Check if user's email is now verified
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setVerificationStatus('error');
        setErrorMessage(sessionError.message);
        return;
      }

      if (session?.user?.email_confirmed_at) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('error');
        setErrorMessage('Email verification failed. Please try again.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage('An unexpected error occurred during verification.');
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    router.replace('/verify-email');
  };

  if (verificationStatus === 'checking') {
    return (
      <>
        <Stack.Screen 
          options={{ 
            title: 'Verifying Email',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }} 
        />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: colors.primary + '20' }]}>
                <CheckCircle size={48} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Verifying Your Email...
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Please wait while we confirm your email verification.
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <>
        <Stack.Screen 
          options={{ 
            title: 'Email Verified',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }} 
        />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: colors.success + '20' }]}>
                <CheckCircle size={48} color={colors.success} />
              </View>
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Email Verified!
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Your email has been successfully verified. You can now access your account.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Continue to App"
                onPress={handleContinue}
                variant="primary"
                size="large"
                style={styles.button}
              />
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Verification Failed',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: colors.error + '20' }]}>
              <AlertCircle size={48} color={colors.error} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Verification Failed
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {errorMessage || 'We couldn\'t verify your email. Please try again.'}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Try Again"
              onPress={handleRetry}
              variant="primary"
              size="large"
              style={styles.button}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xxl,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  button: {
    marginBottom: 0,
  },
});