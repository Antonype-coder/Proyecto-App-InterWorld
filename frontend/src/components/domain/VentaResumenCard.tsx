import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Badge from '../ui/Badge';
import { formatCurrency, formatDateTime } from '@utils/format';
import type { VentaCreditoResumen } from '@tipos/index';

interface VentaResumenCardProps {
  venta: VentaCreditoResumen;
  onPress?: () => void;
}

export default function VentaResumenCard({
  venta,
}: VentaResumenCardProps): React.ReactElement {
  const colors = useColors();
  const anulada = venta.estado === 'anulada';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: colors.bgSubtle }]}
      >
        <MaterialCommunityIcons
          name="receipt"
          size={18}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.numero,
            {
              color: colors.textPrimary,
              textDecorationLine: anulada ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {venta.numero}
        </Text>
        <Text style={[styles.fecha, { color: colors.textMuted }]}>
          {formatDateTime(venta.created_at)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.total,
            { color: anulada ? colors.textMuted : colors.textPrimary },
          ]}
        >
          {formatCurrency(venta.total)}
        </Text>
        {anulada ? (
          <Badge label="Anulada" variant="danger" size="sm" />
        ) : (
          <Badge label="Crédito" variant="warning" size="sm" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  numero: { ...typography.bodyBold },
  fecha: { ...typography.small, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  total: { ...typography.bodyBold },
});