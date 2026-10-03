import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { ventasApi } from '@api/index';
import type { VentaResumen } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import VentaItem from '@components/domain/VentaItem';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import Chip from '@components/ui/Chip';

type FiltroEstado = 'todas' | 'completada' | 'anulada';
type FiltroPago = 'todos' | 'contado' | 'credito';

export default function VentasListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [filtroPago, setFiltroPago] = useState<FiltroPago>('todos');
  const [busqueda, setBusqueda] = useState('');

  const debouncedBusqueda = useDebounce(busqueda, 400);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await ventasApi.listar({
        estado: filtroEstado === 'todas' ? undefined : filtroEstado,
        tipo_pago: filtroPago === 'todos' ? undefined : filtroPago,
        busqueda: debouncedBusqueda,
        limit: 100,
      });
      setVentas(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroEstado, filtroPago, debouncedBusqueda]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ventas</Text>
          <Text style={styles.subtitle}>
            {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar por folio o cliente"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <Chip
          label="Todas"
          active={filtroEstado === 'todas'}
          onPress={() => setFiltroEstado('todas')}
        />
        <Chip
          label="Completadas"
          active={filtroEstado === 'completada'}
          onPress={() => setFiltroEstado('completada')}
        />
        <Chip
          label="Anuladas"
          active={filtroEstado === 'anulada'}
          onPress={() => setFiltroEstado('anulada')}
        />
        <View style={styles.chipsDivider} />
        <Chip
          label="Contado"
          active={filtroPago === 'contado'}
          onPress={() => setFiltroPago('contado')}
        />
        <Chip
          label="Crédito"
          active={filtroPago === 'credito'}
          onPress={() => setFiltroPago('credito')}
        />
      </ScrollView>

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={36} height={36} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="60%" height={14} />
                <Skeleton
                  width="40%"
                  height={12}
                  style={{ marginTop: 6 }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          description={error}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      ) : ventas.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="Sin ventas"
          description="No hay ventas con este filtro."
        />
      ) : (
        <FlatList
          data={ventas}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
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
          renderItem={({ item }) => (
            <VentaItem
              venta={item}
              onPress={() =>
                navigation.navigate(
                  'VentaDetalle' as never,
                  { ventaId: item.id } as never,
                )
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  chipsScroll: { flexGrow: 0, maxHeight: 44, marginBottom: spacing.md },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chipsDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  list: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listContent: { paddingBottom: spacing.xxl },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});