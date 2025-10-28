import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';

interface ModalWrapperProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
}

export function ModalWrapper({
  visible,
  onClose,
  children,
  animationType = 'fade',
}: ModalWrapperProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)' }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        >
          <View />
        </TouchableOpacity>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.card,
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
    padding: 20,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalOutline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    pointerEvents: 'none',
  },
});

