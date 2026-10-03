import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { ordenesCompraApi } from '@api/index';
import type { OrdenCompraResumen, EstadoOC } from '@tipos/index';
import { formatCurrency, formatDate } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import Badge from '@components/ui/Badge';
import FAB from '@components/ui/FAB';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';

const ESTADO_VARIANT: Record<EstadoOC, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  borrador: 'neutral',
  enviada: 'info',
  recibida_parcial: 'warning',
  recibida: 'success',
  cancelada: 'danger',
};

const ESTADO_LABEL: Record<EstadoOC, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  recibida_parcial: 'Parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
};

export default function OrdenesCompraListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<OrdenCompraResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const res = await ordenesCompraApi.listar({ limit: 100 });
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
      <TopBar title="Órdenes de compra" onBack={() => navigation.goBack()} />

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
          icon="clipboard-text-outline"
          title="Sin órdenes"
          description="Crea tu primera orden de compra a un proveedor."
          actionLabel="Crear orden"
          onAction={() => navigation.navigate('OrdenCompraForm')}
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
              onPress={() => navigation.navigate('OrdenCompraDetalle', { ocId: item.id })}
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.icon}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.titulo} numberOfLines={1}>{item.numero}</Text>
                <Text style={styles.sub} numberOfLines={1}>{item.proveedor_nombre}</Text>
                <Text style={styles.fecha}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.monto}>{formatCurrency(item.total)}</Text>
                <Badge label={ESTADO_LABEL[item.estado]} variant={ESTADO_VARIANT[item.estado]} size="sm" />
              </View>
            </Pressable>
          )}
        />
      )}

      <FAB icon="plus" onPress={() => navigation.navigate('OrdenCompraForm')} style={styles.fab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  listContent: { paddingBottom: 100 },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  rowPressed: { backgroundColor: colors.surfacePressed },
  icon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentSubtle, alignItems: 'center', justifyContent: 'center' },
  titulo: { ...typography.bodyBold, color: colors.textPrimary },
  sub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  fecha: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  monto: { ...typography.bodyBold, color: colors.textPrimary },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});