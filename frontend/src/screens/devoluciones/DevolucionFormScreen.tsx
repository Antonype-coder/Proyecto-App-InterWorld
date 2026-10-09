import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppColors } from '@theme/colors';
import { ventasApi, devolucionesApi } from '@api/index';
import type {
  Venta,
  MetodoDevolucion,
  VentasStackParamList,
} from '@tipos/index';
import { formatCurrency } from '@utils/format';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<VentasStackParamList, 'DevolucionForm'>;

export default function DevolucionFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const ventaId = route.params.ventaId;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [metodo, setMetodo] = useState<MetodoDevolucion>('efectivo');
  const [seleccion, setSeleccion] = useState<Record<number, number>>({});
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  useEffect(() => {
    (async () => {
      try {
        const v = await ventasApi.obtener(ventaId);
        setVenta(v);
        const init: Record<number, number> = {};
        v.detalle.forEach((d) => {
          init[d.producto_id] = 0;
        });
        setSeleccion(init);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error';
        setToast({ visible: true, message: msg, variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [ventaId]);

  const setCantidad = (pid: number, cant: number, max: number): void => {
    const c = Math.max(0, Math.min(cant, max));
    setSeleccion((prev) => ({ ...prev, [pid]: c }));
  };

  // 🔥 Precio NETO real por unidad = (subtotal - descuento) / cantidad
  // Así refleja lo que REALMENTE se cobró con la promo aplicada.
  const precioNetoUnitario = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any): number => {
      const cantidad = Number(d.cantidad) || 0;
      if (cantidad <= 0) return parseFloat(d.precio_unitario) || 0;

      const subtotal = parseFloat(d.subtotal) || 0;
      const descuento = parseFloat(d.descuento ?? '0') || 0;
      const neto = subtotal - descuento;

      return neto / cantidad;
    },
    [],
  );

  const calcularTotal = useCallback((): number => {
    if (!venta) return 0;
    return venta.detalle.reduce((sum, d) => {
      const cant = seleccion[d.producto_id] ?? 0;
      return sum + cant * precioNetoUnitario(d);
    }, 0);
  }, [venta, seleccion, precioNetoUnitario]);

  const totalSeleccionado = calcularTotal();
  const cantidadTotalItems = Object.values(seleccion).reduce(
    (s, v) => s + v,
    0,
  );

  const onSubmit = async (): Promise<void> => {
    if (cantidadTotalItems === 0) {
      setToast({
        visible: true,
        message: 'Selecciona al menos un producto',
        variant: 'error',
      });
      return;
    }
    if (motivo.trim().length < 3) {
      setToast({
        visible: true,
        message: 'Motivo requerido',
        variant: 'error',
      });
      return;
    }

    Alert.alert(
      'Confirmar devolución',
      `Se devolverán ${cantidadTotalItems} productos por ${formatCurrency(
        totalSeleccionado,
      )}.\n\n¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSaving(true);
            try {
              const items = Object.entries(seleccion)
                .filter(([_, c]) => c > 0)
                .map(([pid, c]) => ({
                  producto_id: Number(pid),
                  cantidad: c,
                }));

              const dev = await devolucionesApi.crear({
                venta_id: ventaId,
                motivo: motivo.trim(),
                metodo_devolucion: metodo,
                items,
              });

              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              navigation.replace('DevolucionDetalle', {
                devolucionId: dev.id,
              });
            } catch (e) {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              );
              const msg =
                e instanceof Error ? e.message : 'Error al devolver';
              setToast({ visible: true, message: msg, variant: 'error' });
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <KeyboardScreen
        header={
          <TopBar
            title="Nueva devolución"
            onBack={() => navigation.goBack()}
          />
        }
      >
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      </KeyboardScreen>
    );
  }

  if (!venta) {
    return (
      <KeyboardScreen
        header={
          <TopBar
            title="Nueva devolución"
            onBack={() => navigation.goBack()}
          />
        }
      >
        <View style={styles.centerBox}>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            Venta no encontrada
          </Text>
        </View>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen
      header={
        <TopBar
          title="Nueva devolución"
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <Button
          label="Registrar devolución"
          onPress={onSubmit}
          loading={saving}
          disabled={saving || cantidadTotalItems === 0}
          variant="primary"
          size="lg"
          fullWidth
        />
      }
      contentContainerStyle={{ padding: 0 }}
    >
      <View style={styles.content}>
        {/* Info de la venta */}
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Venta a devolver
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Folio
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {venta.numero}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Cliente
            </Text>
            <Text
              style={[styles.infoValue, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {venta.cliente_nombre ?? 'Consumidor final'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Total original
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {formatCurrency(venta.total)}
            </Text>
          </View>
        </Card>

        {/* Productos */}
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Productos a devolver
          </Text>

          {venta.detalle.map((d) => {
            const cant = seleccion[d.producto_id] ?? 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const neto = precioNetoUnitario(d as any);
            const tieneDescuento =
              parseFloat((d as any).descuento ?? '0') > 0;

            return (
              <View
                key={d.id}
                style={[
                  styles.productoRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.prodNombre,
                      { color: colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {d.producto_nombre}
                  </Text>
                  <Text
                    style={[styles.prodMeta, { color: colors.textMuted }]}
                  >
                    {formatCurrency(neto)} × {d.cantidad} disp.
                    {tieneDescuento ? ' (con promo)' : ''}
                  </Text>
                </View>

                <View
                  style={[
                    styles.stepper,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() =>
                      setCantidad(d.producto_id, cant - 1, d.cantidad)
                    }
                    style={({ pressed }) => [
                      styles.stepBtn,
                      pressed
                        ? { backgroundColor: colors.surfacePressed }
                        : null,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={16}
                      color={colors.textPrimary}
                    />
                  </Pressable>
                  <Text
                    style={[styles.stepValue, { color: colors.textPrimary }]}
                  >
                    {cant}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setCantidad(d.producto_id, cant + 1, d.cantidad)
                    }
                    disabled={cant >= d.cantidad}
                    style={({ pressed }) => [
                      styles.stepBtn,
                      pressed && cant < d.cantidad
                        ? { backgroundColor: colors.surfacePressed }
                        : null,
                      cant >= d.cantidad ? { opacity: 0.4 } : null,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={16}
                      color={colors.textPrimary}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Motivo */}
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Motivo de la devolución
          </Text>
          <Input
            label="Motivo"
            value={motivo}
            onChangeText={setMotivo}
            multiline
            required
          />
        </Card>

        {/* Método */}
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Método de devolución
          </Text>
          <View style={styles.metodosWrap}>
            {(
              [
                'efectivo',
                'transferencia',
                'nota_credito',
                'reposicion',
              ] as MetodoDevolucion[]
            ).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMetodo(m)}
                style={[
                  styles.metodoChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                  metodo === m
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
                    metodo === m
                      ? {
                          color: colors.textInverse,
                          fontFamily: typography.button.fontFamily,
                        }
                      : null,
                  ]}
                >
                  {m === 'nota_credito'
                    ? 'Nota crédito'
                    : m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Resumen */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
              Total a devolver
            </Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
              {formatCurrency(totalSeleccionado)}
            </Text>
          </View>
          <Text style={[styles.totalSub, { color: colors.textMuted }]}>
            {cantidadTotalItems} productos seleccionados
          </Text>
        </Card>
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

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.giant },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    errorText: { ...typography.body },
    section: { marginBottom: spacing.md },
    sectionTitle: { ...typography.h3, marginBottom: spacing.md },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    infoLabel: { ...typography.caption },
    infoValue: { ...typography.bodyBold },
    productoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      gap: spacing.md,
    },
    prodNombre: { ...typography.bodyBold },
    prodMeta: { ...typography.small, marginTop: 2 },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: radius.md,
    },
    stepBtn: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepValue: { ...typography.bodyBold, minWidth: 30, textAlign: 'center' },
    metodosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    metodoChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    metodoLabel: { ...typography.small },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: { ...typography.h3 },
    totalValue: { ...typography.price },
    totalSub: { ...typography.small, marginTop: 4 },
  });