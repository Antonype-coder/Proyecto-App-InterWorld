import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { formatCurrency } from '@utils/format';
import type { Producto } from '@tipos/index';

interface ProductCompactItemProps {
  producto: Producto;
  onPress: () => void;
  isLast?: boolean;
}

export default function ProductCompactItem({
  producto,
  onPress,
  isLast = false,
}: ProductCompactItemProps): React.ReactElement {
  const colors = useColors();
  const agotado = producto.stock <= 0;

  return (
    <Pressable
      onPress={agotado ? undefined : onPress}
      disabled={agotado}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        isLast ? styles.last : null,
        agotado ? { opacity: 0.4 } : null,
        pressed && !agotado ? { backgroundColor: colors.surfacePressed } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Agregar ${producto.nombre}`}
    >
      <Text
        style={[styles.nombre, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {producto.nombre}
      </Text>

      <View style={styles.stockWrap}>
        <Text style={[styles.stock, { color: colors.textMuted }]}>
          {agotado ? '0' : producto.stock}
        </Text>
      </View>

      <Text style={[styles.precio, { color: colors.textPrimary }]}>
        {formatCurrency(producto.precio_venta)}
      </Text>

      <MaterialCommunityIcons
        name="plus"
        size={18}
        color={agotado ? colors.textDisabled : colors.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  last: { borderBottomWidth: 0 },
  nombre: { ...typography.body, flex: 1, minWidth: 0 },
  stockWrap: { minWidth: 32, alignItems: 'center' },
  stock: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },
  precio: {
    ...typography.bodyBold,
    minWidth: 78,
    textAlign: 'right',
  },
});