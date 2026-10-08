import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Badge from '../ui/Badge';
import { formatDateTime } from '@utils/format';
import type { MovimientoInventario } from '@tipos/index';

interface MovimientoItemProps {
  movimiento: MovimientoInventario;
  onPress?: () => void;
}

export default function MovimientoItem({
  movimiento,
  onPress,
}: MovimientoItemProps): React.ReactElement {
  const colors = useColors();

  const tipoConfig = getTipoConfig(movimiento.tipo, colors);

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: tipoConfig.bg }]}
      >
        <MaterialCommunityIcons
          name={tipoConfig.icon}
          size={18}
          color={tipoConfig.color}
        />
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.nombre, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {movimiento.producto_nombre ?? `Producto #${movimiento.producto_id}`}
        </Text>
        <Text
          style={[styles.meta, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {formatDateTime(movimiento.created_at)}
          {movimiento.motivo ? ` · ${movimiento.motivo}` : ''}
        </Text>
      </View>

      <View style={styles.right}>
        <Badge
          label={tipoConfig.label}
          variant={tipoConfig.badge}
          size="sm"
        />
        <Text
          style={[styles.cantidad, { color: tipoConfig.color }]}
        >
          {movimiento.tipo === 'entrada' ? '+' : ''}
          {movimiento.tipo === 'salida' ? '-' : ''}
          {movimiento.cantidad}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed ? { backgroundColor: colors.surfacePressed } : null,
        ]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

function getTipoConfig(
  tipo: string,
  colors: ReturnType<typeof useColors>,
): {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
  badge: 'success' | 'danger' | 'warning' | 'neutral';
} {
  switch (tipo) {
    case 'entrada':
      return {
        label: 'Entrada',
        icon: 'arrow-down-circle-outline',
        color: colors.success,
        bg: colors.successSubtle,
        badge: 'success',
      };
    case 'salida':
      return {
        label: 'Salida',
        icon: 'arrow-up-circle-outline',
        color: colors.danger,
        bg: colors.dangerSubtle,
        badge: 'danger',
      };
    case 'ajuste':
    default:
      return {
        label: 'Ajuste',
        icon: 'tune-variant',
        color: colors.warning,
        bg: colors.warningSubtle,
        badge: 'warning',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1, minWidth: 0 },
  nombre: { ...typography.bodyBold },
  meta: { ...typography.small, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  cantidad: { ...typography.bodyBold },
});