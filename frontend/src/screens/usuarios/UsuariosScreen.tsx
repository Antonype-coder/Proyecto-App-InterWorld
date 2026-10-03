import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
import { usuariosApi } from '@api/index';
import { useAuthStore } from '@store/authStore';
import type { Usuario, Rol } from '@tipos/index';
import UsuarioItem from '@components/domain/UsuarioItem';
import Button from '@components/ui/Button';
import Chip from '@components/ui/Chip';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import FAB from '@components/ui/FAB';
import Modal from '@components/ui/Modal';
import Input from '@components/ui/Input';
import Toast from '@components/ui/Toast';
import TopBar from '@components/layout/TopBar';
import type { ToastVariant } from '@tipos/index';

type FiltroRol = 'todos' | Rol;

export default function UsuariosScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const currentUser = useAuthStore((s) => s.user);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroRol>('todos');

  const [modalForm, setModalForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('vendedor');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

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

  const usuariosFiltrados =
    filtro === 'todos' ? usuarios : usuarios.filter((u) => u.rol === filtro);

  const abrirCrear = (): void => {
    setEditando(null);
    setNombre('');
    setEmail('');
    setPassword('');
    setRol('vendedor');
    setActivo(true);
    setModalForm(true);
  };

  const abrirEditar = (u: Usuario): void => {
    setEditando(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword('');
    setRol(u.rol);
    setActivo(u.activo === 1);
    setModalForm(true);
  };

  const guardar = async (): Promise<void> => {
    if (!nombre.trim() || !email.trim()) {
      setToast({
        visible: true,
        message: 'Nombre y correo son obligatorios',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (editando) {
        const payload: Record<string, unknown> = {
          nombre: nombre.trim(),
          email: email.trim(),
          rol,
          activo: activo ? 1 : 0,
        };
        if (password) payload.password = password;
        await usuariosApi.actualizar(editando.id, payload);
      } else {
        if (!password || password.length < 6) {
          setToast({
            visible: true,
            message: 'Contraseña mínimo 6 caracteres',
            variant: 'error',
          });
          setSaving(false);
          return;
        }
        await usuariosApi.crear({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          rol,
          activo: activo ? 1 : 0,
        });
      }

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      setModalForm(false);
      await cargar();
      setToast({
        visible: true,
        message: editando ? 'Usuario actualizado' : 'Usuario creado',
        variant: 'success',
      });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const desactivar = (u: Usuario): void => {
    if (u.id === currentUser?.id) {
      setToast({
        visible: true,
        message: 'No puedes desactivar tu propia cuenta',
        variant: 'warning',
      });
      return;
    }

    Alert.alert(
      'Desactivar usuario',
      `${u.nombre} no podrá iniciar sesión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await usuariosApi.eliminar(u.id);
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              await cargar();
              setToast({
                visible: true,
                message: 'Usuario desactivado',
                variant: 'success',
              });
            } catch (e) {
              const msg =
                e instanceof Error ? e.message : 'Error al desactivar';
              setToast({ visible: true, message: msg, variant: 'error' });
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Usuarios" onBack={() => navigation.goBack()} />

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
          label="Admins"
          active={filtro === 'admin'}
          onPress={() => setFiltro('admin')}
        />
        <Chip
          label="Vendedores"
          active={filtro === 'vendedor'}
          onPress={() => setFiltro('vendedor')}
        />
      </ScrollView>

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="60%" height={14} />
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
      ) : usuariosFiltrados.length === 0 ? (
        <EmptyState
          icon="account-cog-outline"
          title="Sin usuarios"
          description="No hay usuarios con este filtro."
          actionLabel="Agregar"
          onAction={abrirCrear}
        />
      ) : (
        <FlatList
          data={usuariosFiltrados}
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
            <UsuarioItem
              usuario={item}
              onPress={() => abrirEditar(item)}
              onDelete={() => desactivar(item)}
              canDelete={item.id !== currentUser?.id}
            />
          )}
        />
      )}

      <FAB
        icon="account-plus"
        onPress={abrirCrear}
        style={styles.fab}
      />

      <Modal
        visible={modalForm}
        onClose={() => setModalForm(false)}
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}
        scrollable
      >
        <Input
          label="Nombre completo"
          icon="account-outline"
          value={nombre}
          onChangeText={setNombre}
          required
        />
        <Input
          label="Correo"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="email-outline"
          value={email}
          onChangeText={setEmail}
          required
        />
        <Input
          label={editando ? 'Nueva contraseña' : 'Contraseña'}
          placeholder={
            editando ? 'Dejar vacío para mantener' : 'Mínimo 6 caracteres'
          }
          secureTextEntry
          autoCapitalize="none"
          icon="lock-outline"
          value={password}
          onChangeText={setPassword}
          helper={
            editando ? 'Solo si quieres cambiarla' : 'Mínimo 6 caracteres'
          }
        />

        <Text style={styles.subLabel}>Rol</Text>
        <View style={styles.rolesRow}>
          <RolBtn
            label="Vendedor"
            active={rol === 'vendedor'}
            onPress={() => setRol('vendedor')}
          />
          <RolBtn
            label="Administrador"
            active={rol === 'admin'}
            onPress={() => setRol('admin')}
          />
        </View>

        <View style={styles.switchContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Usuario activo</Text>
            <Text style={styles.switchHelper}>
              Los inactivos no pueden iniciar sesión
            </Text>
          </View>
          <Switch
            value={activo}
            onValueChange={setActivo}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>

        <Button
          label={editando ? 'Guardar cambios' : 'Crear usuario'}
          onPress={guardar}
          loading={saving}
          disabled={saving}
          fullWidth
          variant="primary"
        />
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

function RolBtn(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={props.onPress}
      style={[styles.rolBtn, props.active ? styles.rolBtnActive : null]}
    >
      <Text
        style={[
          styles.rolLabel,
          props.active ? styles.rolLabelActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  chipsScroll: { flexGrow: 0, maxHeight: 44, marginBottom: spacing.md },
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
  subLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  rolesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  rolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rolBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rolLabel: { ...typography.buttonSmall, color: colors.textSecondary },
  rolLabelActive: { color: colors.textInverse },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchLabel: { ...typography.bodyBold, color: colors.textPrimary },
  switchHelper: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});