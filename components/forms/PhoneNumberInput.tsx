import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { ChevronDown } from 'lucide-react-native';

// Common country codes (most frequently used)
const COUNTRY_CODES = [
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: '+52', country: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳' },
  { code: '+82', country: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: '+31', country: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+32', country: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: '+45', country: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: '+47', country: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: '+353', country: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: '+64', country: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', country: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: '+852', country: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+971', country: 'AE', name: 'UAE', flag: '🇦🇪' },
];

interface PhoneNumberInputProps {
  value: string;
  onChangeText: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  editable?: boolean;
  error?: string;
}

/**
 * Format phone number as (XXX) XXX-XXXX
 */
function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

/**
 * Parse formatted phone number back to digits only
 */
function parsePhoneNumber(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export default function PhoneNumberInput({
  value,
  onChangeText,
  countryCode,
  onCountryCodeChange,
  placeholder = '(555) 123-4567',
  label = 'Phone Number',
  editable = true,
  error,
}: PhoneNumberInputProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);

  const selectedCountry = useMemo(
    () => COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0],
    [countryCode]
  );

  const formattedValue = useMemo(() => {
    return formatPhoneNumber(value);
  }, [value]);

  const handlePhoneChange = (text: string) => {
    // Extract only digits from the input
    const digits = text.replace(/\D/g, '');
    
    // Limit to 10 digits for US/Canada format
    const limited = digits.slice(0, 10);
    
    // Update parent component with digits only
    onChangeText(limited);
  };

  const handleSelectCountry = (code: string) => {
    onCountryCodeChange(code);
    setIsCountryPickerVisible(false);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: Spacing.lg,
    },
    label: {
      ...Typography.label,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    inputRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    countryCodeButton: {
      backgroundColor: colors.cardSecondary,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      height: 48,
    },
    countryCodeText: {
      ...Typography.body,
      fontSize: 17,
      color: colors.text,
      marginRight: Spacing.xs,
    },
    phoneInput: {
      flex: 1,
      backgroundColor: colors.cardSecondary,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      height: 48,
      ...Typography.body,
      fontSize: 17,
      color: colors.text,
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
    },
    errorText: {
      ...Typography.caption,
      color: colors.error,
      marginTop: Spacing.xs,
    },
    helperText: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      maxHeight: '80%',
      width: '100%',
      maxWidth: 400,
      ...Shadow.card,
    },
    modalHeader: {
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      ...Typography.h3,
      color: colors.text,
      textAlign: 'center',
    },
    countryList: {
      maxHeight: 400,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    countryItemSelected: {
      backgroundColor: `${colors.primary}15`,
    },
    countryFlag: {
      fontSize: 24,
      marginRight: Spacing.md,
    },
    countryInfo: {
      flex: 1,
    },
    countryName: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    countryCode: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    selectedIndicator: {
      marginLeft: Spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.countryCodeButton}
          onPress={() => editable && setIsCountryPickerVisible(true)}
          disabled={!editable}
          activeOpacity={0.7}
        >
          <Text style={styles.countryCodeText}>
            {selectedCountry.flag} {selectedCountry.code}
          </Text>
          {editable && <ChevronDown size={18} color={colors.textSecondary} />}
        </TouchableOpacity>

        <TextInput
          style={styles.phoneInput}
          value={formattedValue}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          editable={editable}
          autoComplete="tel"
          maxLength={14} // (XXX) XXX-XXXX = 14 chars
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.helperText}>
          Enter your 10-digit phone number
        </Text>
      )}

      <Modal
        visible={isCountryPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCountryPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCountryPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
            </View>
            
            <ScrollView style={styles.countryList} showsVerticalScrollIndicator>
              {COUNTRY_CODES.map((country) => (
                <TouchableOpacity
                  key={`${country.code}-${country.country}`}
                  style={[
                    styles.countryItem,
                    countryCode === country.code && styles.countryItemSelected,
                  ]}
                  onPress={() => handleSelectCountry(country.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryName}>{country.name}</Text>
                    <Text style={styles.countryCode}>{country.code}</Text>
                  </View>
                  {countryCode === country.code && (
                    <Text style={[styles.selectedIndicator, { color: colors.primary }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

