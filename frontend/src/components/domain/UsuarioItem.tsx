import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { ROL_LABEL } from '@utils/constants';
import type { Usuario } from '@tipos/index';

interface UsuarioItemProps {
  usuario: Usuario;
  onPress: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

export default function UsuarioItem({
  usuario,
  onPress,
  onDelete,
  canDelete = false,
}: UsuarioItemProps): React.ReactElement {
  const colors = useColors();
  const activo = usuario.activo === 1;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        pressed ? { backgroundColor: colors.surfacePressed } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={usuario.nombre}
    >
      <Avatar nombre={usuario.nombre} size="md" />

      <View style={styles.info}>
        <Text
          style={[styles.nombre, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {usuario.nombre}
        </Text>
        <Text
          style={[styles.email, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {usuario.email}
        </Text>
      </View>

      <View style={styles.right}>
        <Badge
          label={ROL_LABEL[usuario.rol] ?? usuario.rol}
          variant={usuario.rol === 'admin' ? 'accent' : 'neutral'}
          size="sm"
        />
        {!activo ? (
          <Badge label="Inactivo" variant="danger" size="sm" />
        ) : null}
      </View>

      {canDelete && onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [
            styles.deleteBtn,
            { backgroundColor: colors.dangerSubtle },
            pressed ? { opacity: 0.7 } : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Desactivar ${usuario.nombre}`}
        >
          <MaterialCommunityIcons
            name="account-off-outline"
            size={16}
            color={colors.danger}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  info: { flex: 1, marginHorizontal: spacing.md, minWidth: 0 },
  nombre: { ...typography.bodyBold },
  email: { ...typography.small, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});