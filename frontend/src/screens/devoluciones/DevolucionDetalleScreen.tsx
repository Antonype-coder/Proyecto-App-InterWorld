import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
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
  const [dev, setDev] = useState<Devolucion | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await devolucionesApi.obtener(devolucionId);
          setDev(res);
        } finally {
          setLoading(false);
        }
      })();
    }, [devolucionId]),
  );

  if (loading || !dev) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopBar title="Devolución" onBack={() => navigation.goBack()} />
        <Loader message="Cargando..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Devolución" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="keyboard-return" size={32} color={colors.warning} />
          </View>
          <Text style={styles.numero}>{dev.numero}</Text>
          <Text style={styles.fecha}>{formatDateTime(dev.created_at)}</Text>
          <View style={styles.badgeRow}>
            <Badge label={dev.tipo === 'total' ? 'Total' : 'Parcial'} variant={dev.tipo === 'total' ? 'warning' : 'info'} />
            <Badge label={dev.estado === 'completada' ? 'Completada' : 'Anulada'} variant={dev.estado === 'completada' ? 'success' : 'danger'} />
          </View>
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <Row label="Venta original" value={dev.venta_numero} />
          <Row label="Cliente" value={dev.cliente_nombre ?? 'Consumidor final'} />
          <Row label="Registrado por" value={dev.usuario_nombre} />
          <Row label="Método" value={dev.metodo_devolucion} />
          <Row label="Motivo" value={dev.motivo} />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Productos devueltos ({dev.detalle.length})</Text>
          {dev.detalle.map((d, idx) => (
            <View
              key={d.id}
              style={[styles.detRow, idx === dev.detalle.length - 1 ? styles.detRowLast : null]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.detNombre} numberOfLines={1}>{d.producto_nombre}</Text>
                <Text style={styles.detSub}>{formatCurrency(d.precio_unitario)} × {d.cantidad}</Text>
              </View>
              <Text style={styles.detTotal}>{formatCurrency(d.subtotal)}</Text>
            </View>
          ))}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total devuelto</Text>
            <Text style={styles.totalValue}>{formatCurrency(dev.monto_devuelto)}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row(props: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{props.label}</Text>
      <Text style={styles.rowValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  iconWrap: {
    width: 64, height: 64, borderRadius: radius.xl,
    backgroundColor: colors.warningSubtle, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  numero: { ...typography.h2, color: colors.textPrimary },
  fecha: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { ...typography.caption, color: colors.textMuted },
  rowValue: { ...typography.body, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  detRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  detRowLast: { borderBottomWidth: 0 },
  detNombre: { ...typography.body, color: colors.textPrimary },
  detSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  detTotal: { ...typography.bodyBold, color: colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.h3, color: colors.textPrimary },
  totalValue: { ...typography.price, color: colors.warning },
});