import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { lealtadApi } from '@api/index';
import type { LealtadInfo, PuntoHistorial, MasStackParamList } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import Loader from '@components/ui/Loader';
import LealtadBadge from '@components/domain/LealtadBadge';
import ProgressBar from '@components/ui/ProgressBar';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<MasStackParamList, 'ClienteEstadoCuenta'>;

export default function ClienteLealtadScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const clienteId = route.params.clienteId;
  const colors = useColors();

  const [info, setInfo] = useState<LealtadInfo | null>(null);
  const [historial, setHistorial] = useState<PuntoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalCanje, setModalCanje] = useState(false);
  const [puntosCanje, setPuntosCanje] = useState('');
  const [canjeando, setCanjeando] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: ToastVariant }>({
    visible: false, message: '', variant: 'info',
  });

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const [i, h] = await Promise.all([
        lealtadApi.infoCliente(clienteId),
        lealtadApi.historial(clienteId),
      ]);
      setInfo(i);
      setHistorial(h);
    } finally { setLoading(false); setRefreshing(false); }
  }, [clienteId]);

  useFocusEffect(useCallback(() => { void cargar(); }, [cargar]));

  const canjear = async (): Promise<void> => {
    const pts = parseInt(puntosCanje) || 0;
    if (pts <= 0 || !info) { setToast({ visible: true, message: 'Ingresa una cantidad válida', variant: 'error' }); return; }
    if (pts > info.puntos_actuales) {
      setToast({ visible: true, message: `Solo tienes ${info.puntos_actuales} puntos`, variant: 'error' }); return;
    }
    setCanjeando(true);
    try {
      const res = await lealtadApi.canjear(clienteId, pts);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalCanje(false);
      setPuntosCanje('');
      await cargar();
      setToast({
        visible: true,
        message: `Canjeado: ${formatCurrency(res.valor_descuento)} de descuento`,
        variant: 'success',
      });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToast({ visible: true, message: e instanceof Error ? e.message : 'Error', variant: 'error' });
    } finally { setCanjeando(false); }
  };

  if (loading || !info) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopBar title="Lealtad" onBack={() => navigation.goBack()} />
        <Loader message="Cargando..." />
      </SafeAreaView>
    );
  }

  const cfgNivel = info.reglas.niveles;
  const puntosActuales = info.puntos_actuales;
  const esGold = info.nivel === 'gold';
  const nivelActualMin = cfgNivel[info.nivel];
  const nivelSig = info.proximo_nivel
    ? cfgNivel[info.proximo_nivel.nombre as 'bronze' | 'silver' | 'gold']
    : nivelActualMin;
  const progreso = esGold ? 100 : ((puntosActuales - nivelActualMin) / (nivelSig - nivelActualMin)) * 100;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <TopBar title="Programa de lealtad" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void cargar(); }} tintColor={colors.textSecondary} />}
      >
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Puntos disponibles</Text>
            <LealtadBadge nivel={info.nivel} />
          </View>
          <Text style={[styles.heroPuntos, { color: colors.textPrimary }]}>{puntosActuales}</Text>
          <Text style={[styles.heroValor, { color: colors.textSecondary }]}>
            Equivalen a {formatCurrency(info.valor_disponible)} de descuento
          </Text>

          <View style={[styles.progressSection, { borderTopColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Nivel {info.nivel}</Text>
              {info.proximo_nivel ? (
                <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Nivel {info.proximo_nivel.nombre}</Text>
              ) : (
                <Text style={[styles.progressLabel, { color: colors.textMuted }]}>¡Nivel máximo!</Text>
              )}
            </View>
            <ProgressBar value={progreso} color={colors.accent} />
            {info.proximo_nivel ? (
              <Text style={[styles.progressSub, { color: colors.textMuted }]}>
                Te faltan {info.proximo_nivel.puntos_faltantes} puntos para subir de nivel
              </Text>
            ) : (
              <Text style={[styles.progressSub, { color: colors.textMuted }]}>
                Has alcanzado el nivel máximo
              </Text>
            )}
          </View>
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cómo funciona</Text>
          <Row icon="cash-plus" text={`Gana ${info.reglas.puntos_por_peso} punto por cada ${formatCurrency(info.reglas.peso_por_punto)} en compras`} />
          <Row icon="gift-outline" text={`1 punto = ${formatCurrency(info.reglas.valor_punto)} de descuento al canjear`} />
          <Row icon="medal-outline" text={`Silver desde ${cfgNivel.silver} puntos`} />
          <Row icon="crown" text={`Gold desde ${cfgNivel.gold} puntos`} />
        </Card>

        {puntosActuales > 0 ? (
          <View style={{ marginBottom: spacing.lg }}>
            <Button
              label={`Canjear puntos (${formatCurrency(info.valor_disponible)})`}
              onPress={() => { setPuntosCanje(String(puntosActuales)); setModalCanje(true); }}
              icon="gift"
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HISTORIAL DE PUNTOS</Text>
        {historial.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sin movimientos de puntos</Text>
          </View>
        ) : (
          <View style={[styles.listBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {historial.map((h, idx) => (
              <View key={h.id} style={[styles.histRow, { borderBottomColor: colors.border }, idx === historial.length - 1 ? styles.histRowLast : null]}>
                <View style={[styles.histIcon, {
                  backgroundColor:
                    h.tipo === 'ganado' ? colors.successSubtle :
                    h.tipo === 'canjeado' ? colors.accentSubtle : colors.warningSubtle,
                }]}>
                  <MaterialCommunityIcons
                    name={h.tipo === 'ganado' ? 'plus-circle-outline' : h.tipo === 'canjeado' ? 'gift-outline' : 'swap-horizontal'}
                    size={16}
                    color={h.tipo === 'ganado' ? colors.success : h.tipo === 'canjeado' ? colors.accent : colors.warning}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.histMotivo, { color: colors.textPrimary }]} numberOfLines={1}>{h.motivo ?? h.tipo}</Text>
                  <Text style={[styles.histFecha, { color: colors.textMuted }]}>{formatDateTime(h.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.histPuntos, { color: h.puntos > 0 ? colors.success : colors.danger }]}>
                    {h.puntos > 0 ? '+' : ''}{h.puntos}
                  </Text>
                  <Text style={[styles.histSaldo, { color: colors.textMuted }]}>{h.saldo_nuevo} pts</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalCanje} onClose={() => setModalCanje(false)} title="Canjear puntos">
        <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
          Tienes {puntosActuales} puntos disponibles ({formatCurrency(info.valor_disponible)}).
        </Text>
        <Input
          label="Puntos a canjear"
          keyboardType="numeric"
          value={puntosCanje}
          onChangeText={setPuntosCanje}
          required
        />
        <Text style={[styles.modalSub, { color: colors.textMuted }]}>
          Equivalen a {formatCurrency((parseInt(puntosCanje) || 0) * info.reglas.valor_punto)} de descuento
        </Text>
        <Button label="Canjear puntos" onPress={canjear} loading={canjeando} disabled={canjeando} variant="primary" fullWidth />
      </Modal>

      <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast((t) => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

function Row(props: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }): React.ReactElement {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={props.icon} size={16} color={colors.accent} />
      <Text style={[styles.rowText, { color: colors.textPrimary }]}>{props.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  heroCard: { marginBottom: spacing.lg },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { ...typography.small },
  heroPuntos: { ...typography.display, marginTop: spacing.sm },
  heroValor: { ...typography.caption, marginTop: 2 },
  progressSection: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel: { ...typography.tiny, textTransform: 'uppercase' },
  progressSub: { ...typography.small, marginTop: spacing.sm },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowText: { ...typography.body, flex: 1 },
  sectionLabel: { ...typography.overline, marginTop: spacing.xl, marginBottom: spacing.md },
  emptyBox: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.caption },
  listBox: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  histRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, gap: spacing.md },
  histRowLast: { borderBottomWidth: 0 },
  histIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  histMotivo: { ...typography.body },
  histFecha: { ...typography.tiny, marginTop: 2 },
  histPuntos: { ...typography.bodyBold },
  histSaldo: { ...typography.tiny, marginTop: 2 },
  modalInfo: { ...typography.body, marginBottom: spacing.md },
  modalSub: { ...typography.caption, marginBottom: spacing.md },
});