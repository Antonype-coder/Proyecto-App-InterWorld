import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '@theme/index';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { formatCurrency } from '@utils/format';
import type { Cliente } from '@tipos/index';

interface ClienteItemProps {
  cliente: Cliente;
  onPress: () => void;
}

export default function ClienteItem({
  cliente,
  onPress,
}: ClienteItemProps): React.ReactElement {
  const deuda = parseFloat(cliente.saldo_deuda);
  const tieneDeuda = deuda > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel={cliente.nombre}
    >
      <Avatar nombre={cliente.nombre} size="md" />
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>
          {cliente.nombre}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {cliente.documento ?? cliente.telefono ?? 'Sin datos de contacto'}
        </Text>
      </View>
      <View style={styles.right}>
        {tieneDeuda ? (
          <>
            <Text style={styles.deuda}>
              {formatCurrency(cliente.saldo_deuda)}
            </Text>
            <Badge label="Debe" variant="danger" size="sm" />
          </>
        ) : (
          <Badge label="Al día" variant="success" size="sm" />
        )}
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
  info: { flex: 1, marginHorizontal: spacing.md },
  nombre: { ...typography.bodyBold, color: colors.textPrimary },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  deuda: { ...typography.bodyBold, color: colors.danger },
});