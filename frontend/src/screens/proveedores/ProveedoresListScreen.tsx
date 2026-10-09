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
import { proveedoresApi } from '@api/index';
import type { Proveedor } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import { FadeInItem } from '@components/animations';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonProducto from '@components/ui/SkeletonProducto';
import ErrorState from '@components/feedback/ErrorState';
import FAB from '@components/ui/FAB';

export default function ProveedoresListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const confirm = useConfirm();
  const showToast = useUIStore((s) => s.showToast);

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
      // Sin filtros: trae TODOS los proveedores del negocio
      const data = await proveedoresApi.listar(1);
      setProveedores(Array.isArray(data) ? data : []);
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
    .filter((p) => {
      if (debouncedBusqueda.trim() !== '') {
        const texto = `${p.nombre} ${p.contacto ?? ''} ${p.telefono ?? ''} ${p.email ?? ''}`.toLowerCase();
        if (!texto.includes(debouncedBusqueda.toLowerCase())) return false;
      }
      if (!mostrarInactivos && p.activo !== 1) return false;
      return true;
    })
    .sort((a, b) => {
      const compare = a.nombre.localeCompare(b.nombre, 'es', {
        sensitivity: 'base',
      });
      return ordenAsc ? compare : -compare;
    });

  const eliminarProveedor = async (proveedor: Proveedor): Promise<void> => {
    const ok = await confirm({
      title: 'Desactivar proveedor',
      message: `Se desactivará "${proveedor.nombre}". Podrás reactivarlo cuando quieras.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;

    setEliminandoId(proveedor.id);
    try {
      await proveedoresApi.eliminar(proveedor.id);
      await cargar();
      showToast('Proveedor desactivado.', 'success');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudo desactivar el proveedor';
      showToast(msg, 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  const cambiarEstadoProveedor = async (
    proveedor: Proveedor,
  ): Promise<void> => {
    const activo = proveedor.activo === 1 ? 0 : 1;
    setActualizandoId(proveedor.id);
    try {
      await proveedoresApi.actualizar(proveedor.id, { activo });
      await cargar();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudo cambiar el estado';
      showToast(msg, 'error');
    } finally {
      setActualizandoId(null);
    }
  };

  const hayFiltro = busqueda.length > 0 || mostrarInactivos;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Proveedores"
        subtitle={`${proveedoresFiltrados.length} de ${proveedores.length}`}
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
            placeholder="Buscar proveedor"
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

      <View style={styles.configRow}>
        <Pressable
          onPress={() => setMostrarInactivos((prev) => !prev)}
          style={[
            styles.toggleChip,
            {
              backgroundColor: mostrarInactivos
                ? colors.primary
                : colors.surface,
              borderColor: mostrarInactivos
                ? colors.primary
                : colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={mostrarInactivos ? 'eye' : 'eye-off'}
            size={16}
            color={
              mostrarInactivos ? colors.textInverse : colors.textPrimary
            }
          />
          <Text
            style={[
              styles.toggleText,
              {
                color: mostrarInactivos
                  ? colors.textInverse
                  : colors.textPrimary,
              },
            ]}
          >
            {mostrarInactivos ? 'Viendo todos' : 'Solo activos'}
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

      {hayFiltro && proveedoresFiltrados.length !== proveedores.length ? (
        <Pressable
          onPress={() => {
            setBusqueda('');
            setMostrarInactivos(true);
            setOrdenAsc(true);
          }}
          style={[
            styles.clearFilter,
            { backgroundColor: colors.warningSubtle },
          ]}
        >
          <MaterialCommunityIcons
            name="filter-remove-outline"
            size={14}
            color={colors.warning}
          />
          <Text style={[styles.clearFilterText, { color: colors.warning }]}>
            Hay {proveedores.length - proveedoresFiltrados.length} oculto(s).
            Toca para mostrar todos.
          </Text>
        </Pressable>
      ) : null}

      {loading && proveedores.length === 0 ? (
        <View>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonProducto key={i} />
          ))}
        </View>
      ) : error && proveedores.length === 0 ? (
        <ErrorState
          title="No pudimos cargar los proveedores"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : proveedoresFiltrados.length === 0 ? (
        <RichEmptyState
          icon={hayFiltro ? 'magnify-close' : 'truck-outline'}
          title={hayFiltro ? 'Sin resultados' : 'Sin proveedores aún'}
          description={
            busqueda
              ? 'Prueba con otro término.'
              : 'Registra proveedores para tus compras.'
          }
          actionLabel={!hayFiltro ? 'Agregar proveedor' : undefined}
          onAction={
            !hayFiltro
              ? () => navigation.navigate('ProveedorForm' as never)
              : undefined
          }
          secondaryLabel={hayFiltro ? 'Limpiar filtros' : undefined}
          onSecondary={
            hayFiltro
              ? () => {
                  setBusqueda('');
                  setMostrarInactivos(true);
                  setOrdenAsc(true);
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          data={proveedoresFiltrados}
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
                      'ProveedorDetalle' as never,
                      { proveedorId: item.id } as never,
                    )
                  }
                  style={styles.rowBodyPressable}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: colors.accentSubtle },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="truck-outline"
                      size={20}
                      color={colors.accent}
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
                      {item.activo === 1 ? 'Activo' : 'Inactivo'}
                      {item.contacto ? ` · ${item.contacto}` : ''}
                      {item.telefono ? ` · ${item.telefono}` : ''}
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
                  disabled={
                    actualizandoId === item.id || eliminandoId === item.id
                  }
                  style={[
                    styles.statusBtn,
                    { backgroundColor: colors.bgSubtle },
                  ]}
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
                  onPress={() => void eliminarProveedor(item)}
                  disabled={
                    actualizandoId === item.id || eliminandoId === item.id
                  }
                  style={[
                    styles.deleteBtn,
                    { backgroundColor: colors.dangerSubtle },
                  ]}
                  hitSlop={8}
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
        onPress={() => navigation.navigate('ProveedorForm' as never)}
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
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  orderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  toggleText: { ...typography.small },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  clearFilterText: { ...typography.small, flex: 1 },
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