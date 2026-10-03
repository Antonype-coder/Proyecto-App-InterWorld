import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
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

  useFocusEffect(useCallback(() => { void cargar(); }, [cargar]));

  const enviar = async (): Promise<void> => {
    Alert.alert('Enviar orden', 'La orden pasará a estado "Enviada".', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar',
        onPress: async () => {
          try {
            await ordenesCompraApi.cambiarEstado(ocId, 'enviada');
            await cargar();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Error');
          }
        },
      },
    ]);
  };

  const cancelar = async (): Promise<void> => {
    Alert.alert('Cancelar orden', 'La orden quedará cancelada.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar orden',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordenesCompraApi.cambiarEstado(ocId, 'cancelada');
            await cargar();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Error');
          }
        },
      },
    ]);
  };

  const recibir = async (): Promise<void> => {
    if (!oc) return;
    const recepArray = Object.entries(recepciones)
      .filter(([_, c]) => c > 0)
      .map(([id, c]) => ({ detalle_id: Number(id), cantidad: c }));

    if (recepArray.length === 0) {
      Alert.alert('Error', 'Indica al menos una cantidad a recibir.');
      return;
    }

    setProcesando(true);
    try {
      await ordenesCompraApi.recibir(ocId, recepArray);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await cargar();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al recibir');
    } finally {
      setProcesando(false);
    }
  };

  if (loading || !oc) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopBar title="Orden de compra" onBack={() => navigation.goBack()} />
        <Loader message="Cargando..." />
      </SafeAreaView>
    );
  }

  const puedeRecibir = oc.estado === 'enviada' || oc.estado === 'recibida_parcial' || oc.estado === 'borrador';
  const puedeEnviar = oc.estado === 'borrador';
  const puedeCancelar = oc.estado !== 'recibida' && oc.estado !== 'cancelada';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Orden de compra" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.numero}>{oc.numero}</Text>
          <Text style={styles.fecha}>{formatDate(oc.created_at)}</Text>
          <Badge
            label={oc.estado.toUpperCase()}
            variant={
              oc.estado === 'recibida' ? 'success'
              : oc.estado === 'cancelada' ? 'danger'
              : oc.estado === 'recibida_parcial' ? 'warning'
              : oc.estado === 'enviada' ? 'info'
              : 'neutral'
            }
          />
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Proveedor</Text>
          <Text style={styles.proveedorNombre}>{oc.proveedor_nombre}</Text>
          {oc.proveedor_contacto ? <Text style={styles.infoSmall}>{oc.proveedor_contacto}</Text> : null}
          {oc.proveedor_email ? <Text style={styles.infoSmall}>{oc.proveedor_email}</Text> : null}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Productos ({oc.detalle.length})</Text>
          {oc.detalle.map((d, idx) => {
            const pendiente = d.cantidad - d.cantidad_recibida;
            return (
              <View key={d.id} style={[styles.itemRow, idx === oc.detalle.length - 1 ? styles.itemRowLast : null]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNombre} numberOfLines={1}>{d.producto_nombre}</Text>
                  <Text style={styles.itemSub}>
                    {d.cantidad} × {formatCurrency(d.precio_unitario)} · Recibido: {d.cantidad_recibida}/{d.cantidad}
                  </Text>
                </View>
                {puedeRecibir && pendiente > 0 ? (
                  <TextInput
                    style={styles.recibirInput}
                    keyboardType="numeric"
                    value={String(recepciones[d.id] ?? 0)}
                    onChangeText={(t) => setRecepciones((p) => ({ ...p, [d.id]: parseInt(t) || 0 }))}
                  />
                ) : (
                  <Text style={styles.itemTotal}>{formatCurrency(d.subtotal)}</Text>
                )}
              </View>
            );
          })}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(oc.total)}</Text>
          </View>
        </Card>

        {puedeEnviar ? (
          <View style={{ marginBottom: spacing.md }}>
            <Button label="Marcar como enviada" onPress={enviar} variant="outline" icon="send" fullWidth />
          </View>
        ) : null}

        {puedeRecibir ? (
          <View style={{ marginBottom: spacing.md }}>
            <Button label="Recibir mercancía" onPress={recibir} loading={procesando} disabled={procesando} variant="primary" icon="package-down" fullWidth />
          </View>
        ) : null}

        {puedeCancelar ? (
          <Button label="Cancelar orden" onPress={cancelar} variant="danger" icon="close-circle-outline" fullWidth />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  numero: { ...typography.h2, color: colors.textPrimary },
  fecha: { ...typography.caption, color: colors.textMuted },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  proveedorNombre: { ...typography.bodyBold, color: colors.textPrimary },
  infoSmall: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  itemRowLast: { borderBottomWidth: 0 },
  itemNombre: { ...typography.bodyBold, color: colors.textPrimary },
  itemSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  itemTotal: { ...typography.bodyBold, color: colors.textPrimary },
  recibirInput: {
    width: 60, backgroundColor: colors.bgSubtle, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    ...typography.body, color: colors.textPrimary, textAlign: 'center',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.h3, color: colors.textPrimary },
  totalValue: { ...typography.price, color: colors.textPrimary },
});