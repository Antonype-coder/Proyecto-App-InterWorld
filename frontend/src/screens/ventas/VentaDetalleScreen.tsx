import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
import { ventasApi } from '@api/index';
import { useAuthStore } from '@store/authStore';
import type { Venta, VentasStackParamList } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Loader from '@components/ui/Loader';
import EmptyState from '@components/ui/EmptyState';
import Modal from '@components/ui/Modal';
import Input from '@components/ui/Input';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';
import TopBar from '@components/layout/TopBar';

type Params = RouteProp<VentasStackParamList, 'VentaDetalle'>;

export default function VentaDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const ventaId = route.params.ventaId;

  const user = useAuthStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAnular, setModalAnular] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const cargar = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const v = await ventasApi.obtener(ventaId);
      setVenta(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar venta');
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const anular = async (): Promise<void> => {
    if (motivo.trim().length < 3) {
      setToast({
        visible: true,
        message: 'El motivo es obligatorio',
        variant: 'error',
      });
      return;
    }
    setAnulando(true);
    try {
      await ventasApi.anular(ventaId, motivo.trim());
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      setModalAnular(false);
      setMotivo('');
      await cargar();
      setToast({
        visible: true,
        message: 'Venta anulada',
        variant: 'success',
      });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al anular';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setAnulando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Topbar onBack={() => navigation.goBack()} />
        <Loader message="Cargando venta" />
      </SafeAreaView>
    );
  }

  if (error || !venta) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Topbar onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudo cargar"
          description={error ?? 'Venta no encontrada'}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      </SafeAreaView>
    );
  }

  const anulada = venta.estado === 'anulada';
  const tieneDescuento = parseFloat(venta.descuento) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="receipt"
              size={28}
              color={colors.textSecondary}
            />
          </View>
          <Text style={styles.numero}>{venta.numero}</Text>
          <Text style={styles.fecha}>
            {formatDateTime(venta.created_at)}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={anulada ? 'Anulada' : 'Completada'}
              variant={anulada ? 'danger' : 'success'}
            />
            <Badge
              label={venta.tipo_pago === 'credito' ? 'Crédito' : 'Contado'}
              variant={venta.tipo_pago === 'credito' ? 'warning' : 'neutral'}
            />
          </View>
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <InfoRow
            icon="account-outline"
            label="Vendedor"
            value={venta.usuario_nombre}
          />
          <InfoRow
            icon="account-group-outline"
            label="Cliente"
            value={venta.cliente_nombre ?? 'Consumidor final'}
          />
          {anulada && venta.anulada_por_nombre ? (
            <InfoRow
              icon="close-circle-outline"
              label="Anulada por"
              value={venta.anulada_por_nombre}
            />
          ) : null}
          {anulada && venta.motivo_anulacion ? (
            <InfoRow
              icon="format-text"
              label="Motivo"
              value={venta.motivo_anulacion}
            />
          ) : null}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>
            Productos ({venta.detalle.length})
          </Text>
          {venta.detalle.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.detalleItem,
                idx === venta.detalle.length - 1
                  ? styles.detalleItemLast
                  : null,
              ]}
            >
              <View style={styles.detalleInfo}>
                <Text style={styles.detalleNombre} numberOfLines={1}>
                  {item.producto_nombre}
                </Text>
                <Text style={styles.detalleSub}>
                  {formatCurrency(item.precio_unitario)} × {item.cantidad}
                </Text>
              </View>
              <Text style={styles.detalleSubtotal}>
                {formatCurrency(item.subtotal)}
              </Text>
            </View>
          ))}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <TotalRow label="Subtotal" value={formatCurrency(venta.subtotal)} />
          {tieneDescuento ? (
            <TotalRow
              label="Descuento"
              value={`-${formatCurrency(venta.descuento)}`}
              valueColor={colors.danger}
            />
          ) : null}
          <View style={styles.divider} />
          <TotalRow
            label="Total"
            value={formatCurrency(venta.total)}
            bold
          />
        </Card>

        {!anulada ? (
          <View style={styles.actionsWrap}>
            <Button
              label="Devolver productos"
              variant="outline"
              icon="keyboard-return"
              onPress={() =>
                navigation.navigate('DevolucionForm', { ventaId })
              }
              fullWidth
            />
          </View>
        ) : null}

        {esAdmin && !anulada ? (
          <Button
            label="Anular venta"
            variant="danger"
            icon="close-circle-outline"
            onPress={() => setModalAnular(true)}
            fullWidth
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={modalAnular}
        onClose={() => setModalAnular(false)}
        title="Anular venta"
      >
        <Text style={styles.modalText}>
          Esta acción repondrá el stock y, si fue a crédito, revertirá la deuda
          del cliente.
        </Text>
        <Input
          label="Motivo"
          value={motivo}
          onChangeText={setMotivo}
          multiline
          required
        />
        <Button
          label="Anular venta"
          onPress={anular}
          loading={anulando}
          disabled={anulando}
          variant="danger"
          fullWidth
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

function Topbar(props: { onBack: () => void }): React.ReactElement {
  return <TopBar title="Detalle de venta" onBack={props.onBack} />;
}

function InfoRow(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={props.icon}
        size={16}
        color={colors.textMuted}
      />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{props.label}</Text>
        <Text style={styles.infoValue}>{props.value}</Text>
      </View>
    </View>
  );
}

function TotalRow(props: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}): React.ReactElement {
  return (
    <View style={styles.totalRow}>
      <Text
        style={[
          styles.totalLabel,
          props.bold ? styles.totalLabelBold : null,
        ]}
      >
        {props.label}
      </Text>
      <Text
        style={[
          styles.totalValue,
          props.bold ? styles.totalValueBold : null,
          props.valueColor ? { color: props.valueColor } : null,
        ]}
      >
        {props.value}
      </Text>
    </View>
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
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  numero: { ...typography.h2, color: colors.textPrimary },
  fecha: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  infoText: { flex: 1 },
  infoLabel: { ...typography.small, color: colors.textMuted },
  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: 2,
  },
  detalleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detalleItemLast: { borderBottomWidth: 0 },
  detalleInfo: { flex: 1 },
  detalleNombre: { ...typography.body, color: colors.textPrimary },
  detalleSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  detalleSubtotal: { ...typography.bodyBold, color: colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: { ...typography.caption, color: colors.textSecondary },
  totalLabelBold: { ...typography.bodyBold, color: colors.textPrimary },
  totalValue: { ...typography.bodyBold, color: colors.textPrimary },
  totalValueBold: { ...typography.price, color: colors.textPrimary },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  modalText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  actionsWrap: {
    marginBottom: spacing.md,
  },
});