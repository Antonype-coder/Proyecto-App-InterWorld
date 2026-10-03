import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { useNotificacionesStore } from '@store/notificacionesStore';
import { formatDateTime } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import EmptyState from '@components/ui/EmptyState';
import Button from '@components/ui/Button';
import Loader from '@components/ui/Loader';

export default function NotificacionesScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const {
    items,
    noLeidas,
    loading,
    cargar,
    marcarLeida,
    marcarTodas,
  } = useNotificacionesStore();

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Notificaciones" onBack={() => navigation.goBack()} />

      {noLeidas > 0 ? (
        <View style={styles.actionsBar}>
          <Text style={styles.pendingText}>
            {noLeidas} sin leer
          </Text>
          <Button
            label="Marcar todas"
            onPress={() => void marcarTodas()}
            variant="ghost"
            size="sm"
          />
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <Loader message="Cargando notificaciones" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="Sin notificaciones"
          description="Cuando ocurra algo importante, aparecerá aquí."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const cfg = getNivelConfig(item.nivel);
            const noLeida = item.leida === 0;

            return (
              <Pressable
                onPress={() => {
                  if (noLeida) void marcarLeida(item.id);
                }}
                style={({ pressed }) => [
                  styles.row,
                  !noLeida ? styles.rowRead : null,
                  pressed ? styles.rowPressed : null,
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                  <MaterialCommunityIcons
                    name={cfg.icon}
                    size={18}
                    color={cfg.color}
                  />
                </View>
                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.titulo,
                        noLeida ? styles.tituloUnread : null,
                      ]}
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>
                    {noLeida ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.mensaje} numberOfLines={2}>
                    {item.mensaje}
                  </Text>
                  <Text style={styles.fecha}>
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function getNivelConfig(nivel: string): {
  bg: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
} {
  switch (nivel) {
    case 'success':
      return {
        bg: colors.successSubtle,
        color: colors.success,
        icon: 'check-circle-outline',
      };
    case 'warning':
      return {
        bg: colors.warningSubtle,
        color: colors.warning,
        icon: 'alert-outline',
      };
    case 'danger':
      return {
        bg: colors.dangerSubtle,
        color: colors.danger,
        icon: 'alert-circle-outline',
      };
    case 'info':
    default:
      return {
        bg: colors.infoSubtle,
        color: colors.info,
        icon: 'information-outline',
      };
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pendingText: { ...typography.caption, color: colors.textSecondary },
  listContent: { padding: spacing.lg },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowRead: { opacity: 0.7 },
  rowPressed: { opacity: 0.6 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titulo: { ...typography.body, color: colors.textSecondary, flex: 1 },
  tituloUnread: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  mensaje: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fecha: { ...typography.tiny, color: colors.textMuted, marginTop: 4 },
});