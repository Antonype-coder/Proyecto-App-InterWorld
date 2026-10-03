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
import { proveedoresApi } from '@api/index';
import type { Proveedor } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import FAB from '@components/ui/FAB';
import { getHiddenCatalogIds, hideCatalogId } from '@utils/hiddenCatalogItems';

export default function ProveedoresListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const debouncedBusqueda = useDebounce(busqueda, 300);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const [data, hiddenIds] = await Promise.all([
        proveedoresApi.listar(),
        getHiddenCatalogIds('suppliers'),
      ]);
      setProveedores(data.filter((proveedor) => !hiddenIds.has(proveedor.id)));
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

  const proveedoresFiltrados = proveedores
    .filter((proveedor) => {
      const texto = `${proveedor.nombre} ${proveedor.contacto ?? ''} ${proveedor.telefono ?? ''} ${proveedor.email ?? ''}`.toLowerCase();
      const coincideBusqueda = texto.includes(debouncedBusqueda.toLowerCase());
      const coincideEstado = mostrarInactivos || proveedor.activo === 1;
      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) => {
      const compare = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      return ordenAsc ? compare : -compare;
    });

  const eliminarProveedor = (proveedor: Proveedor): void => {
    Alert.alert(
      'Borrar proveedor definitivamente',
      `Se eliminará "${proveedor.nombre}" y no se podrá recuperar. ¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar definitivamente',
          style: 'destructive',
          onPress: async () => {
            setEliminandoId(proveedor.id);
            try {
              await proveedoresApi.eliminar(proveedor.id);
              await hideCatalogId('suppliers', proveedor.id);
              setProveedores((actuales) =>
                actuales.filter((item) => item.id !== proveedor.id),
              );
              Alert.alert(
                'Proveedor quitado',
                'El proveedor se quitó de esta lista correctamente.',
              );
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'No se pudo borrar el proveedor';
              Alert.alert('Error', msg);
            } finally {
              setEliminandoId(null);
            }
          },
        },
      ],
    );
  };

  const cambiarEstadoProveedor = async (proveedor: Proveedor): Promise<void> => {
    const activo = proveedor.activo === 1 ? 0 : 1;
    setActualizandoId(proveedor.id);
    try {
      await proveedoresApi.actualizar(proveedor.id, { activo });
      setProveedores((actuales) =>
        actuales.map((item) => (item.id === proveedor.id ? { ...item, activo } : item)),
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
        title="Proveedores"
        subtitle={`${proveedoresFiltrados.length} ${proveedoresFiltrados.length === 1 ? 'proveedor' : 'proveedores'}`}
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
            placeholder="Buscar proveedor"
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
          onPress={() => setMostrarInactivos((prev) => !prev)}
          style={styles.toggleChip}
        >
          <Switch
            value={mostrarInactivos}
            onValueChange={setMostrarInactivos}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
          <Text style={styles.toggleText}>Mostrar inactivos</Text>
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
      ) : proveedoresFiltrados.length === 0 ? (
        <EmptyState
          icon="truck-outline"
          title="Sin proveedores"
          description={
            busqueda
              ? 'No hay proveedores que coincidan con tu búsqueda.'
              : 'Aún no has agregado proveedores.'
          }
          actionLabel="Agregar proveedor"
          onAction={() => navigation.navigate('ProveedorForm' as never)}
        />
      ) : (
        <FlatList
          data={proveedoresFiltrados}
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
                    'ProveedorDetalle' as never,
                    { proveedorId: item.id } as never,
                  )
                }
                style={styles.rowBodyPressable}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="truck-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.nombre}</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={2}>
                    {item.activo === 1 ? 'Activo' : 'Inactivo · Sin trato comercial actual'}
                    {item.contacto || item.telefono || item.email
                      ? ` · ${item.contacto || item.telefono || item.email}`
                      : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              <Pressable
                onPress={() => void cambiarEstadoProveedor(item)}
                disabled={actualizandoId === item.id || eliminandoId === item.id}
                style={styles.statusBtn}
                accessibilityRole="button"
                accessibilityLabel={item.activo === 1 ? 'Marcar proveedor inactivo' : 'Reactivar proveedor'}
              >
                <MaterialCommunityIcons
                  name={item.activo === 1 ? 'archive-outline' : 'restore'}
                  size={18}
                  color={item.activo === 1 ? colors.textSecondary : colors.success}
                />
              </Pressable>
              <Pressable
                onPress={() => eliminarProveedor(item)}
                disabled={actualizandoId === item.id || eliminandoId === item.id}
                style={styles.deleteBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Borrar proveedor definitivamente"
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
        onPress={() => navigation.navigate('ProveedorForm' as never)}
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
