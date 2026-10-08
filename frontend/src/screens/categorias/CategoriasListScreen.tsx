import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useConfirm } from '@components/feedback/ConfirmProvider';
import { useUIStore } from '@store/uiStore';
import TopBar from '@components/layout/TopBar';
import { categoriasApi } from '@api/index';
import type { Categoria } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import { FadeInItem } from '@components/animations';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonProducto from '@components/ui/SkeletonProducto';
import ErrorState from '@components/feedback/ErrorState';
import FAB from '@components/ui/FAB';
import { getHiddenCatalogIds, hideCatalogId } from '@utils/hiddenCatalogItems';

export default function CategoriasListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const confirm = useConfirm();
  const showToast = useUIStore((s) => s.showToast);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const debouncedBusqueda = useDebounce(busqueda, 300);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const [data, hiddenIds] = await Promise.all([
        categoriasApi.listar(),
        getHiddenCatalogIds('categories'),
      ]);
      setCategorias(data.filter((c) => !hiddenIds.has(c.id)));
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

  const categoriasFiltradas = categorias
    .filter((c) => {
      const coincideBusqueda = `${c.nombre} ${c.descripcion ?? ''}`
        .toLowerCase()
        .includes(debouncedBusqueda.toLowerCase());
      const coincideEstado = mostrarInactivas || c.activo === 1;
      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) => {
      const compare = a.nombre.localeCompare(b.nombre, 'es', {
        sensitivity: 'base',
      });
      return ordenAsc ? compare : -compare;
    });

  const eliminarCategoria = async (categoria: Categoria): Promise<void> => {
    const ok = await confirm({
      title: 'Borrar categoría definitivamente',
      message: `Se eliminará "${categoria.nombre}" y no se podrá recuperar.`,
      confirmLabel: 'Borrar',
      variant: 'danger',
    });
    if (!ok) return;

    setEliminandoId(categoria.id);
    try {
      await categoriasApi.eliminar(categoria.id);
      await hideCatalogId('categories', categoria.id);
      setCategorias((actuales) =>
        actuales.filter((item) => item.id !== categoria.id),
      );
      showToast('Categoría eliminada.', 'success');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudo borrar la categoría';
      showToast(msg, 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  const cambiarEstadoCategoria = async (
    categoria: Categoria,
  ): Promise<void> => {
    const activo = categoria.activo === 1 ? 0 : 1;
    setActualizandoId(categoria.id);
    try {
      await categoriasApi.actualizar(categoria.id, { activo });
      setCategorias((actuales) =>
        actuales.map((item) =>
          item.id === categoria.id ? { ...item, activo } : item,
        ),
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudo cambiar el estado';
      showToast(msg, 'error');
    } finally {
      setActualizandoId(null);
    }
  };

  const hayFiltro = busqueda.length > 0 || mostrarInactivas;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Categorías"
        subtitle={`${categoriasFiltradas.length} ${
          categoriasFiltradas.length === 1 ? 'categoría' : 'categorías'
        }`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar categoría"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.configRow}>
        <Pressable
          onPress={() => setMostrarInactivas((prev) => !prev)}
          style={[
            styles.toggleChip,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Switch
            value={mostrarInactivas}
            onValueChange={setMostrarInactivas}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
          <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
            Mostrar inactivas
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setOrdenAsc((prev) => !prev)}
          style={[
            styles.orderChip,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name={ordenAsc ? 'sort-ascending' : 'sort-descending'}
            size={16}
            color={colors.textPrimary}
          />
          <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
            {ordenAsc ? 'A-Z' : 'Z-A'}
          </Text>
        </Pressable>
      </View>

      {loading && categorias.length === 0 ? (
        <View>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonProducto key={i} />
          ))}
        </View>
      ) : error && categorias.length === 0 ? (
        <ErrorState
          title="No pudimos cargar las categorías"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : categoriasFiltradas.length === 0 ? (
        <RichEmptyState
          icon={hayFiltro ? 'magnify-close' : 'shape-outline'}
          title={hayFiltro ? 'Sin resultados' : 'Sin categorías aún'}
          description={
            busqueda
              ? 'Prueba con otro término.'
              : 'Crea categorías para organizar tu catálogo.'
          }
          actionLabel={!hayFiltro ? 'Agregar categoría' : undefined}
          onAction={
            !hayFiltro
              ? () => navigation.navigate('CategoriaForm' as never)
              : undefined
          }
          secondaryLabel={hayFiltro ? 'Limpiar filtros' : undefined}
          onSecondary={
            hayFiltro
              ? () => {
                  setBusqueda('');
                  setMostrarInactivas(false);
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          data={categoriasFiltradas}
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
              <View
                style={[
                  styles.row,
                  { borderBottomColor: colors.border },
                  item.activo !== 1 ? styles.inactiveRow : null,
                ]}
              >
                <Pressable
                  disabled={
                    actualizandoId === item.id || eliminandoId === item.id
                  }
                  onPress={() =>
                    navigation.navigate(
                      'CategoriaForm' as never,
                      { categoriaId: item.id } as never,
                    )
                  }
                  style={styles.rowBodyPressable}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: colors.primarySubtle },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="shape-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.rowBody}>
                    <Text
                      style={[styles.rowTitle, { color: colors.textPrimary }]}
                    >
                      {item.nombre}
                    </Text>
                    <Text
                      style={[styles.rowSubtitle, { color: colors.textMuted }]}
                      numberOfLines={2}
                    >
                      {item.activo === 1
                        ? 'Activa'
                        : 'Inactiva · No se negocia actualmente'}
                      {item.descripcion ? ` · ${item.descripcion}` : ''}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
                <Pressable
                  onPress={() => void cambiarEstadoCategoria(item)}
                  disabled={
                    actualizandoId === item.id || eliminandoId === item.id
                  }
                  style={[
                    styles.statusBtn,
                    { backgroundColor: colors.bgSubtle },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.activo === 1
                      ? 'Marcar categoría inactiva'
                      : 'Reactivar categoría'
                  }
                >
                  <MaterialCommunityIcons
                    name={item.activo === 1 ? 'archive-outline' : 'restore'}
                    size={18}
                    color={
                      item.activo === 1
                        ? colors.textSecondary
                        : colors.success
                    }
                  />
                </Pressable>
                <Pressable
                  onPress={() => void eliminarCategoria(item)}
                  disabled={
                    actualizandoId === item.id || eliminandoId === item.id
                  }
                  style={[
                    styles.deleteBtn,
                    { backgroundColor: colors.dangerSubtle },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Borrar categoría definitivamente"
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={18}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            </FadeInItem>
          )}
        />
      )}

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('CategoriaForm' as never)}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
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
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  toggleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  orderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  toggleText: { ...typography.small },
  list: { flex: 1, borderTopWidth: 1 },
  listContent: { paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  inactiveRow: { opacity: 0.7 },
  rowBodyPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodyBold },
  rowSubtitle: { ...typography.small, marginTop: 3 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});