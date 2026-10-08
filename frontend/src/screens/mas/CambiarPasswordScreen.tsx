import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography, radius } from '@theme/index';
import { useUIStore } from '@store/uiStore';
import { http } from '@api/client';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';

export default function CambiarPasswordScreen(): React.ReactElement {
  const navigation = useNavigation();
  const showToast = useUIStore((s) => s.showToast);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [errorActual, setErrorActual] = useState<string | null>(null);
  const [errorNueva, setErrorNueva] = useState<string | null>(null);
  const [errorConfirmar, setErrorConfirmar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validar = (): boolean => {
    let ok = true;

    if (!actual) {
      setErrorActual('Ingresa tu contraseña actual');
      ok = false;
    } else {
      setErrorActual(null);
    }

    if (!nueva) {
      setErrorNueva('Ingresa la nueva contraseña');
      ok = false;
    } else if (nueva.length < 8) {
      setErrorNueva('Debe tener al menos 8 caracteres');
      ok = false;
    } else if (nueva === actual) {
      setErrorNueva('La nueva contraseña debe ser distinta');
      ok = false;
    } else {
      setErrorNueva(null);
    }

    if (confirmar !== nueva) {
      setErrorConfirmar('Las contraseñas no coinciden');
      ok = false;
    } else {
      setErrorConfirmar(null);
    }

    return ok;
  };

  const handleGuardar = async (): Promise<void> => {
    if (!validar()) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
      return;
    }

    setSaving(true);
    try {
      await http.post('/auth/change-password', {
        password_actual: actual,
        password_nueva: nueva,
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast('Contraseña actualizada.', 'success');
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'No se pudo cambiar';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen
      header={
        <TopBar
          title="Cambiar contraseña"
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Text style={styles.sectionLabel}>CONTRASEÑA</Text>

      <Input
        label="Contraseña actual"
        icon="lock-outline"
        secureTextEntry
        value={actual}
        onChangeText={setActual}
        error={errorActual ?? undefined}
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <Input
        label="Nueva contraseña"
        icon="lock-reset"
        secureTextEntry
        value={nueva}
        onChangeText={setNueva}
        error={errorNueva ?? undefined}
        helper="Mínimo 8 caracteres"
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <Input
        label="Confirmar nueva contraseña"
        icon="lock-check-outline"
        secureTextEntry
        value={confirmar}
        onChangeText={setConfirmar}
        error={errorConfirmar ?? undefined}
        autoCapitalize="none"
        autoCorrect={false}
        required
      />

      <View style={styles.note}>
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={colors.info}
        />
        <Text style={styles.noteText}>
          Por seguridad, se cerrará la sesión en otros dispositivos.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Cambiar contraseña"
          variant="primary"
          icon="shield-key-outline"
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
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.infoSubtle,
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noteText: {
    ...typography.small,
    color: colors.infoText,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});