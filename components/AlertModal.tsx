import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

interface AlertAction {
  text: string;
  onPress: () => void;
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
        return { Icon: CheckCircle, color: Colors.success };
      case 'warning':
        return { Icon: AlertTriangle, color: Colors.warning };
      case 'error':
        return { Icon: AlertTriangle, color: Colors.error };
      default:
        return { Icon: Info, color: Colors.primary };
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
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[styles.overlay, { opacity: opacityAnim }]}
      >
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
              <Icon size={24} color={color} strokeWidth={2} />
            </View>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <X size={20} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
          </View>
          
          <View style={styles.actions}>
            {actions.map((action, index) => (
              <Button
                key={index}
                title={action.text}
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
                variant={
                  action.style === 'destructive' ? 'outline' : 
                  action.style === 'cancel' ? 'ghost' : 'primary'
                }
                size="medium"
                style={[
                  styles.actionButton,
                  action.style === 'destructive' && styles.destructiveButton,
                  index < actions.length - 1 && styles.actionButtonSpacing
                ]}
                textStyle={action.style === 'destructive' ? styles.destructiveText : undefined}
              />
            ))}
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    width: Math.min(screenWidth * 0.9, 400),
    maxWidth: '100%',
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
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'column',
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  actionButtonSpacing: {
    marginBottom: 0,
  },
  destructiveButton: {
    borderColor: Colors.error,
  },
  destructiveText: {
    color: Colors.error,
  },
});