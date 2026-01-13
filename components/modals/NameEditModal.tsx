import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Typography } from '@/constants/spacing';
import { ModalWrapper } from './ModalWrapper';

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
    <ModalWrapper visible={visible} onClose={handleClose} animationType="none">
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
    </ModalWrapper>
  );
}

// Create dynamic styles function
function createStyles(colors: any) {
  return StyleSheet.create({
    keyboardView: {
      width: '100%',
    },
    modal: {
      backgroundColor: colors.card,
      width: '100%',
      maxWidth: 400,
      overflow: 'hidden',
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.xl, // Standard modal padding (24px)
      paddingTop: Spacing.lg + Spacing.md, // Extra top padding for close button
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...Typography.h3, // 20pt, semibold - matches app standards
      color: colors.text,
    },
    closeButton: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      padding: Spacing.xs,
      zIndex: 10,
    },
    content: {
      padding: Spacing.xl, // Standard modal padding (24px)
    },
    label: {
      ...Typography.label, // 13pt, medium - matches app standards
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
      padding: Spacing.xl, // Standard modal padding (24px)
      gap: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.modern, // 12px - matches Button component
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      ...Typography.bodyMedium, // 17pt, medium - matches app standards
      color: colors.textSecondary,
    },
    saveButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.modern, // 12px - matches Button component
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    saveButtonDisabled: {
      backgroundColor: colors.inactive,
    },
    saveText: {
      ...Typography.bodyMedium, // 17pt, medium - matches app standards
      fontWeight: '600',
      color: colors.card,
    },
  });
}
