import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing } from '@theme/index';
import { cajaApi } from '@api/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import FormNumberInput from '@components/forms/FormNumberInput';
import FormInput from '@components/forms/FormInput';
import type { ToastVariant } from '@tipos/index';
import { Text } from 'react-native';
import { colors, typography } from '@theme/index';

const abrirSchema = z.object({
  monto_apertura: z.coerce.number().min(0, 'No puede ser negativo'),
  notas_apertura: z.string().optional(),
});

type AbrirForm = z.infer<typeof abrirSchema>;

export default function AbrirCajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const { control, handleSubmit } = useForm<AbrirForm>({
    resolver: zodResolver(abrirSchema) as never,
    defaultValues: { monto_apertura: 0, notas_apertura: '' },
  });

  const onSubmit = async (data: AbrirForm): Promise<void> => {
    setSaving(true);
    try {
      await cajaApi.abrir({
        monto_apertura: Number(data.monto_apertura),
        notas_apertura: data.notas_apertura?.trim() || undefined,
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al abrir caja';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen>
      <TopBar title="Abrir caja" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Monto inicial</Text>
          <Text style={styles.helper}>
            Ingresa el efectivo con el que inicias tu turno.
          </Text>
          <FormNumberInput
            control={control}
            name="monto_apertura"
            label="Monto de apertura"
            icon="cash"
          />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Notas (opcional)</Text>
          <FormInput
            control={control}
            name="notas_apertura"
            label="Notas"
            placeholder="Ej: Recibí caja del turno anterior"
            multiline
          />
        </Card>

        <Button
          label="Abrir caja"
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={saving}
          disabled={saving}
          variant="primary"
          size="lg"
          fullWidth
        />
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
    marginBottom: spacing.sm,
  },
  helper: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
});