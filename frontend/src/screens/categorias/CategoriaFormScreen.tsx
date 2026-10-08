import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Switch, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { categoriaSchema, type CategoriaFormData } from '@utils/validators';
import { categoriasApi } from '@api/index';
import type { MasStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import { SuccessPulse } from '@components/feedback';
import FormInput from '@components/forms/FormInput';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<MasStackParamList, 'CategoriaForm'>;

export default function CategoriaFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const categoriaId = route.params?.categoriaId;
  const editando = typeof categoriaId === 'number';
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
    useForm<CategoriaFormData>({
      resolver: zodResolver(categoriaSchema) as never,
      defaultValues: { nombre: '', descripcion: '', activo: true },
    });

  const activo = watch('activo') ?? true;

  useEffect(() => {
    (async () => {
      if (editando && categoriaId) {
        try {
          const categoria = await categoriasApi.obtener(categoriaId);
          reset({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion ?? '',
            activo: categoria.activo === 1,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error al cargar';
          setToast({ visible: true, message: msg, variant: 'error' });
        }
      }
      setLoading(false);
    })();
  }, [categoriaId, editando, reset]);

  const onSubmit = async (data: CategoriaFormData): Promise<void> => {
    setSaving(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        activo: data.activo ? 1 : 0,
      };
      if (editando && categoriaId) {
        await categoriasApi.actualizar(categoriaId, payload);
      } else {
        await categoriasApi.crear(payload);
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
          title={editando ? 'Editar categoría' : 'Nueva categoría'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <Button
          label={editando ? 'Guardar cambios' : 'Crear categoría'}
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
          Datos de la categoría
        </Text>
        <FormInput
          control={control}
          name="nombre"
          label="Nombre"
          icon="shape-outline"
          required
        />
        <FormInput
          control={control}
          name="descripcion"
          label="Descripción"
          placeholder="Opcional"
          icon="text-box-outline"
          multiline
        />
      </Card>

      <Card variant="default" style={styles.section}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
              Categoría activa
            </Text>
            <Text style={[styles.switchHelper, { color: colors.textMuted }]}>
              Se mostrará en los listados y formularios.
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
        label={editando ? 'Categoría actualizada' : 'Categoría creada'}
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