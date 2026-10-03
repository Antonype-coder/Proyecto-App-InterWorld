import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import TopBar from '@components/layout/TopBar';
import { categoriasApi } from '@api/index';
import type { Categoria } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import FAB from '@components/ui/FAB';
import { getHiddenCatalogIds, hideCatalogId } from '@utils/hiddenCatalogItems';

export default function CategoriasListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
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
      setCategorias(data.filter((categoria) => !hiddenIds.has(categoria.id)));
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
    .filter((categoria) => {
      const coincideBusqueda = `${categoria.nombre} ${categoria.descripcion ?? ''}`
        .toLowerCase()
        .includes(debouncedBusqueda.toLowerCase());
      const coincideEstado = mostrarInactivas || categoria.activo === 1;
      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) => {
      const compare = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      return ordenAsc ? compare : -compare;
    });

  const eliminarCategoria = (categoria: Categoria): void => {
    Alert.alert(
      'Borrar categoría definitivamente',
      `Se eliminará "${categoria.nombre}" y no se podrá recuperar. ¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar definitivamente',
          style: 'destructive',
          onPress: async () => {
            setEliminandoId(categoria.id);
            try {
              await categoriasApi.eliminar(categoria.id);
              await hideCatalogId('categories', categoria.id);
              setCategorias((actuales) =>
                actuales.filter((item) => item.id !== categoria.id),
              );
              Alert.alert(
                'Categoría quitada',
                'La categoría se quitó de esta lista correctamente.',
              );
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'No se pudo borrar la categoría';
              Alert.alert('Error', msg);
            } finally {
              setEliminandoId(null);
            }
          },
        },
      ],
    );
  };

  const cambiarEstadoCategoria = async (categoria: Categoria): Promise<void> => {
    const activo = categoria.activo === 1 ? 0 : 1;
    setActualizandoId(categoria.id);
    try {
      await categoriasApi.actualizar(categoria.id, { activo });
      setCategorias((actuales) =>
        actuales.map((item) => (item.id === categoria.id ? { ...item, activo } : item)),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo cambiar el estado';
      Alert.alert('Error', msg);
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar
        title="Categorías"
        subtitle={`${categoriasFiltradas.length} ${categoriasFiltradas.length === 1 ? 'categoría' : 'categorías'}`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
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
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.configRow}>
        <Pressable
          onPress={() => setMostrarInactivas((prev) => !prev)}
          style={styles.toggleChip}
        >
          <Switch
            value={mostrarInactivas}
            onValueChange={setMostrarInactivas}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
          <Text style={styles.toggleText}>Mostrar inactivas</Text>
        </Pressable>
        <Pressable
          onPress={() => setOrdenAsc((prev) => !prev)}
          style={styles.orderChip}
        >
          <MaterialCommunityIcons
            name={ordenAsc ? 'sort-ascending' : 'sort-descending'}
            size={16}
            color={colors.textPrimary}
          />
          <Text style={styles.toggleText}>{ordenAsc ? 'A-Z' : 'Z-A'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={40} height={40} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="35%" height={12} style={{ marginTop: 6 }} />
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
      ) : categoriasFiltradas.length === 0 ? (
        <EmptyState
          icon="shape-outline"
          title="Sin categorías"
          description={
            busqueda
              ? 'No hay categorías que coincidan con tu búsqueda.'
              : 'Aún no has agregado categorías.'
          }
          actionLabel="Agregar categoría"
          onAction={() => navigation.navigate('CategoriaForm' as never)}
        />
      ) : (
        <FlatList
          data={categoriasFiltradas}
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
            <View style={[styles.row, item.activo !== 1 ? styles.inactiveRow : null]}>
              <Pressable
                disabled={actualizandoId === item.id || eliminandoId === item.id}
                onPress={() =>
                  navigation.navigate(
                    'CategoriaForm' as never,
                    { categoriaId: item.id } as never,
                  )
                }
                style={styles.rowBodyPressable}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="shape-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.nombre}</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={2}>
                    {item.activo === 1 ? 'Activa' : 'Inactiva · No se negocia actualmente'}
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
                disabled={actualizandoId === item.id || eliminandoId === item.id}
                style={styles.statusBtn}
                accessibilityRole="button"
                accessibilityLabel={item.activo === 1 ? 'Marcar categoría inactiva' : 'Reactivar categoría'}
              >
                <MaterialCommunityIcons
                  name={item.activo === 1 ? 'archive-outline' : 'restore'}
                  size={18}
                  color={item.activo === 1 ? colors.textSecondary : colors.success}
                />
              </Pressable>
              <Pressable
                onPress={() => eliminarCategoria(item)}
                disabled={actualizandoId === item.id || eliminandoId === item.id}
                style={styles.deleteBtn}
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
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  orderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  toggleText: { ...typography.small, color: colors.textPrimary },
  list: { flex: 1, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  listContent: { paddingBottom: 100 },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodyBold, color: colors.textPrimary },
  rowSubtitle: { ...typography.small, color: colors.textMuted, marginTop: 3 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.dangerSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: { bottom: spacing.lg },
});
