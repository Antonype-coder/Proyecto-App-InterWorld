import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useSmartBack } from '@hooks/useReturnTo';
import { cajaApi } from '@api/index';
import type { CajaStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import FormInput from '@components/forms/FormInput';
import FormNumberInput from '@components/forms/FormNumberInput';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<CajaStackParamList, 'CajaMovimientoForm'>;

type TipoMovimientoCaja = 'ingreso' | 'egreso';
type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

const movimientoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a cero'),
  descripcion: z.string().min(3, 'Describe el motivo del movimiento'),
});

type MovimientoForm = z.infer<typeof movimientoSchema>;

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
];

export default function MovimientoCajaFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const sesionId = route.params.sesionId;
  const colors = useColors();
  const goBack = useSmartBack();

  const [tipo, setTipo] = useState<TipoMovimientoCaja>('ingreso');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const { control, handleSubmit } = useForm<MovimientoForm>({
    resolver: zodResolver(movimientoSchema) as never,
    defaultValues: { monto: 0, descripcion: '' },
  });

  const onSubmit = async (data: MovimientoForm): Promise<void> => {
    setSaving(true);
    try {
      await cajaApi.registrarMovimiento(sesionId, {
        tipo,
        monto: Number(data.monto),
        metodo_pago: metodoPago,
        descripcion: data.descripcion.trim(),
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      goBack();
    } catch (e) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
      const msg =
        e instanceof Error ? e.message : 'Error al registrar movimiento';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen
      header={<TopBar title="Movimiento de caja" onBack={goBack} />}
      footer={
        <Button
          label="Registrar movimiento"
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
          Tipo de movimiento
        </Text>
        <View style={styles.tipoRow}>
          <TipoBtn
            icon="arrow-down-circle-outline"
            label="Ingreso"
            active={tipo === 'ingreso'}
            color={colors.success}
            onPress={() => setTipo('ingreso')}
          />
          <TipoBtn
            icon="arrow-up-circle-outline"
            label="Egreso"
            active={tipo === 'egreso'}
            color={colors.danger}
            onPress={() => setTipo('egreso')}
          />
        </View>
        <Text style={[styles.hintText, { color: colors.textMuted }]}>
          {tipo === 'ingreso'
            ? 'Añade efectivo al turno actual'
            : 'Retira efectivo del turno actual'}
        </Text>
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Monto
        </Text>
        <FormNumberInput
          control={control}
          name="monto"
          label="Monto"
          icon="currency-usd"
          required
        />
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Método de pago
        </Text>
        <View style={styles.metodosWrap}>
          {METODOS.map((m) => (
            <MetodoChip
              key={m.value}
              label={m.label}
              active={metodoPago === m.value}
              onPress={() => setMetodoPago(m.value)}
            />
          ))}
        </View>
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Descripción
        </Text>
        <FormInput
          control={control}
          name="descripcion"
          label="Motivo"
          placeholder="Ej: cambio de billetes, compra insumos..."
          multiline
          required
        />
      </Card>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </KeyboardScreen>
  );
}

function TipoBtn(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.tipoBtn,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        props.active
          ? {
              borderColor: props.color,
              backgroundColor: props.color + '10',
            }
          : null,
      ]}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={18}
        color={props.active ? props.color : colors.textMuted}
      />
      <Text
        style={[
          styles.tipoLabel,
          { color: colors.textSecondary },
          props.active
            ? {
                color: props.color,
                fontFamily: typography.button.fontFamily,
              }
            : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function MetodoChip(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.metodoChip,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        props.active
          ? {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }
          : null,
      ]}
    >
      <Text
        style={[
          styles.metodoLabel,
          { color: colors.textSecondary },
          props.active
            ? {
                color: colors.textInverse,
                fontFamily: typography.button.fontFamily,
              }
            : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.lg },
  tipoRow: { flexDirection: 'row', gap: spacing.sm },
  tipoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tipoLabel: { ...typography.small },
  hintText: {
    ...typography.small,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  metodosWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metodoChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  metodoLabel: { ...typography.small },
});