import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { clienteSchema, type ClienteFormData } from '@utils/validators';
import { clientesApi } from '@api/index';
import type { ClientesStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import { SuccessPulse } from '@components/feedback';
import FormInput from '@components/forms/FormInput';
import FormNumberInput from '@components/forms/FormNumberInput';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<ClientesStackParamList, 'ClienteForm'>;

export default function ClienteFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const clienteId = route.params?.clienteId;
  const editando = typeof clienteId === 'number';
  const colors = useColors();

  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [pulseVisible, triggerPulse] = useSuccessPulse();
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const { control, handleSubmit, reset } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema) as never,
    defaultValues: {
      nombre: '',
      documento: '',
      telefono: '',
      email: '',
      direccion: '',
      cupo_credito: 0,
    },
  });

  useEffect(() => {
    (async () => {
      if (editando && clienteId) {
        try {
          const c = await clientesApi.obtener(clienteId);
          reset({
            nombre: c.nombre,
            documento: c.documento ?? '',
            telefono: c.telefono ?? '',
            email: c.email ?? '',
            direccion: c.direccion ?? '',
            cupo_credito: parseFloat(c.cupo_credito),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error al cargar';
          setToast({ visible: true, message: msg, variant: 'error' });
        }
      }
      setLoading(false);
    })();
  }, [editando, clienteId, reset]);

  const onSubmit = async (data: ClienteFormData): Promise<void> => {
    setSaving(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        documento: data.documento?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        cupo_credito: Number(data.cupo_credito) || 0,
      };

      if (editando && clienteId) {
        await clientesApi.actualizar(clienteId, payload);
      } else {
        await clientesApi.crear(payload);
      }

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      triggerPulse();
      setTimeout(() => navigation.goBack(), 700);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen
      header={
        <TopBar
          title={editando ? 'Editar cliente' : 'Nuevo cliente'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <Button
          label={editando ? 'Guardar cambios' : 'Crear cliente'}
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={saving}
          disabled={saving || loading}
          variant="primary"
          size="lg"
          fullWidth
        />
      }
    >
      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Datos personales
        </Text>
        <FormInput
          control={control}
          name="nombre"
          label="Nombre completo"
          icon="account-outline"
          required
        />
        <FormInput
          control={control}
          name="documento"
          label="Documento"
          placeholder="Cédula, NIT"
          icon="card-account-details-outline"
        />
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Contacto
        </Text>
        <FormInput
          control={control}
          name="telefono"
          label="Teléfono"
          keyboardType="phone-pad"
          icon="phone-outline"
        />
        <FormInput
          control={control}
          name="email"
          label="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="email-outline"
        />
        <FormInput
          control={control}
          name="direccion"
          label="Dirección"
          placeholder="Dirección del cliente"
          icon="map-marker-outline"
        />
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Crédito
        </Text>
        <FormNumberInput
          control={control}
          name="cupo_credito"
          label="Cupo de crédito"
          icon="credit-card-outline"
          helper="Monto máximo de deuda permitida"
        />
      </Card>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <SuccessPulse
        visible={pulseVisible}
        label={editando ? 'Cliente actualizado' : 'Cliente creado'}
      />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
});