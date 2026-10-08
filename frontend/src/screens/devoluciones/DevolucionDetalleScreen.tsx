import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { devolucionesApi } from '@api/index';
import type { Devolucion, VentasStackParamList } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Badge from '@components/ui/Badge';
import Loader from '@components/ui/Loader';

type Params = RouteProp<VentasStackParamList, 'DevolucionDetalle'>;

export default function DevolucionDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const devolucionId = route.params.devolucionId;
  const colors = useColors();
  const [dev, setDev] = useState<Devolucion | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await devolucionesApi.obtener(devolucionId);
          setDev(res);
        } finally { setLoading(false); }
      })();
    }, [devolucionId]),
  );

  if (loading || !dev) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopBar title="Devolución" onBack={() => navigation.goBack()} />
        <Loader message="Cargando..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <TopBar title="Devolución" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: colors.warningSubtle }]}>
            <MaterialCommunityIcons name="keyboard-return" size={32} color={colors.warning} />
          </View>
          <Text style={[styles.numero, { color: colors.textPrimary }]}>{dev.numero}</Text>
          <Text style={[styles.fecha, { color: colors.textMuted }]}>{formatDateTime(dev.created_at)}</Text>
          <View style={styles.badgeRow}>
            <Badge label={dev.tipo === 'total' ? 'Total' : 'Parcial'} variant={dev.tipo === 'total' ? 'warning' : 'info'} />
            <Badge label={dev.estado === 'completada' ? 'Completada' : 'Anulada'} variant={dev.estado === 'completada' ? 'success' : 'danger'} />
          </View>
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Información</Text>
          <Row label="Venta original" value={dev.venta_numero} />
          <Row label="Cliente" value={dev.cliente_nombre ?? 'Consumidor final'} />
          <Row label="Registrado por" value={dev.usuario_nombre} />
          <Row label="Método" value={dev.metodo_devolucion} />
          <Row label="Motivo" value={dev.motivo} />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Productos devueltos ({dev.detalle.length})</Text>
          {dev.detalle.map((d, idx) => (
            <View key={d.id} style={[styles.detRow, { borderTopColor: colors.border }, idx === dev.detalle.length - 1 ? styles.detRowLast : null]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detNombre, { color: colors.textPrimary }]} numberOfLines={1}>{d.producto_nombre}</Text>
                <Text style={[styles.detSub, { color: colors.textMuted }]}>{formatCurrency(d.precio_unitario)} × {d.cantidad}</Text>
              </View>
              <Text style={[styles.detTotal, { color: colors.textPrimary }]}>{formatCurrency(d.subtotal)}</Text>
            </View>
          ))}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total devuelto</Text>
            <Text style={[styles.totalValue, { color: colors.warning }]}>{formatCurrency(dev.monto_devuelto)}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row(props: { label: string; value: string }): React.ReactElement {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{props.label}</Text>
      <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  iconWrap: {
    width: 64, height: 64, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  numero: { ...typography.h2 },
  fecha: { ...typography.caption, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1 },
  rowLabel: { ...typography.caption },
  rowValue: { ...typography.body, flex: 1, textAlign: 'right' },
  detRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1 },
  detRowLast: { borderBottomWidth: 0 },
  detNombre: { ...typography.body },
  detSub: { ...typography.small, marginTop: 2 },
  detTotal: { ...typography.bodyBold },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.h3 },
  totalValue: { ...typography.price },
});