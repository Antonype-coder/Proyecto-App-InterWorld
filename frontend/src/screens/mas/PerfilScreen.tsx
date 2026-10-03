import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { authApi, usuariosApi } from '@api/index';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Toast from '@components/ui/Toast';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import type { ToastVariant } from '@tipos/index';

export default function PerfilScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const guardarPerfil = async (): Promise<void> => {
    if (nombre.trim().length < 3) {
      setToast({
        visible: true,
        message: 'El nombre es muy corto',
        variant: 'error',
      });
      return;
    }
    if (!email.includes('@')) {
      setToast({
        visible: true,
        message: 'Correo inválido',
        variant: 'error',
      });
      return;
    }
    if (!user?.id) return;

    setSavingPerfil(true);
    try {
      await usuariosApi.actualizar(user.id, {
        nombre: nombre.trim(),
        email: email.trim(),
      });
      const actualizado = await authApi.me();
      updateUser(actualizado);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      setToast({
        visible: true,
        message: 'Perfil actualizado',
        variant: 'success',
      });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSavingPerfil(false);
    }
  };

  const guardarPassword = async (): Promise<void> => {
    if (password.length < 6) {
      setToast({
        visible: true,
        message: 'Mínimo 6 caracteres',
        variant: 'error',
      });
      return;
    }
    if (password !== confirmPassword) {
      setToast({
        visible: true,
        message: 'Las contraseñas no coinciden',
        variant: 'error',
      });
      return;
    }
    if (!user?.id) return;

    setSavingPassword(true);
    try {
      await usuariosApi.actualizar(user.id, { password });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      setPassword('');
      setConfirmPassword('');
      setToast({
        visible: true,
        message: 'Contraseña actualizada',
        variant: 'success',
      });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al cambiar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <KeyboardScreen
      header={<TopBar title="Mi perfil" onBack={() => navigation.goBack()} />}
      contentContainerStyle={{ padding: 0 }}
    >
      <View style={styles.content}>
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          <Input
            label="Nombre completo"
            icon="account-outline"
            value={nombre}
            onChangeText={setNombre}
          />
          <Input
            label="Correo electrónico"
            icon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            label="Guardar cambios"
            onPress={guardarPerfil}
            loading={savingPerfil}
            disabled={savingPerfil}
            fullWidth
            variant="primary"
          />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
          <Input
            label="Nueva contraseña"
            icon="lock-outline"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <Input
            label="Confirmar contraseña"
            icon="lock-check-outline"
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button
            label="Actualizar contraseña"
            onPress={guardarPassword}
            loading={savingPassword}
            disabled={savingPassword}
            fullWidth
            variant="primary"
          />
        </Card>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.giant },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
});