import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Badge from '../ui/Badge';
import { formatCurrency } from '@utils/format';
import { getImageUrl } from '@utils/image';
import type { Producto } from '@tipos/index';
import type { BadgeVariant } from '@tipos/index';

interface ProductoItemProps {
  producto: Producto;
  onPress: () => void;
  showStock?: boolean;
}

export default function ProductoItem({
  producto,
  onPress,
  showStock = true,
}: ProductoItemProps): React.ReactElement {
  const colors = useColors();
  const stockBadge = getStockBadge(producto.stock, producto.stock_minimo);
  const imageUrl = getImageUrl(producto.imagenes?.[0] ?? producto.imagen);

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
      accessibilityLabel={`Producto ${producto.nombre}`}
    >
      <View
        style={[styles.thumbnail, { backgroundColor: colors.bgSubtle }]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnailImage}
            contentFit="cover"
          />
        ) : (
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={20}
            color={colors.textSecondary}
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
          style={[styles.meta, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {producto.categoria_nombre
            ? `${producto.categoria_nombre} · ${producto.codigo_barras}`
            : producto.codigo_barras}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.precio, { color: colors.textPrimary }]}>
          {formatCurrency(producto.precio_venta)}
        </Text>
        {showStock ? (
          <Badge
            label={stockBadge.label}
            variant={stockBadge.variant}
            size="sm"
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function getStockBadge(
  stock: number,
  minimo: number,
): { label: string; variant: BadgeVariant } {
  if (stock <= 0) return { label: 'Agotado', variant: 'danger' };
  if (stock <= minimo) return { label: `Stock: ${stock}`, variant: 'warning' };
  return { label: `Stock: ${stock}`, variant: 'success' };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  thumbnailImage: { width: '100%', height: '100%' },
  info: { flex: 1, marginRight: spacing.md },
  nombre: { ...typography.bodyBold },
  meta: { ...typography.small, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  precio: { ...typography.bodyBold },
});