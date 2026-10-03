import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
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
        v.detalle.forEach((d) => { init[d.producto_id] = 0; });
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

  const calcularTotal = useCallback((): number => {
    if (!venta) return 0;
    return venta.detalle.reduce((sum, d) => {
      const cant = seleccion[d.producto_id] ?? 0;
      return sum + cant * parseFloat(d.precio_unitario);
    }, 0);
  }, [venta, seleccion]);

  const totalSeleccionado = calcularTotal();
  const cantidadTotalItems = Object.values(seleccion).reduce((s, v) => s + v, 0);

  const onSubmit = async (): Promise<void> => {
    if (cantidadTotalItems === 0) {
      setToast({ visible: true, message: 'Selecciona al menos un producto', variant: 'error' });
      return;
    }
    if (motivo.trim().length < 3) {
      setToast({ visible: true, message: 'Motivo requerido', variant: 'error' });
      return;
    }

    Alert.alert(
      'Confirmar devolución',
      `Se devolverán ${cantidadTotalItems} productos por ${formatCurrency(totalSeleccionado)}.\n\n¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSaving(true);
            try {
              const items = Object.entries(seleccion)
                .filter(([_, c]) => c > 0)
                .map(([pid, c]) => ({ producto_id: Number(pid), cantidad: c }));

              const dev = await devolucionesApi.crear({
                venta_id: ventaId,
                motivo: motivo.trim(),
                metodo_devolucion: metodo,
                items,
              });

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.replace('DevolucionDetalle', { devolucionId: dev.id });
            } catch (e) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              const msg = e instanceof Error ? e.message : 'Error al devolver';
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
      <KeyboardScreen>
        <TopBar title="Nueva devolución" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      </KeyboardScreen>
    );
  }

  if (!venta) {
    return (
      <KeyboardScreen>
        <TopBar title="Nueva devolución" onBack={() => navigation.goBack()} />
        <Text style={{ textAlign: 'center', padding: spacing.xl }}>Venta no encontrada</Text>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen>
      <TopBar title="Nueva devolución" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* Info de la venta */}
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Venta a devolver</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Folio</Text>
            <Text style={styles.infoValue}>{venta.numero}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{venta.cliente_nombre ?? 'Consumidor final'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total original</Text>
            <Text style={styles.infoValue}>{formatCurrency(venta.total)}</Text>
          </View>
        </Card>

        {/* Productos */}
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Productos a devolver</Text>

          {venta.detalle.map((d) => {
            const cant = seleccion[d.producto_id] ?? 0;
            return (
              <View key={d.id} style={styles.productoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodNombre} numberOfLines={1}>{d.producto_nombre}</Text>
                  <Text style={styles.prodMeta}>
                    {formatCurrency(d.precio_unitario)} × {d.cantidad} disp.
                  </Text>
                </View>

                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => setCantidad(d.producto_id, cant - 1, d.cantidad)}
                    style={styles.stepBtn}
                  >
                    <MaterialCommunityIcons name="minus" size={14} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.stepValue}>{cant}</Text>
                  <Pressable
                    onPress={() => setCantidad(d.producto_id, cant + 1, d.cantidad)}
                    style={styles.stepBtn}
                  >
                    <MaterialCommunityIcons name="plus" size={14} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Motivo */}
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo de la devolución</Text>
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
          <Text style={styles.sectionTitle}>Método de devolución</Text>
          <View style={styles.metodosWrap}>
            {(['efectivo', 'transferencia', 'nota_credito', 'reposicion'] as MetodoDevolucion[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMetodo(m)}
                style={[styles.metodoChip, metodo === m ? styles.metodoChipActive : null]}
              >
                <Text style={[styles.metodoLabel, metodo === m ? styles.metodoLabelActive : null]}>
                  {m === 'nota_credito' ? 'Nota crédito' : m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Resumen */}
        <Card variant="elevated" style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a devolver</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalSeleccionado)}</Text>
          </View>
          <Text style={styles.totalSub}>{cantidadTotalItems} productos seleccionados</Text>
        </Card>

        <Button
          label="Registrar devolución"
          onPress={onSubmit}
          loading={saving}
          disabled={saving || cantidadTotalItems === 0}
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
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.bodyBold, color: colors.textPrimary },
  productoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  prodNombre: { ...typography.bodyBold, color: colors.textPrimary },
  prodMeta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  stepBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepValue: { ...typography.bodyBold, minWidth: 26, textAlign: 'center' },
  metodosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metodoChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  metodoChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  metodoLabel: { ...typography.small, color: colors.textSecondary },
  metodoLabelActive: { color: colors.textInverse, fontFamily: typography.button.fontFamily },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.h3, color: colors.textPrimary },
  totalValue: { ...typography.price, color: colors.textPrimary },
  totalSub: { ...typography.small, color: colors.textMuted, marginTop: 4 },
});