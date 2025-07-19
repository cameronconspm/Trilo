import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';

export default function DiscoveryScreen() {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  const handleGetStarted = () => {
    router.push('/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.card }]}>T</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Trilo</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Weekly budgeting built around your payday
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            style={styles.button}
          />
          <Button
            title="Log In"
            onPress={handleLogin}
            variant="outline"
            size="large"
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl * 2,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  buttonSection: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});