import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { verifySMSCode, getMFAPhoneNumber, resendSMSCode, formatPhoneNumber } from '@/services/mfaService';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { Shield, MessageSquare } from 'lucide-react-native';
import Button from '@/components/layout/Button';

interface MFAVerifyScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MFAVerifyScreen({ onSuccess, onCancel }: MFAVerifyScreenProps) {
  const { user } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Load phone number on mount
    if (user?.id) {
      loadPhoneNumber();
    }
  }, [user?.id]);

  const loadPhoneNumber = async () => {
    if (!user?.id) return;
    const phone = await getMFAPhoneNumber(user.id);
    if (phone) {
      setPhoneNumber(phone);
    }
  };

  const handleVerify = async () => {
    if (!code.trim() || code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (!user?.id) {
      setError('User information not available');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify the code
      const isValid = await verifySMSCode(user.id, code.trim());
      
      if (isValid) {
        onSuccess();
      } else {
        setError('Invalid code. Please try again.');
        setCode('');
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setResending(true);
      setError('');
      const result = await resendSMSCode(user.id);
      
      if (result.success) {
        setCode('');
        // Code will be sent automatically
      } else {
        setError(result.message || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      console.error('Error resending code:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxxl,
      padding: Spacing.xxl,
      ...Shadow.card,
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
      lineHeight: 22,
    },
    phoneNumberText: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    inputContainer: {
      marginBottom: Spacing.xl,
    },
    inputLabel: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    codeInput: {
      backgroundColor: colors.innerCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      ...Typography.body,
      fontSize: 32,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 12,
      borderWidth: 2,
      borderColor: error ? colors.error : colors.border,
      minHeight: 64,
    },
    errorText: {
      ...Typography.caption,
      color: colors.error,
      textAlign: 'center',
      marginTop: Spacing.sm,
      minHeight: 20,
    },
    buttonContainer: {
      marginTop: Spacing.md,
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    resendButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    resendButtonText: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    resendButtonDisabled: {
      opacity: 0.5,
    },
    cancelButton: {
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    cancelButtonText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    helpText: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.md,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Shield size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to your phone
          </Text>
          {phoneNumber && (
            <Text style={styles.phoneNumberText}>
              {formatPhoneNumber(phoneNumber) || phoneNumber}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Verification Code</Text>
          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!loading}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ minHeight: 20 }} />}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Verifying..." : "Continue"}
            onPress={handleVerify}
            variant="primary"
            disabled={loading || code.length !== 6}
            loading={loading}
          />
        </View>

        <View style={styles.resendContainer}>
          <TouchableOpacity
            onPress={handleResend}
            style={[styles.resendButton, (loading || resending) && styles.resendButtonDisabled]}
            disabled={loading || resending}
          >
            <Text style={styles.resendButtonText}>
              {resending ? 'Sending...' : "Didn't receive a code? Resend"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Check your messages. Codes expire after 10 minutes.
        </Text>
      </View>
    </SafeAreaView>
  );
}
