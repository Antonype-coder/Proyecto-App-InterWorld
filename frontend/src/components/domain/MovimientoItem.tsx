import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@theme/index';
import Badge from '../ui/Badge';
import { formatDateTime } from '@utils/format';
import type { MovimientoInventario, TipoMovimiento } from '@tipos/index';

interface MovimientoItemProps {
  movimiento: MovimientoInventario;
}

export default function MovimientoItem({
  movimiento,
}: MovimientoItemProps): React.ReactElement {
  const vis = getTipoVisual(movimiento.tipo);

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: vis.bg }]}>
        <MaterialCommunityIcons name={vis.icon} size={16} color={vis.color} />
      </View>

      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.producto} numberOfLines={1}>
            {movimiento.producto_nombre ??
              `Producto #${movimiento.producto_id}`}
          </Text>
          <Badge
            label={vis.label}
            variant={vis.badgeVariant}
            size="sm"
          />
        </View>
        <Text style={styles.motivo} numberOfLines={1}>
          {movimiento.motivo ?? 'Sin motivo'}
        </Text>
        <View style={styles.bottom}>
          <Text style={styles.cantidad}>
            {movimiento.tipo === 'salida'
              ? `-${movimiento.cantidad}`
              : movimiento.tipo === 'entrada'
                ? `+${movimiento.cantidad}`
                : movimiento.cantidad}
          </Text>
          <Text style={styles.stock}>
            {movimiento.stock_anterior} → {movimiento.stock_nuevo}
          </Text>
          <Text style={styles.fecha}>
            {formatDateTime(movimiento.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getTipoVisual(tipo: TipoMovimiento): {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
  badgeVariant: 'success' | 'danger' | 'info';
  label: string;
} {
  if (tipo === 'entrada') {
    return {
      icon: 'arrow-down',
      color: colors.success,
      bg: colors.successSubtle,
      badgeVariant: 'success',
      label: 'Entrada',
    };
  }
  if (tipo === 'salida') {
    return {
      icon: 'arrow-up',
      color: colors.danger,
      bg: colors.dangerSubtle,
      badgeVariant: 'danger',
      label: 'Salida',
    };
  }
  return {
    icon: 'swap-horizontal',
    color: colors.info,
    bg: colors.infoSubtle,
    badgeVariant: 'info',
    label: 'Ajuste',
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  producto: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  motivo: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cantidad: {
    ...typography.small,
    color: colors.textPrimary,
    fontFamily: typography.button.fontFamily,
  },
  stock: { ...typography.small, color: colors.textSecondary },
  fecha: { ...typography.small, color: colors.textMuted },
});