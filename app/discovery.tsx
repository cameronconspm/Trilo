import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      colors={['#0D47A1', '#4E91F9', '#ffffff']}
      locations={[0, 0.65, 1]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Image
              source={{ uri: 'https://r2-pub.rork.com/attachments/wpscb1bi1jo8d4adsnrqp' }}
              style={styles.arrowImage}
              resizeMode="contain"
            />
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
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  arrowImage: {
    width: 160,
    height: 160,
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    lineHeight: 50,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '400',
    color: 'white',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 20,
    opacity: 0.95,
  },
  buttonSection: {
    width: '100%',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
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
