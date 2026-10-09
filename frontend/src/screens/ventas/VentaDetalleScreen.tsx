import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
import { useConfirm } from '@components/feedback/ConfirmProvider';
import { useUIStore } from '@store/uiStore';
import { ventasApi } from '@api/index';
import { useAuthStore } from '@store/authStore';
import type { Venta, VentasStackParamList } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Loader from '@components/ui/Loader';
import ErrorState from '@components/feedback/ErrorState';
import Modal from '@components/ui/Modal';
import Input from '@components/ui/Input';
import TopBar from '@components/layout/TopBar';

type Params = RouteProp<VentasStackParamList, 'VentaDetalle'>;

export default function VentaDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const ventaId = route.params.ventaId;
  const colors = useColors();
  const confirm = useConfirm();
  const showToast = useUIStore((s) => s.showToast);

  const user = useAuthStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAnular, setModalAnular] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);

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
      showToast('El motivo es obligatorio', 'error');
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
      showToast('Venta anulada.', 'success');
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al anular';
      showToast(msg, 'error');
    } finally {
      setAnulando(false);
    }
  };

  const confirmarAnular = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Anular venta',
      message:
        'Esta acción repondrá el stock y, si fue a crédito, revertirá la deuda del cliente. No se puede deshacer.',
      confirmLabel: 'Continuar',
      variant: 'danger',
    });
    if (ok) setModalAnular(true);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <TopBar title="Detalle de venta" onBack={() => navigation.goBack()} />
        <Loader message="Cargando venta" />
      </SafeAreaView>
    );
  }

  if (error || !venta) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <TopBar title="Detalle de venta" onBack={() => navigation.goBack()} />
        <ErrorState
          title="No pudimos cargar la venta"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error ?? undefined}
          onRetry={cargar}
        />
      </SafeAreaView>
    );
  }

  const anulada = venta.estado === 'anulada';
  const tieneDescuento = parseFloat(venta.descuento) > 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar title="Detalle de venta" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="receipt"
              size={28}
              color={colors.textSecondary}
            />
          </View>
          <Text style={[styles.numero, { color: colors.textPrimary }]}>
            {venta.numero}
          </Text>
          <Text style={[styles.fecha, { color: colors.textMuted }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Información
          </Text>
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Productos ({venta.detalle.length})
          </Text>
          {venta.detalle.map((item, idx) => {
            const subtotalBruto = parseFloat(item.subtotal);
            const descLinea = parseFloat((item as any).descuento ?? '0') || 0;
            const subtotalNeto = Math.max(0, subtotalBruto - descLinea);
            const tieneDesc = descLinea > 0.001;

            return (
              <View
                key={item.id}
                style={[
                  styles.detalleItem,
                  { borderTopColor: colors.border },
                  idx === venta.detalle.length - 1
                    ? styles.detalleItemLast
                    : null,
                ]}
              >
                <View style={styles.detalleInfo}>
                  <Text
                    style={[
                      styles.detalleNombre,
                      { color: colors.textPrimary },
                    ]}
                    numberOfLines={2}
                  >
                    {item.producto_nombre}
                  </Text>

                  <Text
                    style={[styles.detalleSub, { color: colors.textMuted }]}
                  >
                    {formatCurrency(item.precio_unitario)} × {item.cantidad}
                  </Text>

                  {tieneDesc ? (
                    <View style={styles.detallePromoRow}>
                      <MaterialCommunityIcons
                        name="tag-outline"
                        size={12}
                        color={colors.success}
                      />
                      <Text
                        style={[
                          styles.detallePromoText,
                          { color: colors.success },
                        ]}
                      >
                        Promoción −{formatCurrency(descLinea)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  {tieneDesc ? (
                    <Text
                      style={[
                        styles.detalleBruto,
                        { color: colors.textMuted },
                      ]}
                    >
                      {formatCurrency(subtotalBruto)}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.detalleSubtotal,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {formatCurrency(subtotalNeto)}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Resumen
          </Text>
          <TotalRow label="Subtotal" value={formatCurrency(venta.subtotal)} />
          {tieneDescuento ? (
            <TotalRow
              label="Descuento"
              value={`-${formatCurrency(venta.descuento)}`}
              valueColor={colors.danger}
            />
          ) : null}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
            onPress={confirmarAnular}
            fullWidth
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={modalAnular}
        onClose={() => setModalAnular(false)}
        title="Anular venta"
      >
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
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
    </SafeAreaView>
  );
}

function InfoRow(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}): React.ReactElement {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
      <MaterialCommunityIcons
        name={props.icon}
        size={16}
        color={colors.textMuted}
      />
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
          {props.label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
          {props.value}
        </Text>
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
  const colors = useColors();
  return (
    <View style={styles.totalRow}>
      <Text
        style={[
          props.bold ? styles.totalLabelBold : styles.totalLabel,
          { color: props.bold ? colors.textPrimary : colors.textSecondary },
        ]}
      >
        {props.label}
      </Text>
      <Text
        style={[
          props.bold ? styles.totalValueBold : styles.totalValue,
          { color: props.valueColor ?? colors.textPrimary },
        ]}
      >
        {props.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  numero: { ...typography.h2 },
  fecha: { ...typography.caption, marginTop: 4 },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.lg },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  infoText: { flex: 1 },
  infoLabel: { ...typography.small },
  infoValue: { ...typography.body, marginTop: 2 },
  detalleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  detalleItemLast: { borderBottomWidth: 0 },
  detalleInfo: { flex: 1, minWidth: 0 },
  detalleNombre: { ...typography.body },
  detalleSub: { ...typography.small, marginTop: 2 },
  detallePromoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  detallePromoText: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },
  detalleBruto: {
    ...typography.small,
    textDecorationLine: 'line-through',
  },
  detalleSubtotal: { ...typography.bodyBold, marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: { ...typography.caption },
  totalLabelBold: { ...typography.bodyBold },
  totalValue: { ...typography.bodyBold },
  totalValueBold: { ...typography.price },
  divider: { height: 1, marginVertical: spacing.sm },
  modalText: { ...typography.caption, marginBottom: spacing.lg },
  actionsWrap: { marginBottom: spacing.md },
});