import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';

interface NameEditModalProps {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function NameEditModal({
  visible,
  currentName,
  onSave,
  onClose,
}: NameEditModalProps) {
  const [name, setName] = useState(currentName);
  const { theme } = useSettings();
  const colors = useThemeColors(theme);

  // Reset name when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setName(currentName);
    }
  }, [visible, currentName]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
      onClose();
    }
  };

  const handleClose = () => {
    setName(currentName); // Reset to original name
    onClose();
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Name</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder='Enter your full name'
              placeholderTextColor={colors.inactive}
              autoFocus
              returnKeyType='done'
              onSubmitEditing={handleSave}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.saveButton,
                !name.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Check size={18} color={colors.card} />
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Create dynamic styles function
function createStyles(colors: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      width: '90%',
      maxWidth: 400,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    content: {
      padding: Spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    input: {
      fontSize: 16,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.background,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actions: {
      flexDirection: 'row',
      padding: Spacing.lg,
      gap: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    saveButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    saveButtonDisabled: {
      backgroundColor: colors.inactive,
    },
    saveText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.card,
    },
  });
}
