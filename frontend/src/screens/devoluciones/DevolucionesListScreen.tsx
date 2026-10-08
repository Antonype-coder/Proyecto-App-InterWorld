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
import { devolucionesApi } from '@api/index';
import type { DevolucionResumen } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import { FadeInItem } from '@components/animations';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonVenta from '@components/ui/SkeletonVenta';
import ErrorState from '@components/feedback/ErrorState';
import Badge from '@components/ui/Badge';

export default function DevolucionesListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [items, setItems] = useState<DevolucionResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await devolucionesApi.listar({ limit: 100 });
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
        title="Devoluciones"
        subtitle={`${items.length} ${
          items.length === 1 ? 'devolución' : 'devoluciones'
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
          title="No pudimos cargar las devoluciones"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : items.length === 0 ? (
        <RichEmptyState
          icon="keyboard-return"
          title="Sin devoluciones"
          description="Cuando un cliente devuelva un producto, aparecerá aquí."
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
                  navigation.navigate('DevolucionDetalle', {
                    devolucionId: item.id,
                  })
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
                    { backgroundColor: colors.warningSubtle },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="keyboard-return"
                    size={18}
                    color={colors.warning}
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
                    style={[styles.sub, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    Venta {item.venta_numero} ·{' '}
                    {item.cliente_nombre ?? 'Consumidor final'}
                  </Text>
                  <Text style={[styles.fecha, { color: colors.textMuted }]}>
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text
                    style={[styles.monto, { color: colors.textPrimary }]}
                  >
                    {formatCurrency(item.monto_devuelto)}
                  </Text>
                  <Badge
                    label={item.tipo === 'total' ? 'Total' : 'Parcial'}
                    variant={item.tipo === 'total' ? 'warning' : 'info'}
                    size="sm"
                  />
                </View>
              </Pressable>
            </FadeInItem>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { flex: 1, borderTopWidth: 1 },
  listContent: { paddingBottom: spacing.xxl },
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
});