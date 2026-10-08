import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { ordenesCompraApi } from '@api/index';
import type { OrdenCompraResumen, EstadoOC } from '@tipos/index';
import { formatCurrency, formatDate } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import { FadeInItem } from '@components/animations';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonVenta from '@components/ui/SkeletonVenta';
import ErrorState from '@components/feedback/ErrorState';
import Badge from '@components/ui/Badge';
import FAB from '@components/ui/FAB';

const ESTADO_VARIANT: Record<
  EstadoOC,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
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
  const colors = useColors();
  const [items, setItems] = useState<OrdenCompraResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await ordenesCompraApi.listar({ limit: 100 });
      setItems(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Órdenes de compra"
        subtitle={`${items.length} ${
          items.length === 1 ? 'orden' : 'órdenes'
        }`}
        onBack={() => navigation.goBack()}
      />

      {loading && items.length === 0 ? (
        <View>
          {[1, 2, 3].map((i) => (
            <SkeletonVenta key={i} />
          ))}
        </View>
      ) : error && items.length === 0 ? (
        <ErrorState
          title="No pudimos cargar las órdenes"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : items.length === 0 ? (
        <RichEmptyState
          icon="clipboard-text-outline"
          title="Sin órdenes aún"
          description="Crea tu primera orden de compra a un proveedor."
          actionLabel="Crear orden"
          onAction={() => navigation.navigate('OrdenCompraForm')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          style={[
            styles.list,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void cargar();
              }}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item, index }) => (
            <FadeInItem delay={Math.min(index * 20, 240)}>
              <Pressable
                onPress={() =>
                  navigation.navigate('OrdenCompraDetalle', { ocId: item.id })
                }
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.border },
                  pressed ? { backgroundColor: colors.surfacePressed } : null,
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: colors.accentSubtle },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.titulo, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.numero}
                  </Text>
                  <Text
                    style={[styles.sub, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.proveedor_nombre}
                  </Text>
                  <Text style={[styles.fecha, { color: colors.textMuted }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text
                    style={[styles.monto, { color: colors.textPrimary }]}
                  >
                    {formatCurrency(item.total)}
                  </Text>
                  <Badge
                    label={ESTADO_LABEL[item.estado]}
                    variant={ESTADO_VARIANT[item.estado]}
                    size="sm"
                  />
                </View>
              </Pressable>
            </FadeInItem>
          )}
        />
      )}

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('OrdenCompraForm')}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { flex: 1, borderTopWidth: 1 },
  listContent: { paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...typography.bodyBold },
  sub: { ...typography.small, marginTop: 2 },
  fecha: { ...typography.tiny, marginTop: 2 },
  monto: { ...typography.bodyBold },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});