import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
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
  const colors = useColors();
  const anulada = venta.estado === 'anulada';

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
      accessibilityLabel={`Venta ${venta.numero}`}
    >
      <View style={styles.left}>
        <Text
          style={[styles.numero, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {venta.numero}
        </Text>
        <Text
          style={[styles.cliente, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {venta.cliente_nombre ?? 'Consumidor final'}
        </Text>
        <Text style={[styles.fecha, { color: colors.textMuted }]}>
          {formatDateTime(venta.created_at)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.total,
            {
              color: anulada ? colors.textMuted : colors.textPrimary,
              textDecorationLine: anulada ? 'line-through' : 'none',
            },
          ]}
        >
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  left: { flex: 1, marginRight: spacing.md },
  numero: { ...typography.bodyBold },
  cliente: { ...typography.caption, marginTop: 2 },
  fecha: { ...typography.small, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  total: { ...typography.bodyBold },
  badges: { flexDirection: 'row', gap: spacing.xs },
});