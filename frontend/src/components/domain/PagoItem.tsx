import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { formatCurrency, formatDateTime } from '@utils/format';
import { METODO_PAGO_LABEL } from '@utils/constants';
import type { PagoCredito } from '@tipos/index';

interface PagoItemProps {
  pago: PagoCredito;
}

export default function PagoItem({
  pago,
}: PagoItemProps): React.ReactElement {
  const colors = useColors();

  return (
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
        style={[styles.iconWrap, { backgroundColor: colors.successSubtle }]}
      >
        <MaterialCommunityIcons
          name="cash-check"
          size={18}
          color={colors.success}
        />
      </View>

      <View style={styles.info}>
        <Text style={[styles.metodo, { color: colors.textPrimary }]}>
          {METODO_PAGO_LABEL[pago.metodo_pago] ?? pago.metodo_pago}
        </Text>
        <Text style={[styles.fecha, { color: colors.textMuted }]}>
          {formatDateTime(pago.created_at)}
          {pago.usuario_nombre ? ` · ${pago.usuario_nombre}` : ''}
        </Text>
        {pago.notas ? (
          <Text
            style={[styles.notas, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {pago.notas}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.monto, { color: colors.successText }]}>
        {formatCurrency(pago.monto)}
      </Text>
    </View>
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
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1, minWidth: 0 },
  metodo: { ...typography.bodyBold },
  fecha: { ...typography.small, marginTop: 2 },
  notas: { ...typography.small, marginTop: 2 },
  monto: { ...typography.bodyBold },
});