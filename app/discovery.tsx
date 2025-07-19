import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import Button from '@/components/Button';
import { Spacing } from '@/constants/spacing';

export default function DiscoveryScreen() {
  const handleGetStarted = () => {
    router.push('/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <LinearGradient
      colors={['#E8F2FF', '#B8D8FF', '#87CEEB']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <TrendingUp size={120} color="white" strokeWidth={2.5} />
            <Text style={styles.mainTitle}>Budgeting</Text>
            <Text style={styles.mainTitle}>made simple.</Text>
            <Text style={styles.tagline}>
              Plan around your payday,{'\n'}not the calendar.
            </Text>
          </View>

          <View style={styles.buttonSection}>
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              size="large"
              style={[styles.button, styles.getStartedButton]}
              textStyle={styles.getStartedButtonText}
            />
            <Button
              title="Log In"
              onPress={handleLogin}
              variant="outline"
              size="large"
              style={[styles.button, styles.loginButton]}
              textStyle={styles.loginButtonText}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    lineHeight: 56,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: Spacing.xl,
    opacity: 0.9,
  },
  buttonSection: {
    width: '100%',
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  button: {
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: 'white',
    borderWidth: 0,
  },
  getStartedButtonText: {
    color: '#4E91F9',
    fontWeight: '600',
  },
  loginButton: {
    borderColor: 'white',
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});