import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import TopBar from '@components/layout/TopBar';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { usuariosApi } from '@api/index';
import type { Usuario } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import UsuarioItem from '@components/domain/UsuarioItem';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import FAB from '@components/ui/FAB';
import ConfirmDialog from '@components/feedback/ConfirmDialog';

export default function UsuariosScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const currentUser = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedBusqueda = useDebounce(busqueda, 400);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const data = await usuariosApi.listar();
      setUsuarios(data);
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

  const filtrados = useMemo(() => {
    if (!debouncedBusqueda) return usuarios;
    const q = debouncedBusqueda.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [usuarios, debouncedBusqueda]);

  const confirmarDesactivar = async (): Promise<void> => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await usuariosApi.actualizar(pendingDelete.id, { activo: 0 });
      setUsuarios((actuales) =>
        actuales.map((u) =>
          u.id === pendingDelete.id ? { ...u, activo: 0 } : u,
        ),
      );
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast('Usuario desactivado.', 'success');
      setPendingDelete(null);
    } catch (e) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
      const msg = e instanceof Error ? e.message : 'No se pudo desactivar';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Usuarios"
        subtitle={`${filtrados.length} ${
          filtrados.length === 1 ? 'usuario' : 'usuarios'
        }`}
        onBack={() => navigation.goBack()}
      />

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
            placeholder="Buscar por nombre o correo"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.skelItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="60%" height={14} />
                <Skeleton
                  width="45%"
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
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon="account-multiple-outline"
          title="Sin usuarios"
          description={
            busqueda
              ? 'No hay usuarios que coincidan con tu búsqueda.'
              : 'Aún no has agregado usuarios.'
          }
          actionLabel="Agregar usuario"
          onAction={() => navigation.navigate('UsuarioForm' as never)}
        />
      ) : (
        <FlatList
          data={filtrados}
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
          renderItem={({ item }) => (
            <UsuarioItem
              usuario={item}
              onPress={() =>
                navigation.navigate(
                  'UsuarioForm' as never,
                  { usuarioId: item.id } as never,
                )
              }
              onDelete={() => setPendingDelete(item)}
              canDelete={
                item.id !== currentUser?.id && item.activo === 1
              }
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('UsuarioForm' as never)}
        style={styles.fab}
      />

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Desactivar usuario"
        message={
          pendingDelete
            ? `El usuario "${pendingDelete.nombre}" no podrá iniciar sesión. Puedes reactivarlo cuando quieras.`
            : ''
        }
        confirmLabel="Desactivar"
        variant="warning"
        loading={deleting}
        onConfirm={confirmarDesactivar}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  listContent: { paddingBottom: 100 },
  listWrapper: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  skelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});