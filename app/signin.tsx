import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/components/layout/Button';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      Alert.alert('Sign In Failed', err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleTestUser = () => {
    setEmail('test@trilo.app');
    setPassword('test123456');
  };

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
    footer: {
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    footerText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
    },
    linkText: {
      color: colors.primary,
      fontWeight: '600',
    },
    testButton: {
      backgroundColor: `${colors.primary}10`,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      width: '100%',
    },
    testText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: Spacing.md,
      fontSize: 14,
      color: colors.textTertiary,
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue managing your finances
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
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSignIn}
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
                      Sign In
                    </Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <Text style={styles.linkText} onPress={handleSignUp}>
                  Sign Up
                </Text>
              </Text>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={handleTestUser}
                disabled={loading}
                style={styles.testButton}
              >
                <Text style={styles.testText}>
                  🧪 Use Test Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
