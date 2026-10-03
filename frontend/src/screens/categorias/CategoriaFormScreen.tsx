import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Switch, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography } from '@theme/index';
import { categoriaSchema, type CategoriaFormData } from '@utils/validators';
import { categoriasApi } from '@api/index';
import type { MasStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import FormInput from '@components/forms/FormInput';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<MasStackParamList, 'CategoriaForm'>;

export default function CategoriaFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const categoriaId = route.params?.categoriaId;
  const editando = typeof categoriaId === 'number';

  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema) as never,
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true,
    },
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

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen>
      <TopBar
        title={editando ? 'Editar categoría' : 'Nueva categoría'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la categoría</Text>
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
              <Text style={styles.switchLabel}>Categoría activa</Text>
              <Text style={styles.switchHelper}>
                Se mostrará en los listados y formularios.
              </Text>
            </View>
            <Switch
              value={activo}
              onValueChange={(value) => setValue('activo', value, { shouldDirty: true })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </Card>

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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchLabel: { ...typography.bodyBold, color: colors.textPrimary },
  switchHelper: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
