import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Switch, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { proveedorSchema, type ProveedorFormData } from '@utils/validators';
import { proveedoresApi } from '@api/index';
import type { MasStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import { SuccessPulse } from '@components/feedback';
import FormInput from '@components/forms/FormInput';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<MasStackParamList, 'ProveedorForm'>;

export default function ProveedorFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const proveedorId = route.params?.proveedorId;
  const editando = typeof proveedorId === 'number';
  const colors = useColors();

  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [pulseVisible, triggerPulse] = useSuccessPulse();
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const { control, handleSubmit, reset, setValue, watch } =
    useForm<ProveedorFormData>({
      resolver: zodResolver(proveedorSchema) as never,
      defaultValues: {
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: '',
        activo: true,
      },
    });

  const activo = watch('activo') ?? true;

  useEffect(() => {
    (async () => {
      if (editando && proveedorId) {
        try {
          const proveedor = await proveedoresApi.obtener(proveedorId);
          reset({
            nombre: proveedor.nombre,
            contacto: proveedor.contacto ?? '',
            telefono: proveedor.telefono ?? '',
            email: proveedor.email ?? '',
            direccion: proveedor.direccion ?? '',
            notas: proveedor.notas ?? '',
            activo: proveedor.activo === 1,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error al cargar';
          setToast({ visible: true, message: msg, variant: 'error' });
        }
      }
      setLoading(false);
    })();
  }, [proveedorId, editando, reset]);

  const onSubmit = async (data: ProveedorFormData): Promise<void> => {
    setSaving(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        contacto: data.contacto?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
        activo: data.activo ? 1 : 0,
      };
      if (editando && proveedorId) {
        await proveedoresApi.actualizar(proveedorId, payload);
      } else {
        await proveedoresApi.crear(payload);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          title={editando ? 'Editar proveedor' : 'Nuevo proveedor'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <Button
          label={editando ? 'Guardar cambios' : 'Crear proveedor'}
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
          Datos del proveedor
        </Text>
        <FormInput
          control={control}
          name="nombre"
          label="Nombre"
          icon="truck-outline"
          required
        />
        <FormInput
          control={control}
          name="contacto"
          label="Contacto"
          placeholder="Persona de contacto"
          icon="account-outline"
        />
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
          placeholder="Dirección del proveedor"
          icon="map-marker-outline"
        />
        <FormInput
          control={control}
          name="notas"
          label="Notas"
          placeholder="Observaciones o condiciones"
          icon="text-box-outline"
          multiline
        />
      </Card>

      <Card variant="default" style={styles.section}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
              Proveedor activo
            </Text>
            <Text style={[styles.switchHelper, { color: colors.textMuted }]}>
              Se podrá usar en productos y órdenes de compra.
            </Text>
          </View>
          <Switch
            value={activo}
            onValueChange={(value) =>
              setValue('activo', value, { shouldDirty: true })
            }
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </Card>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <SuccessPulse
        visible={pulseVisible}
        label={editando ? 'Proveedor actualizado' : 'Proveedor creado'}
      />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.lg },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchLabel: { ...typography.bodyBold },
  switchHelper: { ...typography.small, marginTop: 2 },
});