import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@theme/index';
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
  const isAdmin = usuario.rol === 'admin';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
    >
      <Avatar
        nombre={usuario.nombre}
        size="md"
        bgColor={isAdmin ? colors.primary : colors.accent}
      />

      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>
          {usuario.nombre}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {usuario.email}
        </Text>
        <View style={styles.badges}>
          <Badge
            label={ROL_LABEL[usuario.rol]}
            variant={isAdmin ? 'accent' : 'neutral'}
            size="sm"
          />
          {usuario.activo !== 1 ? (
            <Badge label="Inactivo" variant="neutral" size="sm" />
          ) : null}
        </View>
      </View>

      {canDelete && onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteBtn}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={colors.textMuted}
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
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfacePressed },
  info: { flex: 1, marginLeft: spacing.md, marginRight: spacing.md },
  nombre: { ...typography.bodyBold, color: colors.textPrimary },
  email: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});