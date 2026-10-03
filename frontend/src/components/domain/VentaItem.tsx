import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography } from '@theme/index';
import Badge from '../ui/Badge';
import { formatCurrency, formatDateTime } from '@utils/format';
import type { VentaResumen } from '@tipos/index';

interface VentaItemProps {
  venta: VentaResumen;
  onPress: () => void;
}

export default function VentaItem({
  venta,
  onPress,
}: VentaItemProps): React.ReactElement {
  const anulada = venta.estado === 'anulada';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel={`Venta ${venta.numero}`}
    >
      <View style={styles.left}>
        <Text style={styles.numero} numberOfLines={1}>
          {venta.numero}
        </Text>
        <Text style={styles.cliente} numberOfLines={1}>
          {venta.cliente_nombre ?? 'Consumidor final'}
        </Text>
        <Text style={styles.fecha}>{formatDateTime(venta.created_at)}</Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.total, anulada ? styles.totalAnulada : null]}>
          {formatCurrency(venta.total)}
        </Text>
        <View style={styles.badges}>
          {anulada ? (
            <Badge label="Anulada" variant="danger" size="sm" />
          ) : (
            <Badge
              label={venta.tipo_pago === 'credito' ? 'Crédito' : 'Contado'}
              variant={venta.tipo_pago === 'credito' ? 'warning' : 'neutral'}
              size="sm"
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfacePressed },
  left: { flex: 1, marginRight: spacing.md },
  numero: { ...typography.bodyBold, color: colors.textPrimary },
  cliente: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  fecha: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  total: { ...typography.bodyBold, color: colors.textPrimary },
  totalAnulada: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  badges: { flexDirection: 'row', gap: spacing.xs },
});