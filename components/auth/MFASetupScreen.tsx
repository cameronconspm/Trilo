import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { sendSMSVerificationCode, verifySMSCode, enableMFA, formatPhoneNumber } from '@/services/mfaService';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { Smartphone, MessageSquare, ArrowLeft } from 'lucide-react-native';
import Button from '@/components/layout/Button';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import { useAlert } from '@/hooks/useAlert';
import AlertModal from '@/components/modals/AlertModal';

interface MFASetupScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function MFASetupScreen({ onComplete, onCancel }: MFASetupScreenProps) {
  const { user } = useAuth();
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { alertState, showAlert, hideAlert } = useAlert();
  
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null); // Store dev code for display

  // Combine country code and phone number for full phone number
  const getFullPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return `${countryCode}${digits}`;
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Number Required', 'Please enter your phone number to continue.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    // Validate phone number format
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setSending(true);
      const fullPhoneNumber = getFullPhoneNumber();
      const result = await sendSMSVerificationCode(fullPhoneNumber, user.id);
      
      if (result.success) {
        // In development, store the code if provided
        if (result.code) {
          setDevCode(result.code);
          console.log(`[MFA] 📱 Development mode - Your code: ${result.code}`);
        }
        setStep('verify');
      } else {
        Alert.alert('Error', result.message || 'Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error sending SMS code:', error);
      Alert.alert('Error', 'Failed to send verification code. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your phone.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    try {
      setVerifying(true);
      const fullPhoneNumber = getFullPhoneNumber();
      const isValid = await verifySMSCode(user.id, verificationCode.trim(), fullPhoneNumber);
      
      if (isValid) {
        // Enable MFA permanently
        await enableMFA(user.id, fullPhoneNumber);
        showAlert({
          title: 'Two-Factor Authentication Enabled',
          message: 'Your account is now protected with SMS verification.',
          type: 'success',
          actions: [{ text: 'OK', onPress: onComplete }],
        });
      } else {
        Alert.alert('Invalid Code', 'The code you entered is incorrect. Please try again.');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: Spacing.xl,
    },
    header: {
      marginBottom: Spacing.xl,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      paddingVertical: Spacing.xs,
    },
    backButtonText: {
      ...Typography.body,
      color: colors.primary,
      marginLeft: Spacing.xs,
      fontWeight: '600',
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      ...Shadow.card,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    instructionText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    inputContainer: {
      marginBottom: Spacing.xl,
    },
    codeInput: {
      backgroundColor: colors.innerCard,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      fontSize: 32,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 12,
      borderWidth: 1,
      borderColor: colors.border,
      height: 64,
      includeFontPadding: false,
      lineHeight: Platform.OS === 'ios' ? 38 : 40,
    },
    buttonContainer: {
      marginTop: Spacing.md,
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: Spacing.lg,
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
    devCodeContainer: {
      marginTop: Spacing.md,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
    },
    devCodeLabel: {
      ...Typography.caption,
      marginBottom: Spacing.xs,
    },
    devCodeText: {
      ...Typography.h2,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      letterSpacing: 4,
    },
  });

  // Format phone number for display (country code + formatted number)
  const formatDisplayPhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${countryCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return `${countryCode} ${phoneNumber}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 'phone' ? onCancel : () => setStep('phone')} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Enable Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            {step === 'phone' 
              ? 'Enter your phone number to receive verification codes via SMS. This adds an extra layer of security to your account.'
              : 'Enter the 6-digit code sent to your phone to complete setup.'}
          </Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' && (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Smartphone size={32} color={colors.primary} />
                </View>
                <Text style={styles.instructionText}>
                  We'll send a verification code to your phone number to secure your account
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <PhoneNumberInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  placeholder="(555) 123-4567"
                  label="Phone Number"
                  editable={!sending}
                />
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title={sending ? "Sending..." : "Send Code"}
                  onPress={handleSendCode}
                  variant="primary"
                  disabled={sending || phoneNumber.replace(/\D/g, '').length !== 10}
                  loading={sending}
                />
              </View>
            </>
          )}

          {step === 'verify' && (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <MessageSquare size={32} color={colors.primary} />
                </View>
                <Text style={styles.instructionText}>
                  Enter the code sent to{'\n'}
                  <Text style={{ fontWeight: '600', color: colors.text }}>
                    {formatDisplayPhone()}
                  </Text>
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.instructionText, { marginBottom: Spacing.sm, textAlign: 'left' }]}>
                  Verification Code
                </Text>
                <TextInput
                  style={styles.codeInput}
                  value={verificationCode}
                  onChangeText={(text) => {
                    setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                  }}
                  placeholder="000000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  editable={!verifying}
                />
                {devCode && (
                  <View style={[styles.devCodeContainer, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}>
                    <Text style={[styles.devCodeLabel, { color: colors.textSecondary }]}>
                      Development Mode - Your code:
                    </Text>
                    <Text style={[styles.devCodeText, { color: colors.primary }]}>
                      {devCode}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title={verifying ? "Verifying..." : "Continue"}
                  onPress={handleVerify}
                  variant="primary"
                  disabled={verifying || verificationCode.length !== 6}
                  loading={verifying}
                />
              </View>

              <View style={styles.resendContainer}>
                <TouchableOpacity
                  onPress={handleResendCode}
                  style={[styles.resendButton, sending && styles.resendButtonDisabled]}
                  disabled={sending}
                >
                  <Text style={styles.resendButtonText}>
                    {sending ? 'Sending...' : "Didn't receive a code? Resend"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <AlertModal {...alertState} onClose={hideAlert} />
    </SafeAreaView>
  );
}
