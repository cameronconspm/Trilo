import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import Button from '@/components/layout/Button';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Shadow, Typography } from '@/constants/spacing';
import { ModalWrapper } from './ModalWrapper';

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

// Standardized modal spacing constants - consistent across all modals
const MODAL_STANDARDS = {
  // Container padding - all sides have consistent spacing
  paddingHorizontal: Spacing.xxl, // 24px - standard horizontal padding
  paddingTop: Spacing.xxl + Spacing.md, // 32px - top padding with close button clearance
  paddingBottom: Spacing.xxl, // 24px - base bottom padding
  
  // Close button positioning
  closeButtonTop: Spacing.md, // 12px from top
  closeButtonRight: Spacing.md, // 12px from right
  
  // Icon section spacing
  iconTopMargin: Spacing.md, // 12px - clearance from close button
  iconBottomMargin: Spacing.xl, // 20px - spacing before title
  
  // Content spacing
  contentBottomMargin: Spacing.xxl, // 24px - spacing before buttons
  titleMessageGap: Spacing.md, // 12px - gap between title and message
  
  // Button section spacing
  buttonGap: Spacing.md, // 12px - horizontal gap between buttons
  buttonBottomPadding: Spacing.xxl, // 24px - bottom padding for buttons
  
  // Destructive button clearance
  destructiveBottomPadding: Spacing.xxl + Spacing.lg, // 40px - extra for border clearance
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

  // Determine if this is a confirmation modal (has destructive action)
  const hasDestructiveButton = actions.some(action => action.style === 'destructive');
  
  // Separate cancel and action buttons for horizontal layout
  // Cancel button: explicitly marked as 'cancel', or first non-destructive button
  // Action button: destructive (red) or default/primary (blue)
  const cancelAction = actions.find(action => action.style === 'cancel') || 
    actions.find(action => action.style !== 'destructive' && action.style !== 'default');
  
  const primaryAction = actions.find(action => action.style === 'destructive') || 
    actions.find(action => action.style === 'default') ||
    actions.find(action => !cancelAction || action !== cancelAction);
  
  const otherActions = actions.filter(action => 
    action !== cancelAction && action !== primaryAction
  );
  
  // Calculate bottom padding - extra clearance for destructive buttons with borders
  const bottomPadding = hasDestructiveButton 
    ? MODAL_STANDARDS.destructiveBottomPadding 
    : MODAL_STANDARDS.buttonBottomPadding;

  // Modal width based on action type
  // Confirmation modals (with destructive): 320px - compact confirmation style
  // Standard modals: 400px - comfortable width for content
  const modalMaxWidth = hasDestructiveButton ? 320 : 400;

  return (
    <ModalWrapper visible={visible} onClose={onClose} animationType="fade" maxWidth={modalMaxWidth}>
      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.card,
            transform: [{ scale: scaleAnim }],
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {/* Close button in top-right corner */}
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: colors.cardSecondary },
          ]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Icon centered at top */}
        <View style={styles.iconSection}>
          <View
            style={[styles.iconContainer, { backgroundColor: `${color}15` }]}
          >
            <Icon size={28} color={color} strokeWidth={2.5} />
          </View>
        </View>

        {/* Content with consistent alignment */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          )}
        </View>

        {/* Actions - Standardized layout: Cancel (left) + Action (right) */}
        <View style={styles.actionsWrapper}>
          {/* Primary button row: Cancel (left) + Action (right) */}
          {(cancelAction || primaryAction) && (
            <View style={styles.actionsContainer}>
              {/* Cancel button on the left */}
              {cancelAction && (
                <Button
                  title={cancelAction.text}
                  onPress={() => {
                    cancelAction.onPress?.();
                    onClose();
                  }}
                  variant="ghost"
                  size="medium"
                  style={[
                    styles.cancelButton,
                    !primaryAction ? styles.singleButton : undefined, // Full width if no action button
                  ].filter(Boolean) as any}
                  textStyle={{ color: colors.textSecondary }}
                />
              )}
              
              {/* Primary action button on the right - Blue for proceed, Red for caution */}
              {primaryAction && (
                <Button
                  title={primaryAction.text}
                  onPress={() => {
                    primaryAction.onPress?.();
                    onClose();
                  }}
                  variant={primaryAction.style === 'destructive' ? 'outline' : 'primary'}
                  size="medium"
                  style={[
                    styles.actionButton,
                    !cancelAction ? styles.singleButton : undefined, // Full width if no cancel button
                    primaryAction.style === 'destructive' ? {
                      borderColor: colors.error,
                      borderWidth: 1.5,
                    } : undefined,
                  ].filter(Boolean) as any}
                  textStyle={
                    primaryAction.style === 'destructive'
                      ? { color: colors.error }
                      : undefined
                  }
                />
              )}
            </View>
          )}
          
          {/* Additional actions (if any) - stacked below, full width */}
          {otherActions.length > 0 && (
            <View style={styles.additionalActionsContainer}>
              {otherActions.map((action, index) => (
                <Button
                  key={`other-${index}`}
                  title={action.text}
                  onPress={() => {
                    action.onPress?.();
                    onClose();
                  }}
                  variant={action.style === 'destructive' ? 'outline' : 'primary'}
                  size="medium"
                  fullWidth
                  style={[
                    styles.additionalButton,
                    action.style === 'destructive' && {
                      borderColor: colors.error,
                      borderWidth: 1.5,
                    },
                  ] as any}
                  textStyle={
                    action.style === 'destructive'
                      ? { color: colors.error }
                      : undefined
                  }
                />
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  // Standardized modal container - consistent spacing on all sides
  modalContainer: {
    width: '100%',
    paddingHorizontal: MODAL_STANDARDS.paddingHorizontal, // 24px - standard horizontal padding
    paddingTop: MODAL_STANDARDS.paddingTop, // 32px - top padding with close button clearance
    paddingBottom: MODAL_STANDARDS.paddingBottom, // 24px - base bottom (overridden dynamically)
    position: 'relative',
    minHeight: 'auto',
  },
  
  // Close button - top right, consistent positioning
  closeButton: {
    position: 'absolute',
    top: MODAL_STANDARDS.closeButtonTop, // 12px from top
    right: MODAL_STANDARDS.closeButtonRight, // 12px from right
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  // Icon section - centered, standardized spacing
  iconSection: {
    alignItems: 'center',
    marginTop: MODAL_STANDARDS.iconTopMargin, // 12px - clearance from close button
    marginBottom: MODAL_STANDARDS.iconBottomMargin, // 20px - spacing before title
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Content section - centered alignment, standardized spacing
  content: {
    alignItems: 'center',
    marginBottom: MODAL_STANDARDS.contentBottomMargin, // 24px - spacing before buttons
    gap: MODAL_STANDARDS.titleMessageGap, // 12px - gap between title and message
    paddingHorizontal: 0, // No extra padding - container handles it
  },
  title: {
    ...Typography.h3, // 20pt - Apple HIG standard
    textAlign: 'center',
    marginBottom: 0, // Gap handles spacing
  },
  message: {
    ...Typography.body, // 17pt - Apple HIG standard
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xs, // 4px - minimal padding for very long text
  },
  
  // Actions wrapper - contains button row and any additional buttons
  actionsWrapper: {
    width: '100%',
    marginTop: 0, // Content marginBottom handles spacing
  },
  
  // Primary actions container - horizontal layout: Cancel (left) + Action (right)
  actionsContainer: {
    flexDirection: 'row',
    gap: MODAL_STANDARDS.buttonGap, // 12px - horizontal gap between buttons
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Cancel button (left side) - ghost style, secondary text color
  cancelButton: {
    flex: 1, // Takes available space, shares with action button
    minWidth: 0, // Allows flex to work properly
  },
  
  // Action button (right side) - primary (blue) or destructive (red outline)
  actionButton: {
    flex: 1, // Takes available space, shares with cancel button
    minWidth: 0, // Allows flex to work properly
  },
  
  // Additional actions container - for stacked buttons below primary row
  additionalActionsContainer: {
    width: '100%',
    marginTop: MODAL_STANDARDS.buttonGap, // 12px - spacing from button row above
    gap: MODAL_STANDARDS.buttonGap, // 12px - gap between additional buttons
  },
  
  // Additional buttons - full width, stacked
  additionalButton: {
    width: '100%',
  },
  
  // Single button style - when only one button in row, make it full width
  singleButton: {
    flex: 1,
    width: '100%',
  },
});
