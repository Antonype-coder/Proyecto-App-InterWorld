import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useSmartBack } from '@hooks/useReturnTo';
import { useCajaResumen } from '@hooks/useCajaResumen';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { cajaApi } from '@api/index';
import type { CajaSesion, CajaStackParamList } from '@tipos/index';
import { formatCurrency } from '@utils/format';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import FormattedNumberInput from '@components/forms/FormattedNumberInput';
import Loader from '@components/ui/Loader';
import Toast from '@components/ui/Toast';
import { SuccessPulse } from '@components/feedback';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<CajaStackParamList, 'CerrarCaja'>;

export default function CerrarCajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const sesionId = route.params.sesionId;
  const colors = useColors();
  const goBack = useSmartBack();

  const [sesion, setSesion] = useState<CajaSesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [notas, setNotas] = useState('');
  const [pulseVisible, triggerPulse] = useSuccessPulse();
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await cajaApi.estado();
        if (!cancelled) setSesion(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resumen = useCajaResumen(sesion);

  const declarado = parseFloat(montoDeclarado) || 0;
  const diferencia = declarado - resumen.efectivo;
  const tieneDeclarado = montoDeclarado.trim().length > 0;

  const onSubmit = async (): Promise<void> => {
    if (!tieneDeclarado) {
      setToast({
        visible: true,
        message: 'Ingresa el monto contado',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      await cajaApi.cerrar(sesionId, {
        monto_cierre_declarado: declarado,
        notas_cierre: notas.trim() || undefined,
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      triggerPulse();
      setTimeout(() => goBack(), 700);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al cerrar caja';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen
      header={<TopBar title="Cerrar caja" onBack={goBack} />}
      footer={
        <Button
          label="Cerrar caja"
          onPress={() => {
            void onSubmit();
          }}
          loading={saving}
          disabled={saving || loading || !tieneDeclarado}
          variant="danger"
          size="lg"
          fullWidth
        />
      }
    >
      {loading ? (
        <View style={{ paddingVertical: spacing.xxl }}>
          <Loader message="Cargando resumen de caja" />
        </View>
      ) : !sesion ? (
        <Card variant="flat" style={styles.section}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No hay una caja abierta para cerrar.
          </Text>
        </Card>
      ) : (
        <>
          <Card variant="default" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Resumen del turno
            </Text>

            <ResumenRow
              label="Apertura"
              value={formatCurrency(resumen.apertura)}
            />
            <ResumenRow
              label={`Ventas (${resumen.ventasCantidad})`}
              value={formatCurrency(resumen.ventasTotal)}
            />
            {resumen.ingresos > 0 ? (
              <ResumenRow
                label="Ingresos manuales"
                value={`+ ${formatCurrency(resumen.ingresos)}`}
                valueColor={colors.success}
              />
            ) : null}
            {resumen.egresos > 0 ? (
              <ResumenRow
                label="Egresos manuales"
                value={`− ${formatCurrency(resumen.egresos)}`}
                valueColor={colors.danger}
              />
            ) : null}

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.efectivoRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.efectivoLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Efectivo esperado
                </Text>
                <Text
                  style={[
                    styles.efectivoSub,
                    { color: colors.textMuted },
                  ]}
                >
                  Deberías tener esto en caja
                </Text>
              </View>
              <Text
                style={[styles.efectivoValue, { color: colors.textPrimary }]}
              >
                {formatCurrency(resumen.efectivo)}
              </Text>
            </View>
          </Card>

          <Card variant="default" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Monto contado
            </Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              Cuenta el efectivo físico y declara el total.
            </Text>

            <FormattedNumberInput
              label="Monto declarado"
              value={montoDeclarado}
              onChangeText={setMontoDeclarado}
              icon="cash"
              placeholder="0"
            />

            <Pressable
              onPress={() =>
                setMontoDeclarado(String(Math.round(resumen.efectivo)))
              }
              style={styles.useExpected}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="calculator-variant-outline"
                size={14}
                color={colors.accent}
              />
              <Text style={[styles.useExpectedText, { color: colors.accent }]}>
                Usar efectivo esperado ({formatCurrency(resumen.efectivo)})
              </Text>
            </Pressable>

            {tieneDeclarado ? (
              <View
                style={[
                  styles.diffBox,
                  {
                    backgroundColor:
                      Math.abs(diferencia) < 0.5
                        ? colors.successSubtle
                        : Math.abs(diferencia) <= resumen.efectivo * 0.02
                          ? colors.warningSubtle
                          : colors.dangerSubtle,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    Math.abs(diferencia) < 0.5
                      ? 'check-circle-outline'
                      : diferencia > 0
                        ? 'trending-up'
                        : 'trending-down'
                  }
                  size={16}
                  color={
                    Math.abs(diferencia) < 0.5
                      ? colors.success
                      : Math.abs(diferencia) <= resumen.efectivo * 0.02
                        ? colors.warning
                        : colors.danger
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.diffLabel,
                      {
                        color:
                          Math.abs(diferencia) < 0.5
                            ? colors.successText
                            : Math.abs(diferencia) <= resumen.efectivo * 0.02
                              ? colors.warningText
                              : colors.dangerText,
                      },
                    ]}
                  >
                    {Math.abs(diferencia) < 0.5
                      ? 'Sin diferencia'
                      : diferencia > 0
                        ? 'Sobrante'
                        : 'Faltante'}
                  </Text>
                  {Math.abs(diferencia) >= 0.5 ? (
                    <Text
                      style={[
                        styles.diffValue,
                        {
                          color:
                            Math.abs(diferencia) <= resumen.efectivo * 0.02
                              ? colors.warningText
                              : colors.dangerText,
                        },
                      ]}
                    >
                      {diferencia > 0 ? '+' : '−'}
                      {formatCurrency(Math.abs(diferencia))}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </Card>

          <Card variant="default" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Notas (opcional)
            </Text>
            <Input
              label="Notas"
              value={notas}
              onChangeText={setNotas}
              placeholder="Ej: sin novedades, diferencia justificada..."
              multiline
            />
          </Card>
        </>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <SuccessPulse visible={pulseVisible} label="Caja cerrada" />
    </KeyboardScreen>
  );
}

function ResumenRow(props: {
  label: string;
  value: string;
  valueColor?: string;
}): React.ReactElement {
  const colors = useColors();
  return (
    <View style={styles.resumenRow}>
      <Text style={[styles.resumenLabel, { color: colors.textSecondary }]}>
        {props.label}
      </Text>
      <Text
        style={[
          styles.resumenValue,
          { color: props.valueColor ?? colors.textPrimary },
        ]}
      >
        {props.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  helper: {
    ...typography.small,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  emptyText: { ...typography.caption, textAlign: 'center' },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  resumenLabel: { ...typography.body },
  resumenValue: { ...typography.bodyBold },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  efectivoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  efectivoLabel: { ...typography.bodyBold },
  efectivoSub: { ...typography.tiny, marginTop: 2 },
  efectivoValue: { ...typography.price },
  useExpected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  useExpectedText: { ...typography.small },
  diffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  diffLabel: { ...typography.bodyBold },
  diffValue: { ...typography.small, marginTop: 2 },
});