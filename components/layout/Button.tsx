import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import {
  Spacing,
  SpacingValues,
  BorderRadius,
  Shadow,
  Typography,
} from '@/constants/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean; // New prop for full-width buttons
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  testID?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
}: ButtonProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return { backgroundColor: colors.secondary };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        }; // Increased border width
      case 'ghost':
        return { backgroundColor: 'transparent' };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.card;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.card;
    }
  };

  console.log('Button: Rendering with title:', title, 'variant:', variant, 'textColor:', getTextColor());

  const buttonStyle = [
    styles.button,
    styles[size],
    fullWidth && styles.fullWidth,
    getVariantStyles(),
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${size}Text`],
    { color: variant === 'primary' ? '#FFFFFF' : getTextColor() }, // Force white for primary buttons
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
      accessible={true}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'secondary'
              ? colors.card
              : colors.primary
          }
          size='small'
        />
      ) : (
        <Text 
          style={buttonTextStyle}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12, // ENFORCED: Uniform 12px corner radius
    minHeight: 48, // Increased from 44pt to 48pt for better text clearance
    paddingVertical: 14, // Increased padding for better text spacing
    paddingHorizontal: 20, // ENFORCED: Standard internal padding
    // ...Shadow.light, // Temporarily removed to debug text visibility
  },

  // Size variants - All must be at least 48pt high for proper text clearance
  small: {
    minHeight: 48, // Increased from 44pt to 48pt
    paddingVertical: 14, // Increased padding for better text spacing
    paddingHorizontal: 20, // ENFORCED: Standard padding
  },
  medium: {
    minHeight: 48, // Increased from 44pt to 48pt
    paddingVertical: 14, // Increased padding for better text spacing
    paddingHorizontal: 20, // ENFORCED: Standard padding
  },
  large: {
    minHeight: 48, // Increased from 44pt to 48pt
    paddingVertical: 14, // Increased padding for better text spacing
    paddingHorizontal: 20, // ENFORCED: Standard padding
  },

  // Full width variant for modals and major actions
  fullWidth: {
    flex: 1, // Use flex instead of fixed width
    // Remove marginHorizontal to allow true full width
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  // Text styles - ENFORCED: SF Pro 17pt semibold
  text: {
    fontSize: 17, // ENFORCED: Exactly 17pt
    fontWeight: '600', // ENFORCED: Semibold weight
    textAlign: 'center', // ENFORCED: Center-aligned
    letterSpacing: -0.1,
    fontFamily: 'System', // ENFORCED: SF Pro system font
  },

  // All text variants must be identical - no size differences
  smallText: {
    fontSize: 17, // ENFORCED: Exactly 17pt (no smaller)
    fontWeight: '600', // ENFORCED: Semibold weight
    textAlign: 'center', // ENFORCED: Center-aligned
    fontFamily: 'System', // ENFORCED: SF Pro system font
  },
  mediumText: {
    fontSize: 17, // ENFORCED: Exactly 17pt
    fontWeight: '600', // ENFORCED: Semibold weight
    textAlign: 'center', // ENFORCED: Center-aligned
    fontFamily: 'System', // ENFORCED: SF Pro system font
  },
  largeText: {
    fontSize: 17, // ENFORCED: Exactly 17pt
    fontWeight: '600', // ENFORCED: Semibold weight
    textAlign: 'center', // ENFORCED: Center-aligned
    fontFamily: 'System', // ENFORCED: SF Pro system font
  },

  disabledText: {
    opacity: 0.7,
  },
});
