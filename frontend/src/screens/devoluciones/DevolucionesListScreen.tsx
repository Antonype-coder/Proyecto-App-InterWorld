import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { devolucionesApi } from '@api/index';
import type { DevolucionResumen } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import EmptyState from '@components/ui/EmptyState';
import Badge from '@components/ui/Badge';
import Skeleton from '@components/ui/Skeleton';

export default function DevolucionesListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<DevolucionResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const res = await devolucionesApi.listar({ limit: 100 });
      setItems(res);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); void cargar(); }, [cargar]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Devoluciones" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={36} height={36} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="keyboard-return"
          title="Sin devoluciones"
          description="No se han registrado devoluciones todavía."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void cargar(); }}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('DevolucionDetalle', { devolucionId: item.id })
              }
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.icon}>
                <MaterialCommunityIcons name="keyboard-return" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.titulo} numberOfLines={1}>{item.numero}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  Venta {item.venta_numero} · {item.cliente_nombre ?? 'Consumidor final'}
                </Text>
                <Text style={styles.fecha}>{formatDateTime(item.created_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.monto}>{formatCurrency(item.monto_devuelto)}</Text>
                <Badge
                  label={item.tipo === 'total' ? 'Total' : 'Parcial'}
                  variant={item.tipo === 'total' ? 'warning' : 'info'}
                  size="sm"
                />
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  listContent: { paddingBottom: spacing.xxl },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  icon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.warningSubtle, alignItems: 'center', justifyContent: 'center',
  },
  titulo: { ...typography.bodyBold, color: colors.textPrimary },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  fecha: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  monto: { ...typography.bodyBold, color: colors.textPrimary },
});