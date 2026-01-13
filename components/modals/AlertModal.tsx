import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
// Removed unused imports for Apple-style alert (no icons, no Button component)
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { ModalWrapper } from './ModalWrapper';
import { createScaleFadeAnimation } from '@/utils/modalAnimations';

interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actions: AlertAction[];
  onClose: () => void;
}

// Apple-style alert modal spacing constants - matches iOS UIAlertController
const APPLE_ALERT_STANDARDS = {
  // Container padding - Apple uses ~20px
  paddingHorizontal: 20,
  paddingTop: 20,
  paddingBottom: 12, // Less bottom padding, buttons handle their own
  
  // Content spacing
  titleMessageGap: 4, // Tight gap between title and message
  contentBottomMargin: 8, // Small gap before buttons
  
  // Alert dimensions
  maxWidth: 270, // Apple's standard alert width
  cornerRadius: 14, // Apple's alert corner radius (not 28px like sheets)
  
  // Button styling
  buttonHeight: 44, // Minimum touch target
  buttonDividerHeight: StyleSheet.hairlineWidth, // Thin divider between buttons
  buttonTextSize: 17, // Apple's standard button text size
  destructiveTextColor: '#FF3B30', // Apple's system red
} as const;


export default function AlertModal({
  visible,
  title,
  message,
  type = 'info',
  actions,
  onClose,
}: AlertModalProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [scaleAnim] = React.useState(new Animated.Value(0));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    const animation = createScaleFadeAnimation(scaleAnim, opacityAnim, visible);
    animation.start();

    return () => {
      animation.stop();
    };
  }, [visible, scaleAnim, opacityAnim]);

  // Apple-style alerts don't show icons - removed icon logic

  if (!visible) {
    return null;
  }

  // Apple-style: Buttons are displayed in order, styled by their action type
  // Destructive actions are red, cancel actions are gray, default actions are blue
  
  // Apple-style: Use fixed width for all alerts
  const modalMaxWidth = APPLE_ALERT_STANDARDS.maxWidth;

  return (
    <ModalWrapper visible={visible} onClose={onClose} animationType="none" maxWidth={modalMaxWidth}>
      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.card,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Apple-style: No close button, no icon - just title and message */}
        
        {/* Content - Apple style: centered text */}
        <View style={styles.content}>
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          )}
        </View>

        {/* Apple-style: Vertical stacked buttons with dividers */}
        <View style={styles.actionsWrapper}>
          {/* All buttons in vertical stack - Apple style */}
          {actions.map((action, index) => {
            const isLast = index === actions.length - 1;
            const isDestructive = action.style === 'destructive';
            const isCancel = action.style === 'cancel';
            
            return (
              <View key={`action-${index}`}>
                {/* Divider between buttons - Apple style */}
                {index > 0 && (
                  <View
                    style={[
                      styles.buttonDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
                
                {/* Button - Apple style: full width, text-only */}
                <TouchableOpacity
                  style={[
                    styles.appleButton,
                    {
                      height: APPLE_ALERT_STANDARDS.buttonHeight,
                    },
                  ]}
                  onPress={() => {
                    action.onPress?.();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.appleButtonText,
                      {
                        color: isDestructive
                          ? APPLE_ALERT_STANDARDS.destructiveTextColor
                          : isCancel
                          ? colors.textSecondary
                          : colors.primary,
                      },
                    ]}
                  >
                    {action.text}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  // Apple-style modal container
  modalContainer: {
    width: '100%',
    paddingHorizontal: APPLE_ALERT_STANDARDS.paddingHorizontal,
    paddingTop: APPLE_ALERT_STANDARDS.paddingTop,
    paddingBottom: APPLE_ALERT_STANDARDS.paddingBottom,
    overflow: 'hidden', // Ensure buttons respect rounded corners
    borderRadius: APPLE_ALERT_STANDARDS.cornerRadius, // Override ModalWrapper's 28px with 14px for alerts
    marginHorizontal: 0, // Remove any default margins
  },
  
  // Content section - Apple style: centered text, tight spacing
  content: {
    alignItems: 'center',
    marginBottom: APPLE_ALERT_STANDARDS.contentBottomMargin,
    paddingHorizontal: 4, // Small padding for very long text
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: APPLE_ALERT_STANDARDS.titleMessageGap,
    lineHeight: 22,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Actions wrapper - Apple style: vertical stack
  actionsWrapper: {
    width: '100%',
    marginTop: 8,
    overflow: 'hidden',
    borderRadius: 0, // Buttons extend to edges
  },
  
  // Button divider - Apple style: hairline separator
  buttonDivider: {
    height: APPLE_ALERT_STANDARDS.buttonDividerHeight,
    width: '100%',
  },
  
  // Apple-style button: full width, text only, no background
  appleButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0, // Height handles vertical space
  },
  
  // Apple-style button text
  appleButtonText: {
    fontSize: APPLE_ALERT_STANDARDS.buttonTextSize,
    fontWeight: '400',
    textAlign: 'center',
  },
});
