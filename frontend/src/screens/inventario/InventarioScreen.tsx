import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { inventarioApi } from '@api/index';
import type { MovimientoInventario, TipoMovimiento } from '@tipos/index';
import MovimientoItem from '@components/domain/MovimientoItem';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import Chip from '@components/ui/Chip';
import FAB from '@components/ui/FAB';
import TopBar from '@components/layout/TopBar';

type Filtro = 'todos' | TipoMovimiento;

export default function InventarioScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
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
    <SafeAreaView style={styles.safe} edges={['top']}>
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

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={36} height={36} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="70%" height={14} />
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
      ) : movimientos.length === 0 ? (
        <EmptyState
          icon="swap-horizontal"
          title="Sin movimientos"
          description="Aún no hay movimientos de inventario."
          actionLabel="Registrar movimiento"
          onAction={() => navigation.navigate('MovimientoForm' as never)}
        />
      ) : (
        <FlatList
          data={movimientos}
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
          renderItem={({ item }) => <MovimientoItem movimiento={item} />}
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
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  chipsScroll: { flexGrow: 0, maxHeight: 60, marginBottom: spacing.sm },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  list: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listContent: { paddingBottom: 100 },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});