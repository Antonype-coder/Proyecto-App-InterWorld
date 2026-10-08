import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
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
  const colors = useColors();
  const deuda = parseFloat(cliente.saldo_deuda);
  const tieneDeuda = deuda > 0;

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
      accessibilityLabel={cliente.nombre}
    >
      <Avatar nombre={cliente.nombre} size="md" />
      <View style={styles.info}>
        <Text
          style={[styles.nombre, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {cliente.nombre}
        </Text>
        <Text
          style={[styles.meta, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {cliente.documento ?? cliente.telefono ?? 'Sin datos de contacto'}
        </Text>
      </View>
      <View style={styles.right}>
        {tieneDeuda ? (
          <>
            <Text
              style={[styles.deuda, { color: colors.dangerText }]}
            >
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  info: { flex: 1, marginHorizontal: spacing.md },
  nombre: { ...typography.bodyBold },
  meta: { ...typography.small, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  deuda: { ...typography.bodyBold },
});