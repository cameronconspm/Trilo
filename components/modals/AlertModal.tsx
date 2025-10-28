import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import Button from '@/components/layout/Button';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

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

const { width: screenWidth } = Dimensions.get('window');

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
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { Icon: CheckCircle, color: colors.success };
      case 'warning':
        return { Icon: AlertTriangle, color: colors.warning };
      case 'error':
        return { Icon: AlertTriangle, color: colors.error };
      default:
        return { Icon: Info, color: colors.primary };
    }
  };

  const { Icon, color } = getIconAndColor();

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='none'
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.header}>
            <View
              style={[styles.iconContainer, { backgroundColor: `${color}15` }]}
            >
              <Icon size={24} color={color} strokeWidth={2} />
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.cardSecondary },
              ]}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {message && (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            {actions.map((action, index) => {
              console.log('AlertModal: Rendering button with text:', action.text);
              return (
                <Button
                  key={index}
                  title={action.text}
                  onPress={() => {
                    action.onPress?.();
                    onClose();
                  }}
                  variant={
                    action.style === 'destructive'
                      ? 'outline'
                      : action.style === 'cancel'
                        ? 'ghost'
                        : 'primary'
                  }
                  size='medium'
                  fullWidth={actions.length === 1} // Full width for single action
                  style={
                    [
                      action.style === 'destructive' && {
                        borderColor: colors.error,
                      },
                      index < actions.length - 1 && styles.actionButtonSpacing,
                    ] as any
                  }
                  textStyle={
                    action.style === 'destructive'
                      ? { color: colors.error }
                      : undefined
                  }
                />
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    borderRadius: BorderRadius.xxxl, // Apple's 28px corner radius
    width: Math.min(screenWidth * 0.9, 400),
    maxWidth: '100%',
    minHeight: 280, // Increased minimum height for better spacing
    ...Shadow.heavy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'column',
    paddingHorizontal: Spacing.lg, // Consistent with content padding
    paddingVertical: Spacing.lg, // Consistent vertical padding
    paddingTop: Spacing.md, // Top padding to separate from content
    gap: Spacing.md, // Consistent gap between buttons
  },
  actionButton: {
    flex: 1, // Use flex instead of fixed width
  },
  actionButtonSpacing: {
    marginBottom: 0,
  },
});
