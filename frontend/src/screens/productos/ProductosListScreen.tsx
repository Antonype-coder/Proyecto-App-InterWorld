import React, { useCallback, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useColors } from '@hooks/useColors';
import { useProductosStore } from '@store/productosStore';
import { useDebounce } from '@hooks/useDebounce';
import { useFocusedLoad } from '@hooks/useFocusedLoad';
import { FadeInItem } from '@components/animations';
import ProductoItem from '@components/domain/ProductoItem';
import FAB from '@components/ui/FAB';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonProducto from '@components/ui/SkeletonProducto';
import ErrorState from '@components/feedback/ErrorState';
import Chip from '@components/ui/Chip';

export default function ProductosListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const colors = useColors();
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
  const isFirstLoad = useRef(true);

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

  // ⚡ Solo carga la primera vez (bloquea con skeleton)
  // Después refresca en background sin bloquear la UI
  useFocusedLoad(cargarDatos);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const irANuevo = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProductoForm' as never);
  };

  const hayFiltro = busqueda.length > 0 || categoriaFiltro !== null;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Productos
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {productos.length}{' '}
            {productos.length === 1 ? 'producto' : 'productos'}
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
            placeholder="Buscar por nombre o código"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={[styles.searchInput, { color: colors.textPrimary }]}
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
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonProducto key={i} />
          ))}
        </View>
      ) : error && productos.length === 0 ? (
        <ErrorState
          title="No pudimos cargar los productos"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargarDatos}
        />
      ) : productos.length === 0 ? (
        <RichEmptyState
          icon={hayFiltro ? 'magnify-close' : 'package-variant'}
          title={hayFiltro ? 'Sin resultados' : 'Sin productos aún'}
          description={
            hayFiltro
              ? 'Prueba con otro término o quita los filtros.'
              : esAdmin
                ? 'Agrega tu primer producto para empezar a vender.'
                : 'Aún no hay productos en el catálogo.'
          }
          actionLabel={esAdmin && !hayFiltro ? 'Agregar producto' : undefined}
          onAction={esAdmin && !hayFiltro ? irANuevo : undefined}
          secondaryLabel={hayFiltro ? 'Limpiar filtros' : undefined}
          onSecondary={
            hayFiltro
              ? () => {
                  setBusqueda('');
                  setCategoriaFiltro(null);
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          style={[
            styles.list,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item, index }) => (
            <FadeInItem delay={Math.min(index * 20, 240)}>
              <ProductoItem
                producto={item}
                onPress={() =>
                  navigation.navigate(
                    'ProductoDetalle' as never,
                    { productId: item.id } as never,
                  )
                }
              />
            </FadeInItem>
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
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flex: 1,
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
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  listContent: { paddingBottom: 100 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});