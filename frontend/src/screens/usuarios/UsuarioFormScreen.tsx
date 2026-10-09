import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing, radius, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usuariosApi } from '@api/index';
import type { UsuariosStackParamList } from '@tipos/index';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<UsuariosStackParamList, 'UsuarioForm'>;

export function UsuarioFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const colors = useColors();

  const userId = route.params?.userId;
  const editando = typeof userId === 'number';

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'admin' | 'vendedor'>('vendedor');
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  useEffect(() => {
    if (!editando || !userId) return;

    (async () => {
      try {
        const u = await usuariosApi.obtener(userId);
        setNombre(u.nombre);
        setEmail(u.email);
        setRol((u.rol as 'admin' | 'vendedor') ?? 'vendedor');
        setActivo(u.activo === 1);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar usuario';
        setToast({ visible: true, message: msg, variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [editando, userId]);

  const onSubmit = async (): Promise<void> => {
    const nombreTrim = nombre.trim();
    const emailTrim = email.trim().toLowerCase();

    if (nombreTrim.length < 3) {
      setToast({
        visible: true,
        message: 'El nombre debe tener al menos 3 caracteres.',
        variant: 'error',
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setToast({
        visible: true,
        message: 'Correo electrónico no válido.',
        variant: 'error',
      });
      return;
    }
    if (!editando && password.length < 6) {
      setToast({
        visible: true,
        message: 'La contraseña debe tener al menos 6 caracteres.',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (editando && userId) {
        const payload: Record<string, unknown> = {
          nombre: nombreTrim,
          email: emailTrim,
          rol,
          activo: activo ? 1 : 0,
        };
        if (password.length >= 6) payload.password = password;

        await usuariosApi.actualizar(userId, payload);
      } else {
        await usuariosApi.crear({
          nombre: nombreTrim,
          email: emailTrim,
          password,
          rol,
        });
      }

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );

      setToast({
        visible: true,
        message: editando ? 'Usuario actualizado.' : 'Usuario creado.',
        variant: 'success',
      });

      setTimeout(() => navigation.goBack(), 600);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Datos del usuario
          </Text>

          <Input
            label="Nombre completo"
            placeholder="Ej: Juan Pérez"
            icon="account-outline"
            value={nombre}
            onChangeText={setNombre}
            required
          />

          <Input
            label="Correo electrónico"
            placeholder="usuario@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="email-outline"
            value={email}
            onChangeText={setEmail}
            required
          />

          <Input
            label={editando ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoCapitalize="none"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            required={!editando}
          />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Rol
          </Text>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setRol('vendedor');
            }}
            style={[
              styles.rolOption,
              {
                backgroundColor: colors.surface,
                borderColor:
                  rol === 'vendedor' ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                rol === 'vendedor'
                  ? 'radiobox-marked'
                  : 'radiobox-blank'
              }
              size={20}
              color={
                rol === 'vendedor' ? colors.primary : colors.textMuted
              }
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.rolTitle, { color: colors.textPrimary }]}
              >
                Vendedor
              </Text>
              <Text
                style={[styles.rolSubtitle, { color: colors.textMuted }]}
              >
                Puede vender y consultar, sin permisos de administración
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setRol('admin');
            }}
            style={[
              styles.rolOption,
              {
                backgroundColor: colors.surface,
                borderColor:
                  rol === 'admin' ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={rol === 'admin' ? 'radiobox-marked' : 'radiobox-blank'}
              size={20}
              color={rol === 'admin' ? colors.primary : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.rolTitle, { color: colors.textPrimary }]}
              >
                Administrador
              </Text>
              <Text
                style={[styles.rolSubtitle, { color: colors.textMuted }]}
              >
                Acceso total a la tienda
              </Text>
            </View>
          </Pressable>
        </Card>

        {editando ? (
          <Card variant="default" style={styles.section}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.switchLabel, { color: colors.textPrimary }]}
                >
                  Usuario activo
                </Text>
                <Text
                  style={[styles.switchHelper, { color: colors.textMuted }]}
                >
                  Los inactivos no pueden iniciar sesión
                </Text>
              </View>
              <Switch
                value={activo}
                onValueChange={setActivo}
                trackColor={{
                  true: colors.primary,
                  false: colors.border,
                }}
              />
            </View>
          </Card>
        ) : null}

        <Button
          label={editando ? 'Guardar cambios' : 'Crear usuario'}
          onPress={() => {
            void onSubmit();
          }}
          loading={saving}
          disabled={saving || loading}
          variant="primary"
          size="lg"
          fullWidth
        />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

export default UsuarioFormScreen;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  rolOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  rolTitle: {
    ...typography.bodyBold,
  },
  rolSubtitle: {
    ...typography.small,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchLabel: {
    ...typography.bodyBold,
  },
  switchHelper: {
    ...typography.small,
    marginTop: 2,
  },
});