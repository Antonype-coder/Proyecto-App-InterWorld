import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { formatCurrency } from '@utils/format';
import { getImageUrl } from '@utils/image';
import type { Producto } from '@tipos/index';

interface ProductCardProps {
  producto: Producto;
  onPress: () => void;
  compact?: boolean;
}

export default function ProductCard({
  producto,
  onPress,
  compact = false,
}: ProductCardProps): React.ReactElement {
  const colors = useColors();
  const imageUrl = getImageUrl(producto.imagenes?.[0] ?? producto.imagen);
  const agotado = producto.stock <= 0;
  const stockBajo =
    !agotado && producto.stock <= producto.stock_minimo;

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
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        compact ? styles.cardCompact : null,
        agotado ? styles.disabled : null,
        pressed && !agotado
          ? { backgroundColor: colors.surfacePressed }
          : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Agregar ${producto.nombre}`}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.bgSubtle,
            height: compact ? 64 : 84,
          },
        ]}
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
            size={compact ? 24 : 32}
            color={colors.textMuted}
          />
        )}

        {agotado ? (
          <View
            style={[
              styles.agotadoOverlay,
              { backgroundColor: colors.overlayLight },
            ]}
          >
            <Text style={[styles.agotadoText, { color: colors.textInverse }]}>
              Agotado
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.nombre, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {producto.nombre}
        </Text>

        <Text style={[styles.precio, { color: colors.textPrimary }]}>
          {formatCurrency(producto.precio_venta)}
        </Text>

        <View style={styles.stockRow}>
          <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
          <Text style={[styles.stockText, { color: colors.textMuted }]}>
            {agotado ? 'Sin stock' : `${producto.stock} disponibles`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardCompact: {
    maxWidth: 140,
  },
  disabled: { opacity: 0.6 },
  thumb: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImage: { width: '100%', height: '100%' },
  agotadoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agotadoText: {
    ...typography.buttonSmall,
  },
  info: {
    padding: spacing.sm,
    gap: 4,
  },
  nombre: {
    ...typography.small,
    fontFamily: typography.bodyBold.fontFamily,
    minHeight: 32,
  },
  precio: {
    ...typography.bodyBold,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { ...typography.tiny },
});