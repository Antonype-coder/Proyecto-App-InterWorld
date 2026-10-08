import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useReturnTo, useSmartBack } from '@hooks/useReturnTo';
import { clientesApi } from '@api/index';
import type { EstadoCuenta, ClientesStackParamList } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Loader from '@components/ui/Loader';
import EmptyState from '@components/ui/EmptyState';
import Modal from '@components/ui/Modal';
import Input from '@components/ui/Input';
import FormattedNumberInput from '@components/forms/FormattedNumberInput';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<ClientesStackParamList, 'ClienteEstadoCuenta'>;

export default function ClienteEstadoCuentaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const clienteId = route.params.clienteId;
  const colors = useColors();
  const goTo = useReturnTo();
  const goBack = useSmartBack();

  const [data, setData] = useState<EstadoCuenta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalPago, setModalPago] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [notasPago, setNotasPago] = useState('');
  const [guardandoPago, setGuardandoPago] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: ToastVariant }>({
    visible: false, message: '', variant: 'info',
  });

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await clientesApi.estadoCuenta(clienteId);
      setData(res);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al cargar'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [clienteId]);

  useFocusEffect(useCallback(() => { setLoading(true); void cargar(); }, [cargar]));

  const abrirModalPago = (): void => {
    if (!data) return;
    setMontoPago(String(parseFloat(data.cliente.saldo_deuda).toFixed(0)));
    setMetodoPago('efectivo');
    setNotasPago('');
    setModalPago(true);
  };

  const registrarPago = async (): Promise<void> => {
    const monto = parseFloat(montoPago);
    if (!monto || monto <= 0) { setToast({ visible: true, message: 'Monto inválido', variant: 'error' }); return; }
    if (data && monto > parseFloat(data.cliente.saldo_deuda) + 0.01) {
      setToast({ visible: true, message: 'El monto excede la deuda', variant: 'error' }); return;
    }
    setGuardandoPago(true);
    try {
      await clientesApi.registrarPago(clienteId, {
        monto, metodo_pago: metodoPago, notas: notasPago.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalPago(false);
      await cargar();
      setToast({ visible: true, message: 'Pago registrado', variant: 'success' });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al registrar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally { setGuardandoPago(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <Topbar onBack={goBack} />
        <Loader message="Cargando estado de cuenta" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <Topbar onBack={goBack} />
        <EmptyState icon="alert-circle-outline" title="No se pudo cargar" description={error ?? 'Cliente no encontrado'} actionLabel="Reintentar" onAction={cargar} />
      </SafeAreaView>
    );
  }

  const { cliente, ventas, pagos } = data;
  const cupo = parseFloat(cliente.cupo_credito);
  const deuda = parseFloat(cliente.saldo_deuda);
  const disponible = Math.max(0, cupo - deuda);
  const usoPct = cupo > 0 ? Math.min(100, (deuda / cupo) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Topbar
        onBack={goBack}
        onEdit={() => navigation.navigate('ClienteForm', { clienteId })}
        onLealtad={() => navigation.navigate('ClienteLealtad', { clienteId })}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void cargar(); }} tintColor={colors.textSecondary} />}
      >
        <View style={styles.hero}>
          <Avatar nombre={cliente.nombre} size="lg" />
          <Text style={[styles.nombre, { color: colors.textPrimary }]}>{cliente.nombre}</Text>
          {cliente.documento ? <Text style={[styles.doc, { color: colors.textMuted }]}>Doc: {cliente.documento}</Text> : null}
          <View style={styles.badgeRow}>
            <Badge label={cliente.activo === 1 ? 'Activo' : 'Inactivo'} variant={cliente.activo === 1 ? 'success' : 'neutral'} />
            {deuda > 0 ? <Badge label="Con deuda" variant="danger" /> : null}
          </View>
        </View>

        <Card variant="default" style={styles.section}>
          <View style={styles.deudaHeader}>
            <View>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Deuda actual</Text>
              <Text style={[styles.deudaValue, { color: deuda > 0 ? colors.danger : colors.success }]}>
                {formatCurrency(deuda)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Disponible</Text>
              <Text style={[styles.disponibleValue, { color: colors.textPrimary }]}>{formatCurrency(disponible)}</Text>
            </View>
          </View>

          <View style={[styles.progressWrap, { backgroundColor: colors.bgSubtle }]}>
            <View style={[styles.progressFill, {
              width: `${usoPct}%`,
              backgroundColor: usoPct > 80 ? colors.danger : usoPct > 50 ? colors.warning : colors.success,
            }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
            {usoPct.toFixed(0)}% de {formatCurrency(cupo)} utilizado
          </Text>
        </Card>

        {deuda > 0 ? (
          <Button label="Registrar pago" icon="cash-plus" onPress={abrirModalPago} fullWidth variant="primary" size="lg" />
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>VENTAS A CRÉDITO ({ventas.length})</Text>
        {ventas.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sin ventas a crédito</Text>
          </View>
        ) : (
          <View style={[styles.listBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {ventas.map((v, idx) => (
              <Pressable
                key={v.id}
                onPress={() => goTo('Ventas', 'VentaDetalle', { ventaId: v.id })}
                style={({ pressed }) => [
                  styles.movRow,
                  { borderBottomColor: colors.border },
                  idx === ventas.length - 1 ? styles.movRowLast : null,
                  pressed ? { backgroundColor: colors.surfacePressed } : null,
                ]}
              >
                <View style={[styles.movIcon, { backgroundColor: colors.warningSubtle }]}>
                  <MaterialCommunityIcons name="receipt" size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.movTitulo, { color: colors.textPrimary }]}>{v.numero}</Text>
                  <Text style={[styles.movSub, { color: colors.textMuted }]}>{formatDateTime(v.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.movMonto, { color: colors.textPrimary }]}>{formatCurrency(v.total)}</Text>
                  <Badge label={v.estado === 'anulada' ? 'Anulada' : 'Válida'} variant={v.estado === 'anulada' ? 'danger' : 'neutral'} size="sm" />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PAGOS ({pagos.length})</Text>
        {pagos.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sin pagos registrados</Text>
          </View>
        ) : (
          <View style={[styles.listBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {pagos.map((p, idx) => (
              <View key={p.id} style={[styles.movRow, { borderBottomColor: colors.border }, idx === pagos.length - 1 ? styles.movRowLast : null]}>
                <View style={[styles.movIcon, { backgroundColor: colors.successSubtle }]}>
                  <MaterialCommunityIcons name="cash-check" size={16} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.movTitulo, { color: colors.textPrimary }]}>{formatCurrency(p.monto)}</Text>
                  <Text style={[styles.movSub, { color: colors.textMuted }]}>{p.metodo_pago} · {formatDateTime(p.created_at)}</Text>
                  {p.notas ? <Text style={[styles.movNotas, { color: colors.textSecondary }]} numberOfLines={1}>{p.notas}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalPago} onClose={() => setModalPago(false)} title="Registrar pago">
        <Text style={[styles.modalTexto, { color: colors.textSecondary }]}>
          Deuda actual: <Text style={{ color: colors.danger, fontFamily: typography.button.fontFamily }}>{formatCurrency(deuda)}</Text>
        </Text>
        <FormattedNumberInput label="Monto" placeholder="0" icon="currency-usd" value={montoPago} onChangeText={setMontoPago} required />
        <Text style={[styles.subLabel, { color: colors.textPrimary }]}>Método de pago</Text>
        <View style={styles.metodosRow}>
          <MetodoChip label="Efectivo" active={metodoPago === 'efectivo'} onPress={() => setMetodoPago('efectivo')} />
          <MetodoChip label="Transferencia" active={metodoPago === 'transferencia'} onPress={() => setMetodoPago('transferencia')} />
          <MetodoChip label="Tarjeta" active={metodoPago === 'tarjeta'} onPress={() => setMetodoPago('tarjeta')} />
        </View>
        <Input label="Notas" placeholder="Opcional" value={notasPago} onChangeText={setNotasPago} multiline />
        <Button label="Registrar pago" onPress={registrarPago} loading={guardandoPago} disabled={guardandoPago} fullWidth variant="primary" />
      </Modal>

      <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast((t) => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

function Topbar(props: { onBack: () => void; onEdit?: () => void; onLealtad?: () => void }): React.ReactElement {
  const colors = useColors();
  return (
    <View style={[styles.topbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable onPress={props.onBack} hitSlop={10} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
      </Pressable>
      <Text style={[styles.topbarTitle, { color: colors.textPrimary }]}>Estado de cuenta</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {props.onLealtad ? (
          <Pressable onPress={props.onLealtad} hitSlop={10} style={styles.backBtn}>
            <MaterialCommunityIcons name="crown-outline" size={18} color={colors.accent} />
          </Pressable>
        ) : null}
        {props.onEdit ? (
          <Pressable onPress={props.onEdit} hitSlop={10} style={styles.backBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MetodoChip(props: { label: string; active: boolean; onPress: () => void }): React.ReactElement {
  const colors = useColors();
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.metodoChip,
        { backgroundColor: colors.surface, borderColor: colors.border },
        props.active ? { backgroundColor: colors.primary, borderColor: colors.primary } : null,
      ]}
    >
      <Text style={[
        styles.metodoLabel,
        { color: colors.textSecondary },
        props.active ? { color: colors.textInverse, fontFamily: typography.button.fontFamily } : null,
      ]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { ...typography.h3 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  nombre: { ...typography.h2, marginTop: spacing.md, textAlign: 'center' },
  doc: { ...typography.caption, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionLabel: { ...typography.overline, marginTop: spacing.xl, marginBottom: spacing.md },
  cardLabel: { ...typography.small },
  deudaHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  deudaValue: { ...typography.price, marginTop: 4 },
  disponibleValue: { ...typography.price, marginTop: 4 },
  progressWrap: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { ...typography.small, marginTop: spacing.sm },
  emptyBox: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.caption },
  listBox: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  movRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  movRowLast: { borderBottomWidth: 0 },
  movIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  movTitulo: { ...typography.bodyBold },
  movSub: { ...typography.small, marginTop: 2 },
  movNotas: { ...typography.small, marginTop: 2 },
  movMonto: { ...typography.bodyBold },
  modalTexto: { ...typography.body, marginBottom: spacing.lg },
  subLabel: { ...typography.bodyBold, marginBottom: spacing.sm },
  metodosRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  metodoChip: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1,
  },
  metodoLabel: { ...typography.small },
});