import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight, Sparkles, Check } from 'lucide-react-native';
import MFASetupScreen from '@/components/auth/MFASetupScreen';
import { markMFASetupSkipped } from '@/services/mfaService';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);

  const { signUp, user } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const router = useRouter();

  // Show MFA setup modal after user is created
  useEffect(() => {
    if (signupCompleted && user?.id && !showMFASetup) {
      setShowMFASetup(true);
    }
  }, [signupCompleted, user, showMFASetup]);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp(email.trim(), password);
      setSignupCompleted(true);
      // MFA setup modal will be shown via useEffect when user is available
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      Alert.alert('Sign Up Failed', err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    // AuthContext will handle navigation automatically after signup
  };

  const handleMFASetupSkip = async () => {
    if (user?.id) {
      try {
        await markMFASetupSkipped(user.id);
      } catch (error) {
        console.error('Failed to mark MFA setup as skipped:', error);
        // Don't block the user if this fails
      }
    }
    setShowMFASetup(false);
    // AuthContext will handle navigation automatically after signup
  };

  const handleSignIn = () => {
    router.replace('/signin');
  };

  const passwordStrength = password.length >= 6 && password.length <= 12;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing.xxxl,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      ...Shadow.medium,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: Spacing.md,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxxl,
      padding: Spacing.xxl,
      ...Shadow.card,
    },
    errorContainer: {
      backgroundColor: `${colors.error}15`,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      marginLeft: Spacing.sm,
      flex: 1,
    },
    form: {
      marginBottom: Spacing.xl,
    },
    inputContainer: {
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.innerCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
    },
    iconContainer: {
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      height: 52,
      fontSize: 16,
      color: colors.text,
      fontFamily: 'System',
    },
    requirements: {
      marginTop: Spacing.xs,
      paddingLeft: 4,
    },
    requirement: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    requirementText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
    footer: {
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    footerText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    linkText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Sparkles size={40} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start managing your finances with Trilo
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.iconContainer}>
                    <Mail size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.iconContainer}>
                    <Lock size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password-new"
                    editable={!loading}
                  />
                </View>
                <View style={styles.requirements}>
                  <View style={styles.requirement}>
                    <Check
                      size={14}
                      color={passwordStrength ? colors.success : colors.textTertiary}
                    />
                    <Text style={[styles.requirementText, { color: passwordStrength ? colors.success : colors.textTertiary }]}>
                      At least 6 characters
                    </Text>
                  </View>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, passwordsMatch && { borderColor: colors.success }]}>
                  <View style={styles.iconContainer}>
                    <Lock size={20} color={passwordsMatch ? colors.success : colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoComplete="password-new"
                    editable={!loading}
                  />
                </View>
                {passwordsMatch && (
                  <View style={styles.requirements}>
                    <View style={styles.requirement}>
                      <Check size={14} color={colors.success} />
                      <Text style={[styles.requirementText, { color: colors.success }]}>
                        Passwords match
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={loading}
                style={[
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    height: 52,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: Spacing.md,
                    ...Shadow.light,
                  },
                  loading && { opacity: 0.6 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 17,
                        fontWeight: '600',
                        marginRight: Spacing.xs,
                      }}
                    >
                      Create Account
                    </Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.linkText} onPress={handleSignIn}>
                  Sign In
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MFA Setup Modal */}
      {showMFASetup && user?.id && (
        <Modal
          visible={showMFASetup}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleMFASetupSkip}
        >
          <MFASetupScreen
            onComplete={handleMFASetupComplete}
            onCancel={handleMFASetupSkip}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}
