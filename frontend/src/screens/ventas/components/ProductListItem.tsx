import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { formatCurrency } from '@utils/format';
import { getImageUrl } from '@utils/image';
import type { Producto } from '@tipos/index';

interface ProductListItemProps {
  producto: Producto;
  onPress: () => void;
  isLast?: boolean;
}

export default function ProductListItem({
  producto,
  onPress,
  isLast = false,
}: ProductListItemProps): React.ReactElement {
  const colors = useColors();
  const imageUrl = getImageUrl(producto.imagenes?.[0] ?? producto.imagen);
  const agotado = producto.stock <= 0;
  const stockBajo = !agotado && producto.stock <= producto.stock_minimo;

  const stockColor = agotado
    ? colors.danger
    : stockBajo
      ? colors.warning
      : colors.success;

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
        agotado ? { opacity: 0.5 } : null,
        pressed && !agotado ? { backgroundColor: colors.surfacePressed } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Agregar ${producto.nombre}`}
    >
      <View
        style={[styles.thumb, { backgroundColor: colors.bgSubtle }]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbImage}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={20}
            color={colors.textMuted}
          />
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.nombre, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {producto.nombre}
        </Text>
        <Text
          style={[styles.codigo, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {producto.codigo_barras}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.precio, { color: colors.textPrimary }]}>
          {formatCurrency(producto.precio_venta)}
        </Text>
        <View style={styles.stockRow}>
          <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
          <Text style={[styles.stock, { color: colors.textMuted }]}>
            {agotado ? 'Agotado' : `${producto.stock}`}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name="plus-circle-outline"
        size={22}
        color={agotado ? colors.textDisabled : colors.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  last: { borderBottomWidth: 0 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  info: { flex: 1, minWidth: 0 },
  nombre: { ...typography.bodyBold },
  codigo: { ...typography.small, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  precio: { ...typography.bodyBold },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stock: { ...typography.tiny },
});