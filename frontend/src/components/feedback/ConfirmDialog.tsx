import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Modal from '@components/ui/Modal';
import Button from '@components/ui/Button';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement {
  const colors = useColors();

  const palette = getPalette(variant, colors);

  return (
    <Modal visible={visible} onClose={onCancel}>
      <View style={styles.body}>
        <View
          style={[styles.iconWrap, { backgroundColor: palette.bg }]}
        >
          <MaterialCommunityIcons
            name={palette.icon}
            size={24}
            color={palette.color}
          />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <Button
            label={cancelLabel}
            variant="outline"
            onPress={onCancel}
            disabled={loading}
            fullWidth
          />
        </View>
        <View style={styles.actionItem}>
          <Button
            label={confirmLabel}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

function getPalette(
  variant: ConfirmVariant,
  colors: ReturnType<typeof useColors>,
): {
  bg: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
} {
  switch (variant) {
    case 'warning':
      return {
        bg: colors.warningSubtle,
        color: colors.warning,
        icon: 'alert-outline',
      };
    case 'info':
      return {
        bg: colors.infoSubtle,
        color: colors.info,
        icon: 'information-outline',
      };
    case 'danger':
    default:
      return {
        bg: colors.dangerSubtle,
        color: colors.danger,
        icon: 'alert-octagon-outline',
      };
  }
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionItem: { flex: 1 },
});