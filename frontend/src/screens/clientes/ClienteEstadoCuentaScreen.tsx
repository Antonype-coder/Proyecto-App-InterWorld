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

import { colors, radius, spacing, typography } from '@theme/index';
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

  const [data, setData] = useState<EstadoCuenta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalPago, setModalPago] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [notasPago, setNotasPago] = useState('');
  const [guardandoPago, setGuardandoPago] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await clientesApi.estadoCuenta(clienteId);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clienteId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  const abrirModalPago = (): void => {
    if (!data) return;
    setMontoPago(String(parseFloat(data.cliente.saldo_deuda).toFixed(0)));
    setMetodoPago('efectivo');
    setNotasPago('');
    setModalPago(true);
  };

  const registrarPago = async (): Promise<void> => {
    const monto = parseFloat(montoPago);
    if (!monto || monto <= 0) {
      setToast({ visible: true, message: 'Monto inválido', variant: 'error' });
      return;
    }
    if (data && monto > parseFloat(data.cliente.saldo_deuda) + 0.01) {
      setToast({ visible: true, message: 'El monto excede la deuda', variant: 'error' });
      return;
    }

    setGuardandoPago(true);
    try {
      await clientesApi.registrarPago(clienteId, {
        monto,
        metodo_pago: metodoPago,
        notas: notasPago.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalPago(false);
      await cargar();
      setToast({ visible: true, message: 'Pago registrado', variant: 'success' });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al registrar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setGuardandoPago(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Topbar onBack={() => navigation.goBack()} />
        <Loader message="Cargando estado de cuenta" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Topbar onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudo cargar"
          description={error ?? 'Cliente no encontrado'}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      </SafeAreaView>
    );
  }

  const { cliente, ventas, pagos } = data;
  const cupo = parseFloat(cliente.cupo_credito);
  const deuda = parseFloat(cliente.saldo_deuda);
  const disponible = Math.max(0, cupo - deuda);
  const usoPct = cupo > 0 ? Math.min(100, (deuda / cupo) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar
        onBack={() => navigation.goBack()}
        onEdit={() =>
          navigation.navigate('ClienteForm', { clienteId })
        }
        onLealtad={() =>
          navigation.navigate('ClienteLealtad', { clienteId })
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void cargar();
            }}
            tintColor={colors.textSecondary}
          />
        }
      >
        <View style={styles.hero}>
          <Avatar nombre={cliente.nombre} size="lg" />
          <Text style={styles.nombre}>{cliente.nombre}</Text>
          {cliente.documento ? (
            <Text style={styles.doc}>Doc: {cliente.documento}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            <Badge
              label={cliente.activo === 1 ? 'Activo' : 'Inactivo'}
              variant={cliente.activo === 1 ? 'success' : 'neutral'}
            />
            {deuda > 0 ? <Badge label="Con deuda" variant="danger" /> : null}
          </View>
        </View>

        <Card variant="default" style={styles.section}>
          <View style={styles.deudaHeader}>
            <View>
              <Text style={styles.cardLabel}>Deuda actual</Text>
              <Text
                style={[
                  styles.deudaValue,
                  { color: deuda > 0 ? colors.danger : colors.success },
                ]}
              >
                {formatCurrency(deuda)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardLabel}>Disponible</Text>
              <Text style={styles.disponibleValue}>
                {formatCurrency(disponible)}
              </Text>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${usoPct}%`,
                  backgroundColor:
                    usoPct > 80
                      ? colors.danger
                      : usoPct > 50
                        ? colors.warning
                        : colors.success,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {usoPct.toFixed(0)}% de {formatCurrency(cupo)} utilizado
          </Text>
        </Card>

        {deuda > 0 ? (
          <Button
            label="Registrar pago"
            icon="cash-plus"
            onPress={abrirModalPago}
            fullWidth
            variant="primary"
            size="lg"
          />
        ) : null}

        <Text style={styles.sectionLabel}>
          VENTAS A CRÉDITO ({ventas.length})
        </Text>
        {ventas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Sin ventas a crédito</Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            {ventas.map((v, idx) => (
              <Pressable
                key={v.id}
                onPress={() =>
                  navigation.getParent()?.navigate(
                    'Ventas',
                    {
                      screen: 'VentaDetalle',
                      params: { ventaId: v.id },
                    },
                  )
                }
                style={({ pressed }) => [
                  styles.movRow,
                  idx === ventas.length - 1 ? styles.movRowLast : null,
                  pressed ? styles.movRowPressed : null,
                ]}
              >
                <View
                  style={[
                    styles.movIcon,
                    { backgroundColor: colors.warningSubtle },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="receipt"
                    size={16}
                    color={colors.warning}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movTitulo}>{v.numero}</Text>
                  <Text style={styles.movSub}>
                    {formatDateTime(v.created_at)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.movMonto}>
                    {formatCurrency(v.total)}
                  </Text>
                  <Badge
                    label={v.estado === 'anulada' ? 'Anulada' : 'Válida'}
                    variant={v.estado === 'anulada' ? 'danger' : 'neutral'}
                    size="sm"
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>PAGOS ({pagos.length})</Text>
        {pagos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Sin pagos registrados</Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            {pagos.map((p, idx) => (
              <View
                key={p.id}
                style={[
                  styles.movRow,
                  idx === pagos.length - 1 ? styles.movRowLast : null,
                ]}
              >
                <View
                  style={[
                    styles.movIcon,
                    { backgroundColor: colors.successSubtle },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={16}
                    color={colors.success}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.movTitulo}>
                    {formatCurrency(p.monto)}
                  </Text>
                  <Text style={styles.movSub}>
                    {p.metodo_pago} · {formatDateTime(p.created_at)}
                  </Text>
                  {p.notas ? (
                    <Text style={styles.movNotas} numberOfLines={1}>
                      {p.notas}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalPago}
        onClose={() => setModalPago(false)}
        title="Registrar pago"
      >
        <Text style={styles.modalTexto}>
          Deuda actual:{' '}
          <Text
            style={{
              color: colors.danger,
              fontFamily: typography.button.fontFamily,
            }}
          >
            {formatCurrency(deuda)}
          </Text>
        </Text>

        <FormattedNumberInput
          label="Monto"
          placeholder="0"
          icon="currency-usd"
          value={montoPago}
          onChangeText={setMontoPago}
          required
        />

        <Text style={styles.subLabel}>Método de pago</Text>
        <View style={styles.metodosRow}>
          <MetodoChip
            label="Efectivo"
            active={metodoPago === 'efectivo'}
            onPress={() => setMetodoPago('efectivo')}
          />
          <MetodoChip
            label="Transferencia"
            active={metodoPago === 'transferencia'}
            onPress={() => setMetodoPago('transferencia')}
          />
          <MetodoChip
            label="Tarjeta"
            active={metodoPago === 'tarjeta'}
            onPress={() => setMetodoPago('tarjeta')}
          />
        </View>

        <Input
          label="Notas"
          placeholder="Opcional"
          value={notasPago}
          onChangeText={setNotasPago}
          multiline
        />

        <Button
          label="Registrar pago"
          onPress={registrarPago}
          loading={guardandoPago}
          disabled={guardandoPago}
          fullWidth
          variant="primary"
        />
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

function Topbar(props: {
  onBack: () => void;
  onEdit?: () => void;
  onLealtad?: () => void;
}): React.ReactElement {
  return (
    <View style={styles.topbar}>
      <Pressable onPress={props.onBack} hitSlop={10} style={styles.backBtn}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={20}
          color={colors.textPrimary}
        />
      </Pressable>
      <Text style={styles.topbarTitle}>Estado de cuenta</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {props.onLealtad ? (
          <Pressable
            onPress={props.onLealtad}
            hitSlop={10}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons
              name="crown-outline"
              size={18}
              color={colors.accent}
            />
          </Pressable>
        ) : null}
        {props.onEdit ? (
          <Pressable
            onPress={props.onEdit}
            hitSlop={10}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color={colors.textPrimary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MetodoChip(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.metodoChip,
        props.active ? styles.metodoChipActive : null,
      ]}
    >
      <Text
        style={[
          styles.metodoLabel,
          props.active ? styles.metodoLabelActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: { ...typography.h3, color: colors.textPrimary },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  nombre: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  doc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  section: { marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  cardLabel: { ...typography.small, color: colors.textMuted },
  deudaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  deudaValue: { ...typography.price, marginTop: 4 },
  disponibleValue: {
    ...typography.price,
    color: colors.textPrimary,
    marginTop: 4,
  },
  progressWrap: {
    height: 6,
    backgroundColor: colors.bgSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
  listBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  movRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  movRowLast: { borderBottomWidth: 0 },
  movRowPressed: { backgroundColor: colors.surfacePressed },
  movIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  movTitulo: { ...typography.bodyBold, color: colors.textPrimary },
  movSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  movNotas: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  movMonto: { ...typography.bodyBold, color: colors.textPrimary },
  modalTexto: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  subLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metodosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metodoChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  metodoChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metodoLabel: { ...typography.small, color: colors.textSecondary },
  metodoLabelActive: {
    color: colors.textInverse,
    fontFamily: typography.button.fontFamily,
  },
});