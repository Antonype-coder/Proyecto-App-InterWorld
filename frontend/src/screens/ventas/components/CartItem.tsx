import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { formatCurrency } from '@utils/format';
import { getImageUrl } from '@utils/image';
import type { CarritoItem } from '@tipos/index';
import type { CartViewMode } from '@hooks/useViewMode';

interface CartItemProps {
  item: CarritoItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  isLast?: boolean;
  mode?: CartViewMode;
}

export default function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  isLast = false,
  mode = 'comfortable',
}: CartItemProps): React.ReactElement {
  const colors = useColors();

  const subtotal = parseFloat(item.producto.precio_venta) * item.cantidad;
  const atMax = item.cantidad >= item.producto.stock;
  const atMin = item.cantidad <= 1;

  // Modo COMPACTA
  if (mode === 'compact') {
    return (
      <View
        style={[
          styles.compact,
          { borderBottomColor: colors.border },
          isLast ? styles.last : null,
        ]}
      >
        <Text
          style={[styles.compactCantidad, { color: colors.accent }]}
          numberOfLines={1}
        >
          {item.cantidad}×
        </Text>
        <Text
          style={[styles.compactNombre, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.producto.nombre}
        </Text>

        <View style={styles.compactStepper}>
          <Pressable
            onPress={atMin ? onRemove : onDecrement}
            hitSlop={6}
            style={styles.compactStepBtn}
          >
            <MaterialCommunityIcons
              name={atMin ? 'close' : 'minus'}
              size={12}
              color={atMin ? colors.danger : colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={onIncrement}
            disabled={atMax}
            hitSlop={6}
            style={[styles.compactStepBtn, atMax ? { opacity: 0.3 } : null]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={12}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <Text
          style={[styles.compactSubtotal, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {formatCurrency(subtotal)}
        </Text>
      </View>
    );
  }

  // Modo DETALLADA
  if (mode === 'detailed') {
    const imageUrl = getImageUrl(
      item.producto.imagenes?.[0] ?? item.producto.imagen,
    );

    return (
      <View
        style={[
          styles.detailed,
          { borderBottomColor: colors.border },
          isLast ? styles.last : null,
        ]}
      >
        <View
          style={[styles.thumbWrap, { backgroundColor: colors.bgSubtle }]}
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

        <View style={styles.detailedInfo}>
          <View style={styles.detailedHeader}>
            <Text
              style={[styles.detailedNombre, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.producto.nombre}
            </Text>
            <Pressable onPress={onRemove} hitSlop={6}>
              <MaterialCommunityIcons
                name="close"
                size={14}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <Text
            style={[styles.detailedCodigo, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {item.producto.codigo_barras} · Stock: {item.producto.stock}
          </Text>

          <View style={styles.detailedBottom}>
            <Text
              style={[styles.detailedPrecio, { color: colors.textSecondary }]}
            >
              {formatCurrency(item.producto.precio_venta)} c/u
            </Text>
            <Text
              style={[styles.detailedSubtotal, { color: colors.textPrimary }]}
            >
              {formatCurrency(subtotal)}
            </Text>
          </View>

          <View style={styles.detailedStepperWrap}>
            <View
              style={[
                styles.stepper,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Pressable
                onPress={atMin ? onRemove : onDecrement}
                style={({ pressed }) => [
                  styles.stepBtn,
                  pressed ? { backgroundColor: colors.surfacePressed } : null,
                ]}
              >
                <MaterialCommunityIcons
                  name={atMin ? 'trash-can-outline' : 'minus'}
                  size={14}
                  color={atMin ? colors.danger : colors.textPrimary}
                />
              </Pressable>
              <Text
                style={[styles.stepValue, { color: colors.textPrimary }]}
              >
                {item.cantidad}
              </Text>
              <Pressable
                onPress={onIncrement}
                disabled={atMax}
                style={({ pressed }) => [
                  styles.stepBtn,
                  pressed && !atMax
                    ? { backgroundColor: colors.surfacePressed }
                    : null,
                  atMax ? { opacity: 0.4 } : null,
                ]}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={14}
                  color={colors.textPrimary}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ============================================================
  // Modo CÓMODA — GRANDE y bien visible
  // ============================================================
  const imageUrl = getImageUrl(
    item.producto.imagenes?.[0] ?? item.producto.imagen,
  );

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: colors.border },
        isLast ? styles.last : null,
      ]}
    >
      {/* Fila superior: nombre + subtotal grande */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[styles.nombre, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {item.producto.nombre}
          </Text>

          <Text style={[styles.precio, { color: colors.textSecondary }]}>
            {formatCurrency(item.producto.precio_venta)} c/u
          </Text>
        </View>

        <Text style={[styles.subtotal, { color: colors.textPrimary }]}>
          {formatCurrency(subtotal)}
        </Text>
      </View>

      {/* Fila inferior: stepper grande + código */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomInfo}>
          <View
            style={[
              styles.miniThumb,
              { backgroundColor: colors.bgSubtle },
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
                size={14}
                color={colors.textMuted}
              />
            )}
          </View>

          <Text
            style={[styles.codigo, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {item.producto.codigo_barras}
          </Text>
        </View>

        <View
          style={[
            styles.stepper,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Pressable
            onPress={atMin ? onRemove : onDecrement}
            style={({ pressed }) => [
              styles.stepBtn,
              pressed ? { backgroundColor: colors.surfacePressed } : null,
            ]}
            accessibilityLabel={atMin ? 'Quitar' : 'Disminuir'}
          >
            <MaterialCommunityIcons
              name={atMin ? 'trash-can-outline' : 'minus'}
              size={18}
              color={atMin ? colors.danger : colors.textPrimary}
            />
          </Pressable>

          <Text style={[styles.stepValue, { color: colors.textPrimary }]}>
            {item.cantidad}
          </Text>

          <Pressable
            onPress={onIncrement}
            disabled={atMax}
            style={({ pressed }) => [
              styles.stepBtn,
              pressed && !atMax
                ? { backgroundColor: colors.surfacePressed }
                : null,
              atMax ? { opacity: 0.4 } : null,
            ]}
            accessibilityLabel="Aumentar"
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ============ CÓMODA (GRANDE) ============
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  last: { borderBottomWidth: 0 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  nombre: {
    ...typography.bodyBold,
    fontSize: 16,
    lineHeight: 22,
  },
  precio: {
    ...typography.small,
    marginTop: 3,
  },
  subtotal: {
    ...typography.bodyBold,
    fontSize: 18,
    lineHeight: 24,
    minWidth: 90,
    textAlign: 'right',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  miniThumb: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  codigo: {
    ...typography.tiny,
    flex: 1,
    minWidth: 0,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
  },
  stepBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    ...typography.bodyBold,
    fontSize: 16,
    minWidth: 36,
    textAlign: 'center',
  },

  // ============ COMPACTA ============
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  compactCantidad: {
    ...typography.bodyBold,
    fontFamily: typography.button.fontFamily,
    minWidth: 28,
  },
  compactNombre: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
  },
  compactStepper: {
    flexDirection: 'row',
    gap: 2,
  },
  compactStepBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactSubtotal: {
    ...typography.bodyBold,
    minWidth: 70,
    textAlign: 'right',
  },

  // ============ DETALLADA ============
  detailed: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailedInfo: { flex: 1, minWidth: 0, gap: 4 },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailedNombre: { ...typography.bodyBold, flex: 1, minWidth: 0 },
  detailedCodigo: { ...typography.tiny },
  detailedBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  detailedPrecio: { ...typography.small },
  detailedSubtotal: { ...typography.bodyBold },
  detailedStepperWrap: {
    marginTop: spacing.xs,
    alignItems: 'flex-start',
  },
});