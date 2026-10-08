import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useConfirm } from '@components/feedback/ConfirmProvider';
import { useUIStore } from '@store/uiStore';
import { ordenesCompraApi } from '@api/index';
import type { OrdenCompra, MasStackParamList } from '@tipos/index';
import { formatCurrency, formatDate } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Loader from '@components/ui/Loader';

type Params = RouteProp<MasStackParamList, 'OrdenCompraDetalle'>;

export default function OrdenCompraDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const ocId = route.params.ocId;
  const colors = useColors();
  const confirm = useConfirm();
  const showToast = useUIStore((s) => s.showToast);

  const [oc, setOc] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [recepciones, setRecepciones] = useState<Record<number, number>>({});
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const res = await ordenesCompraApi.obtener(ocId);
      setOc(res);
      const init: Record<number, number> = {};
      res.detalle.forEach((d) => {
        init[d.id] = d.cantidad - d.cantidad_recibida;
      });
      setRecepciones(init);
    } finally {
      setLoading(false);
    }
  }, [ocId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const enviar = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Enviar orden',
      message: 'La orden pasará a estado "Enviada" al proveedor.',
      confirmLabel: 'Enviar',
      variant: 'info',
    });
    if (!ok) return;
    try {
      await ordenesCompraApi.cambiarEstado(ocId, 'enviada');
      showToast('Orden enviada.', 'success');
      await cargar();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const cancelar = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Cancelar orden',
      message:
        'La orden quedará cancelada y no se podrá reactivar. Esta acción no se puede deshacer.',
      confirmLabel: 'Cancelar orden',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await ordenesCompraApi.cambiarEstado(ocId, 'cancelada');
      showToast('Orden cancelada.', 'success');
      await cargar();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const recibir = async (): Promise<void> => {
    if (!oc) return;
    const recepArray = Object.entries(recepciones)
      .filter(([_, c]) => c > 0)
      .map(([id, c]) => ({ detalle_id: Number(id), cantidad: c }));
    if (recepArray.length === 0) {
      showToast('Indica al menos una cantidad a recibir.', 'error');
      return;
    }
    setProcesando(true);
    try {
      await ordenesCompraApi.recibir(ocId, recepArray);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast('Mercancía recibida.', 'success');
      await cargar();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e instanceof Error ? e.message : 'Error al recibir', 'error');
    } finally {
      setProcesando(false);
    }
  };

  if (loading || !oc) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <TopBar title="Orden de compra" onBack={() => navigation.goBack()} />
        <Loader message="Cargando..." />
      </SafeAreaView>
    );
  }

  const puedeRecibir =
    oc.estado === 'enviada' ||
    oc.estado === 'recibida_parcial' ||
    oc.estado === 'borrador';
  const puedeEnviar = oc.estado === 'borrador';
  const puedeCancelar = oc.estado !== 'recibida' && oc.estado !== 'cancelada';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar title="Orden de compra" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.numero, { color: colors.textPrimary }]}>
            {oc.numero}
          </Text>
          <Text style={[styles.fecha, { color: colors.textMuted }]}>
            {formatDate(oc.created_at)}
          </Text>
          <Badge
            label={oc.estado.toUpperCase()}
            variant={
              oc.estado === 'recibida'
                ? 'success'
                : oc.estado === 'cancelada'
                  ? 'danger'
                  : oc.estado === 'recibida_parcial'
                    ? 'warning'
                    : oc.estado === 'enviada'
                      ? 'info'
                      : 'neutral'
            }
          />
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Proveedor
          </Text>
          <Text
            style={[styles.proveedorNombre, { color: colors.textPrimary }]}
          >
            {oc.proveedor_nombre}
          </Text>
          {oc.proveedor_contacto ? (
            <Text style={[styles.infoSmall, { color: colors.textMuted }]}>
              {oc.proveedor_contacto}
            </Text>
          ) : null}
          {oc.proveedor_email ? (
            <Text style={[styles.infoSmall, { color: colors.textMuted }]}>
              {oc.proveedor_email}
            </Text>
          ) : null}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Productos ({oc.detalle.length})
          </Text>
          {oc.detalle.map((d, idx) => {
            const pendiente = d.cantidad - d.cantidad_recibida;
            return (
              <View
                key={d.id}
                style={[
                  styles.itemRow,
                  { borderTopColor: colors.border },
                  idx === oc.detalle.length - 1 ? styles.itemRowLast : null,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.itemNombre, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {d.producto_nombre}
                  </Text>
                  <Text
                    style={[styles.itemSub, { color: colors.textMuted }]}
                  >
                    {d.cantidad} × {formatCurrency(d.precio_unitario)} ·
                    Recibido: {d.cantidad_recibida}/{d.cantidad}
                  </Text>
                </View>
                {puedeRecibir && pendiente > 0 ? (
                  <TextInput
                    style={[
                      styles.recibirInput,
                      {
                        backgroundColor: colors.bgSubtle,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    keyboardType="numeric"
                    value={String(recepciones[d.id] ?? 0)}
                    onChangeText={(t) =>
                      setRecepciones((p) => ({
                        ...p,
                        [d.id]: parseInt(t) || 0,
                      }))
                    }
                  />
                ) : (
                  <Text
                    style={[styles.itemTotal, { color: colors.textPrimary }]}
                  >
                    {formatCurrency(d.subtotal)}
                  </Text>
                )}
              </View>
            );
          })}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
              {formatCurrency(oc.total)}
            </Text>
          </View>
        </Card>

        {puedeEnviar ? (
          <View style={{ marginBottom: spacing.md }}>
            <Button
              label="Marcar como enviada"
              onPress={() => {
                void enviar();
              }}
              variant="outline"
              icon="send"
              fullWidth
            />
          </View>
        ) : null}

        {puedeRecibir ? (
          <View style={{ marginBottom: spacing.md }}>
            <Button
              label="Recibir mercancía"
              onPress={() => {
                void recibir();
              }}
              loading={procesando}
              disabled={procesando}
              variant="primary"
              icon="package-down"
              fullWidth
            />
          </View>
        ) : null}

        {puedeCancelar ? (
          <Button
            label="Cancelar orden"
            onPress={() => {
              void cancelar();
            }}
            variant="danger"
            icon="close-circle-outline"
            fullWidth
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  numero: { ...typography.h2 },
  fecha: { ...typography.caption },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  proveedorNombre: { ...typography.bodyBold },
  infoSmall: { ...typography.small, marginTop: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  itemRowLast: { borderBottomWidth: 0 },
  itemNombre: { ...typography.bodyBold },
  itemSub: { ...typography.small, marginTop: 2 },
  itemTotal: { ...typography.bodyBold },
  recibirInput: {
    width: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    ...typography.body,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { ...typography.h3 },
  totalValue: { ...typography.price },
});