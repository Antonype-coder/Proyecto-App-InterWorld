import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { formatRelativeDay } from '@utils/format';
import type { Notificacion } from '@tipos/index';

interface NotificacionItemProps {
  notificacion: Notificacion;
  onPress?: () => void;
}

export default function NotificacionItem({
  notificacion,
  onPress,
}: NotificacionItemProps): React.ReactElement {
  const colors = useColors();
  const noLeida = !notificacion.leida;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: noLeida
            ? colors.accentSubtle
            : colors.surface,
          borderBottomColor: colors.border,
        },
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: noLeida
              ? colors.accent
              : colors.bgSubtle,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={getIcon(notificacion.tipo)}
          size={18}
          color={noLeida ? colors.textInverse : colors.textSecondary}
        />
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.titulo, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {notificacion.titulo}
        </Text>
        {notificacion.mensaje ? (
          <Text
            style={[styles.mensaje, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notificacion.mensaje}
          </Text>
        ) : null}
        <Text style={[styles.fecha, { color: colors.textMuted }]}>
          {formatRelativeDay(notificacion.created_at)}
        </Text>
      </View>

      {noLeida ? (
        <View
          style={[styles.dot, { backgroundColor: colors.accent }]}
        />
      ) : null}
    </Pressable>
  );
}

function getIcon(
  tipo: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (tipo) {
    case 'stock_bajo':
      return 'alert-outline';
    case 'venta':
      return 'receipt';
    case 'pago':
      return 'cash';
    case 'sistema':
      return 'cog-outline';
    default:
      return 'bell-outline';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
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
  titulo: { ...typography.bodyBold },
  mensaje: { ...typography.small, marginTop: 2 },
  fecha: { ...typography.tiny, marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});