import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usePermissions } from '@hooks/usePermissions';
import { useSmartBack } from '@hooks/useReturnTo';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { cajaApi } from '@api/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import { SuccessPulse } from '@components/feedback';
import FormNumberInput from '@components/forms/FormNumberInput';
import FormInput from '@components/forms/FormInput';
import type { ToastVariant } from '@tipos/index';

const abrirSchema = z.object({
  monto_apertura: z.coerce.number().min(0, 'No puede ser negativo'),
  notas_apertura: z.string().optional(),
});

type AbrirForm = z.infer<typeof abrirSchema>;

export default function AbrirCajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const perm = usePermissions();
  const goBack = useSmartBack();
  const [saving, setSaving] = useState(false);
  const [pulseVisible, triggerPulse] = useSuccessPulse();
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
      triggerPulse();
      setTimeout(() => goBack(), 700);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al abrir caja';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 🔒 Bloqueo para vendedor (por si llega por URL directa)
  if (!perm.puedeAbrirCaja) {
    return (
      <KeyboardScreen
        header={<TopBar title="Abrir caja" onBack={goBack} />}
      >
        <View style={styles.centerBox}>
          <View
            style={[
              styles.lockIcon,
              { backgroundColor: colors.dangerSubtle },
            ]}
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={32}
              color={colors.danger}
            />
          </View>
          <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>
            Sin permiso
          </Text>
          <Text style={[styles.lockDesc, { color: colors.textSecondary }]}>
            Solo un administrador puede abrir la caja.
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button
              label="Volver"
              variant="outline"
              icon="arrow-left"
              onPress={goBack}
              fullWidth
            />
          </View>
        </View>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen
      header={<TopBar title="Abrir caja" onBack={goBack} />}
      footer={
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
      }
    >
      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Monto inicial
        </Text>
        <Text style={[styles.helper, { color: colors.textMuted }]}>
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
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Notas (opcional)
        </Text>
        <FormInput
          control={control}
          name="notas_apertura"
          label="Notas"
          multiline
        />
      </Card>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <SuccessPulse visible={pulseVisible} label="Caja abierta" />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  helper: {
    ...typography.small,
    marginBottom: spacing.lg,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  lockTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  lockDesc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});