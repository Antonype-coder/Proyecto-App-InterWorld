import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography } from '@theme/index';
import { cajaApi } from '@api/index';
import type { CajaStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import FormNumberInput from '@components/forms/FormNumberInput';
import FormInput from '@components/forms/FormInput';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<CajaStackParamList, 'CerrarCaja'>;

const cerrarSchema = z.object({
  monto_cierre_declarado: z.coerce.number().min(0),
  notas_cierre: z.string().optional(),
});

type CerrarForm = z.infer<typeof cerrarSchema>;

export default function CerrarCajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const sesionId = route.params.sesionId;

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const { control, handleSubmit } = useForm<CerrarForm>({
    resolver: zodResolver(cerrarSchema) as never,
    defaultValues: { monto_cierre_declarado: 0, notas_cierre: '' },
  });

  const onSubmit = async (data: CerrarForm): Promise<void> => {
    setSaving(true);
    try {
      await cajaApi.cerrar(sesionId, {
        monto_cierre_declarado: Number(data.monto_cierre_declarado),
        notas_cierre: data.notas_cierre?.trim() || undefined,
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al cerrar caja';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen>
      <TopBar title="Cerrar caja" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Monto contado</Text>
          <Text style={styles.helper}>
            Cuenta el efectivo físico y declara el total. El sistema calculará
            la diferencia automáticamente.
          </Text>
          <FormNumberInput
            control={control}
            name="monto_cierre_declarado"
            label="Monto declarado"
            icon="cash-check"
          />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Notas (opcional)</Text>
          <FormInput
            control={control}
            name="notas_cierre"
            label="Notas"
            multiline
          />
        </Card>

        <Button
          label="Cerrar caja"
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={saving}
          disabled={saving}
          variant="danger"
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