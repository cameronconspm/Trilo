import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react-native';
import Button from '@/components/Button';
import Colors, { useThemeColors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { supabase } from '@/services/supabase';

export default function VerifyEmailScreen() {
  const colors = useThemeColors('light'); // Force light theme for onboarding
  const { user } = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const checkEmailVerification = async () => {
    setIsChecking(true);
    
    try {
      // Check if user's email is verified by refreshing the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        Alert.alert('Error', sessionError.message);
        return;
      }

      let verified = session?.user?.email_confirmed_at != null;
      
      if (!verified) {
        // Try to refresh the session to get latest user data
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && refreshedSession?.user?.email_confirmed_at) {
          verified = true;
        }
      }

      if (verified) {
        // Email is verified, navigate to overview
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Please check your email and click the verification link, then try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsChecking(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) return;
    
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Email Sent',
          'A new verification email has been sent to your inbox.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Verify Email',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: colors.primary + '20' }]}>
              <Mail size={48} color={colors.primary} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Check Your Email
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We've sent a verification link to{'\n'}
              <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
            </Text>
          </View>

          <View style={styles.instructions}>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              1. Check your email inbox (and spam folder)
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              2. Click the verification link in the email
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              3. Return here and tap "I've Verified My Email"
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="I've Verified My Email"
              onPress={checkEmailVerification}
              variant="primary"
              size="large"
              loading={isChecking}
              style={styles.primaryButton}
              icon={<CheckCircle size={20} color="white" />}
            />

            <Button
              title="Resend Email"
              onPress={resendVerificationEmail}
              variant="secondary"
              size="large"
              loading={isResending}
              style={styles.secondaryButton}
              icon={<RefreshCw size={20} color={colors.primary} />}
            />
          </View>

          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Didn't receive the email? Check your spam folder or try resending.
          </Text>
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
  },
  email: {
    fontWeight: '600',
  },
  instructions: {
    width: '100%',
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: 0,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});