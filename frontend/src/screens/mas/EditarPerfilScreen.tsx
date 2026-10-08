import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography, radius } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { http } from '@api/client';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import type { Usuario } from '@tipos/index';

export default function EditarPerfilScreen(): React.ReactElement {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const showToast = useUIStore((s) => s.showToast);

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);

  const validar = (): boolean => {
    let ok = true;

    if (!nombre.trim()) {
      setErrorNombre('Ingresa tu nombre');
      ok = false;
    } else {
      setErrorNombre(null);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrorEmail('Ingresa tu correo');
      ok = false;
    } else if (!emailRegex.test(email.trim())) {
      setErrorEmail('El correo no es válido');
      ok = false;
    } else {
      setErrorEmail(null);
    }

    return ok;
  };

  const handleGuardar = async (): Promise<void> => {
    if (!user) return;
    if (!validar()) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
      return;
    }

    setSaving(true);
    try {
      const actualizado = await http.put<Usuario>(`/usuarios/${user.id}`, {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
      });
      updateUser(actualizado);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast('Perfil actualizado.', 'success');
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'No se pudo guardar';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen
      header={
        <TopBar title="Editar perfil" onBack={() => navigation.goBack()} />
      }
    >
      <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>

      <Input
        label="Nombre completo"
        icon="account-outline"
        value={nombre}
        onChangeText={setNombre}
        error={errorNombre ?? undefined}
        autoCapitalize="words"
        required
      />

      <Input
        label="Correo electrónico"
        icon="email-outline"
        value={email}
        onChangeText={setEmail}
        error={errorEmail ?? undefined}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        required
      />

      <View style={styles.actions}>
        <Button
          label="Guardar cambios"
          variant="primary"
          icon="content-save-outline"
          onPress={handleGuardar}
          loading={saving}
          disabled={saving}
          fullWidth
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});