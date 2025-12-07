import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';

interface ModalWrapperProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  maxWidth?: number; // Allow children to customize max width
  disableBackdropPress?: boolean; // Prevent closing by tapping backdrop
}

export function ModalWrapper({
  visible,
  onClose,
  children,
  animationType = 'fade',
  maxWidth = 400,
  disableBackdropPress = false,
}: ModalWrapperProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={disableBackdropPress ? undefined : onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)' }]}>
      <TouchableOpacity
        style={styles.overlayTouch}
        activeOpacity={1}
        onPress={disableBackdropPress ? undefined : onClose}
        disabled={disableBackdropPress}
      >
        <View />
      </TouchableOpacity>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.card,
              maxWidth: maxWidth, // Dynamic max width
              ...Platform.select({
                ios: {
                  shadowColor: theme === 'dark' ? '#FFFFFF' : '#000000',
                  shadowOffset: { width: 0, height: 24 },
                  shadowOpacity: theme === 'dark' ? 0.15 : 0.2,
                  shadowRadius: 48,
                },
                android: {
                  elevation: 24,
                },
              }),
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Outline with subtle light highlight */}
          <View
            style={[
              styles.modalOutline,
              {
                borderWidth: 1,
                borderColor:
                  theme === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                ...Platform.select({
                  ios:
                    theme === 'dark' && {
                      shadowColor: '#FFFFFF',
                      shadowOffset: { width: -1, height: -1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 8,
                    },
                }),
              },
            ]}
          />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl, // 24px - standard modal padding
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: '100%',
    borderRadius: BorderRadius.xxxl, // 28px - Apple's modern modal corner radius
    padding: 0, // Let child components control padding for better consistency
    maxHeight: '85%', // Slightly reduced to ensure buttons aren't at edge of screen
    overflow: 'hidden', // Ensure content doesn't extend beyond rounded corners
    alignSelf: 'center', // Center the modal
    // Allow content to determine actual height
    flexShrink: 1,
  },
  modalOutline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xxxl, // 28px - matches modal
    pointerEvents: 'none',
  },
});

