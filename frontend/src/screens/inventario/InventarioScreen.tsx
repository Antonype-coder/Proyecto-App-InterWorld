import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { inventarioApi } from '@api/index';
import type { MovimientoInventario, TipoMovimiento } from '@tipos/index';
import { FadeInItem } from '@components/animations';
import MovimientoItem from '@components/domain/MovimientoItem';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonProducto from '@components/ui/SkeletonProducto';
import ErrorState from '@components/feedback/ErrorState';
import Chip from '@components/ui/Chip';
import FAB from '@components/ui/FAB';
import TopBar from '@components/layout/TopBar';

type Filtro = 'todos' | TipoMovimiento;

export default function InventarioScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const movs = await inventarioApi.listarMovimientos({
        tipo: filtro === 'todos' ? undefined : filtro,
        limit: 100,
      });
      setMovimientos(movs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtro]);

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
      <TopBar title="Inventario" onBack={() => navigation.goBack()} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <Chip
          label="Todos"
          active={filtro === 'todos'}
          onPress={() => setFiltro('todos')}
        />
        <Chip
          label="Entradas"
          active={filtro === 'entrada'}
          onPress={() => setFiltro('entrada')}
        />
        <Chip
          label="Salidas"
          active={filtro === 'salida'}
          onPress={() => setFiltro('salida')}
        />
        <Chip
          label="Ajustes"
          active={filtro === 'ajuste'}
          onPress={() => setFiltro('ajuste')}
        />
      </ScrollView>

      {loading && movimientos.length === 0 ? (
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonProducto key={i} />
          ))}
        </View>
      ) : error && movimientos.length === 0 ? (
        <ErrorState
          title="No pudimos cargar el inventario"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : movimientos.length === 0 ? (
        <RichEmptyState
          icon="swap-horizontal"
          title={filtro === 'todos' ? 'Sin movimientos aún' : 'Sin resultados'}
          description={
            filtro === 'todos'
              ? 'Los movimientos de stock aparecerán aquí cuando registres entradas, salidas o ajustes.'
              : 'No hay movimientos con este filtro.'
          }
          actionLabel={filtro === 'todos' ? 'Registrar movimiento' : undefined}
          onAction={
            filtro === 'todos'
              ? () => navigation.navigate('MovimientoForm' as never)
              : undefined
          }
          secondaryLabel={filtro !== 'todos' ? 'Ver todos' : undefined}
          onSecondary={
            filtro !== 'todos' ? () => setFiltro('todos') : undefined
          }
        />
      ) : (
        <FlatList
          data={movimientos}
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
              <MovimientoItem movimiento={item} />
            </FadeInItem>
          )}
        />
      )}

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('MovimientoForm' as never)}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  chipsScroll: { flexGrow: 0, maxHeight: 60, marginBottom: spacing.sm },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  list: { flex: 1, borderTopWidth: 1 },
  listContent: { paddingBottom: 100 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});