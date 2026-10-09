import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing, typography, radius } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppColors } from '@theme/colors';
import { useUIStore } from '@store/uiStore';
import { http } from '@api/client';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';

export default function CambiarPasswordScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      footer={
        <Button
          label="Cambiar contraseña"
          variant="primary"
          icon="shield-key-outline"
          onPress={handleGuardar}
          loading={saving}
          disabled={saving}
          fullWidth
        />
      }
      contentContainerStyle={{ padding: 0 }}
    >
      <View style={styles.content}>
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Contraseña
          </Text>

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
        </Card>

        <Card
          variant="default"
          style={[
            styles.section,
            {
              backgroundColor: colors.infoSubtle,
              borderColor: colors.info,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.noteRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.info}
            />
            <Text style={[styles.noteText, { color: colors.infoText ?? colors.info }]}>
              Por seguridad, se cerrará la sesión en otros dispositivos después
              de cambiar la contraseña.
            </Text>
          </View>
        </Card>
      </View>
    </KeyboardScreen>
  );
}

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.giant },
    section: { marginBottom: spacing.md },
    sectionTitle: {
      ...typography.h3,
      marginBottom: spacing.lg,
    },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    noteText: {
      ...typography.small,
      flex: 1,
      lineHeight: 18,
    },
  });