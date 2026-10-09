import React, { useCallback, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { ventasApi } from '@api/index';
import type { VentaResumen } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import { useFocusedLoad } from '@hooks/useFocusedLoad';
import { FadeInItem } from '@components/animations';
import VentaItem from '@components/domain/VentaItem';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonVenta from '@components/ui/SkeletonVenta';
import ErrorState from '@components/feedback/ErrorState';
import Chip from '@components/ui/Chip';

type FiltroEstado = 'todas' | 'completada' | 'anulada';
type FiltroPago = 'todos' | 'contado' | 'credito';

export default function VentasListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [filtroPago, setFiltroPago] = useState<FiltroPago>('todos');
  const [busqueda, setBusqueda] = useState('');
  const isFirstLoad = useRef(true);

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
      const msg = e instanceof Error ? e.message : 'Error al cargar';
      // Solo mostramos error si NO hay datos previos
      if (ventas.length === 0) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroPago, debouncedBusqueda]);

  // ⚡ Solo bloquea la primera vez; después refresca en background
  useFocusedLoad(cargar, () => setLoading(true));

  const hayFiltro =
    filtroEstado !== 'todas' || filtroPago !== 'todos' || busqueda.length > 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Ventas
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
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
            style={[styles.searchInput, { color: colors.textPrimary }]}
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
        <View
          style={[styles.chipsDivider, { backgroundColor: colors.border }]}
        />
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

      {loading && ventas.length === 0 ? (
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonVenta key={i} />
          ))}
        </View>
      ) : error && ventas.length === 0 ? (
        <ErrorState
          title="No pudimos cargar las ventas"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : ventas.length === 0 ? (
        <RichEmptyState
          icon={hayFiltro ? 'magnify-close' : 'receipt'}
          title={hayFiltro ? 'Sin resultados' : 'Aún no hay ventas'}
          description={
            hayFiltro
              ? 'Prueba con otro término o quita los filtros.'
              : 'Cuando registres la primera venta, aparecerá aquí.'
          }
          secondaryLabel={hayFiltro ? 'Limpiar filtros' : undefined}
          onSecondary={
            hayFiltro
              ? () => {
                  setBusqueda('');
                  setFiltroEstado('todas');
                  setFiltroPago('todos');
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          data={ventas}
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
              <VentaItem
                venta={item}
                onPress={() =>
                  navigation.navigate(
                    'VentaDetalle' as never,
                    { ventaId: item.id } as never,
                  )
                }
              />
            </FadeInItem>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: { ...typography.h1 },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
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
    marginHorizontal: spacing.xs,
  },
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  listContent: { paddingBottom: spacing.xxl },
});