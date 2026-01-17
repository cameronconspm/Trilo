import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { ModalWrapper } from './ModalWrapper';
import { createScaleFadeAnimation } from '@/utils/modalAnimations';

interface ConfirmationAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: ConfirmationAction[];
  onClose: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  actions,
  onClose,
}: ConfirmationModalProps) {
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

  if (!visible) {
    return null;
  }

  // Find cancel and destructive actions
  const cancelAction = actions.find(a => a.style === 'cancel');
  const destructiveAction = actions.find(a => a.style === 'destructive');
  const defaultAction = actions.find(a => !a.style || a.style === 'default');

  return (
    <ModalWrapper visible={visible} onClose={onClose} animationType="fade" maxWidth={380}>
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
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          )}
        </View>

        <View style={styles.actionsWrapper}>
          {cancelAction && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                cancelAction.onPress?.();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {cancelAction.text}
              </Text>
            </TouchableOpacity>
          )}
          
          {destructiveAction && (
            <TouchableOpacity
              style={[styles.button, styles.destructiveButton, { backgroundColor: colors.error }]}
              onPress={() => {
                destructiveAction.onPress?.();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {destructiveAction.text}
              </Text>
            </TouchableOpacity>
          )}
          
          {defaultAction && !cancelAction && !destructiveAction && (
            <TouchableOpacity
              style={[styles.button, styles.defaultButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                defaultAction.onPress?.();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {defaultAction.text}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    width: '100%',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.xxl,
    minWidth: 300,
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionsWrapper: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  destructiveButton: {
    // backgroundColor set dynamically
  },
  defaultButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
