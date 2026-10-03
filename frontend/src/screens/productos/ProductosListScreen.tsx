import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useProductosStore } from '@store/productosStore';
import { useDebounce } from '@hooks/useDebounce';
import ProductoItem from '@components/domain/ProductoItem';
import FAB from '@components/ui/FAB';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import Chip from '@components/ui/Chip';

export default function ProductosListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const {
    productos,
    categorias,
    loading,
    error,
    cargar,
    cargarCategorias,
  } = useProductosStore();

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const esAdmin = user?.rol === 'admin';
  const debouncedBusqueda = useDebounce(busqueda, 400);

  const cargarDatos = useCallback(async (): Promise<void> => {
    await Promise.all([
      cargar({
        busqueda: debouncedBusqueda,
        categoria_id: categoriaFiltro ?? undefined,
      }),
      cargarCategorias(),
    ]);
  }, [debouncedBusqueda, categoriaFiltro, cargar, cargarCategorias]);

  useFocusEffect(
    useCallback(() => {
      void cargarDatos();
    }, [cargarDatos]),
  );

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const irANuevo = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProductoForm' as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Productos</Text>
          <Text style={styles.subtitle}>
            {productos.length}{' '}
            {productos.length === 1 ? 'producto' : 'productos'}
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
            placeholder="Buscar por nombre o código"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busqueda.length > 0 ? (
            <Pressable onPress={() => setBusqueda('')} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
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
          active={categoriaFiltro === null}
          onPress={() => setCategoriaFiltro(null)}
        />
        {categorias.map((c) => (
          <Chip
            key={c.id}
            label={c.nombre}
            active={categoriaFiltro === c.id}
            onPress={() => setCategoriaFiltro(c.id)}
          />
        ))}
      </ScrollView>

      {loading && productos.length === 0 ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={40} height={40} borderRadius={8} />
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
          onAction={cargarDatos}
        />
      ) : productos.length === 0 ? (
        <EmptyState
          icon="package-variant"
          title="Sin productos"
          description={
            busqueda || categoriaFiltro
              ? 'No hay productos que coincidan con tu búsqueda.'
              : 'Aún no has agregado ningún producto.'
          }
          actionLabel={esAdmin ? 'Agregar producto' : undefined}
          onAction={esAdmin ? irANuevo : undefined}
        />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item }) => (
            <ProductoItem
              producto={item}
              onPress={() =>
                navigation.navigate(
                  'ProductoDetalle' as never,
                  { productId: item.id } as never,
                )
              }
            />
          )}
        />
      )}

      {esAdmin && productos.length > 0 ? (
        <FAB
          icon="plus"
          onPress={irANuevo}
          accessibilityLabel="Agregar producto"
          style={styles.fab}
        />
      ) : null}
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
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flex: 1,
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