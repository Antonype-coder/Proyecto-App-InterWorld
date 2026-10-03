import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, spacing, radius, typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { dashboardApi } from '@api/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import type { DashboardAvanzado, DashboardPeriodo } from '@tipos/index';
import Badge from '@components/ui/Badge';
import AlertaStock from '@components/domain/AlertaStock';
import Skeleton from '@components/ui/Skeleton';
import EmptyState from '@components/ui/EmptyState';
import Chip from '@components/ui/Chip';
import Tooltip from '@components/ui/Tooltip';
import { LineChartCard, BarChartCard, DonutChartCard } from '@components/charts';
import BusinessLogo from '@components/domain/BusinessLogo';

const PERIODOS: { value: DashboardPeriodo; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
];

export default function DashboardScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

  const [periodo, setPeriodo] = useState<DashboardPeriodo>('mes');
  const [data, setData] = useState<DashboardAvanzado | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const res = await dashboardApi.avanzado(periodo);
      setData(res);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'Error al cargar';
      setError(mensaje);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periodo]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  const onRefresh = (): void => {
    setRefreshing(true);
    void cargar();
  };

  const esAdmin = user?.rol === 'admin';
  const nombre = user?.nombre?.split(' ')[0] ?? 'Usuario';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BusinessLogo size={36} style={styles.businessLogo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hola, {nombre}</Text>
          <View style={styles.dateRow}>
            <Text style={styles.date}>Resumen de tu tienda</Text>
            <Tooltip
              title="Cómo interpretar el dashboard"
              text="El % verde/rojo compara el período actual con el anterior. Cambia el período con los chips de arriba. Los gráficos se actualizan en tiempo real."
            />
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate('BusquedaGlobal')}
          style={({ pressed }) => [
            styles.profileBtn,
            pressed ? styles.profileBtnPressed : null,
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textPrimary}
          />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Mas')}
          style={({ pressed }) => [
            styles.profileBtn,
            { marginLeft: spacing.sm },
            pressed ? styles.profileBtnPressed : null,
          ]}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={20}
            color={colors.textPrimary}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodosRow}
          style={styles.periodosScroll}
        >
          {PERIODOS.map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              active={periodo === p.value}
              onPress={() => setPeriodo(p.value)}
            />
          ))}
        </ScrollView>

        {loading && !data ? (
          <DashboardSkeleton />
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="No se pudo cargar"
            description={error}
            actionLabel="Reintentar"
            onAction={() => {
              setLoading(true);
              void cargar();
            }}
          />
        ) : data ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>VENTAS DEL PERÍODO</Text>

              <View style={styles.kpiFeatured}>
                <View style={styles.kpiFeaturedHeader}>
                  <Text style={styles.kpiFeaturedLabel}>Total vendido</Text>
                  <KpiChangeBadge
                    direccion={data.kpis.ventas_periodo.cambio.direccion}
                    porcentaje={data.kpis.ventas_periodo.cambio.porcentaje}
                  />
                </View>
                <Text style={styles.kpiFeaturedValue}>
                  {formatCurrency(data.kpis.ventas_periodo.actual.monto)}
                </Text>
                <Text style={styles.kpiFeaturedSub}>
                  {data.kpis.ventas_periodo.actual.cantidad} transacciones ·{' '}
                  Ticket promedio{' '}
                  {formatCurrency(data.kpis.ticket_promedio.valor)}
                </Text>
                <View style={styles.gananciaRow}>
                  <View style={styles.gananciaInfo}>
                    <Text style={styles.gananciaLabel}>
                      Ganancia bruta estimada
                    </Text>
                    <Text style={styles.gananciaSub}>
                      Margen {data.kpis.ganancias_periodo.margen_porcentaje}% ·
                      según costo de compra actual
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.gananciaValue,
                      parseFloat(data.kpis.ganancias_periodo.monto) < 0
                        ? styles.gananciaNegativa
                        : null,
                    ]}
                  >
                    {formatCurrency(data.kpis.ganancias_periodo.monto)}
                  </Text>
                </View>
              </View>

              <View style={styles.kpiGrid}>
                <KpiCard
                  label="Hoy"
                  value={formatCurrency(data.kpis.ventas_hoy.monto)}
                  sub={`${data.kpis.ventas_hoy.cantidad} ventas`}
                />
                <KpiCard
                  label="Clientes nuevos"
                  value={String(data.kpis.clientes_nuevos)}
                  sub="En este período"
                />
                <KpiCard
                  label="Productos activos"
                  value={String(data.kpis.productos_activos)}
                  sub="En catálogo"
                />
                <KpiCard
                  label="Stock bajo"
                  value={String(data.kpis.alertas_stock)}
                  sub="Requieren reposición"
                  valueColor={
                    data.kpis.alertas_stock > 0 ? colors.warning : undefined
                  }
                />
              </View>
            </View>

            {data.caja_abierta ? (
              <Pressable
                onPress={() => navigation.navigate('Mas', { screen: 'Caja' })}
                style={({ pressed }) => [
                  styles.cajaCard,
                  pressed ? styles.cajaCardPressed : null,
                ]}
              >
                <View style={styles.cajaHeader}>
                  <View style={styles.cajaIcon}>
                    <MaterialCommunityIcons
                      name="cash-register"
                      size={20}
                      color={colors.success}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cajaTitle}>Caja abierta</Text>
                    <Text style={styles.cajaSub}>
                      Desde {formatDateTime(data.caja_abierta.abierta_at)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textMuted}
                  />
                </View>
                <View style={styles.cajaTotales}>
                  <CajaTotal
                    label="Apertura"
                    value={data.caja_abierta.monto_apertura}
                  />
                  <CajaTotal
                    label="Efectivo"
                    value={data.caja_abierta.efectivo}
                  />
                  <CajaTotal
                    label="Turno"
                    value={data.caja_abierta.total_turno}
                    highlight
                  />
                </View>
              </Pressable>
            ) : null}

            {data.kpis.alertas_stock > 0 ? (
              <View style={styles.alertSection}>
                <AlertaStock
                  cantidad={data.kpis.alertas_stock}
                  onPress={() =>
                    navigation.navigate('Mas', { screen: 'Inventario' })
                  }
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TENDENCIA DE VENTAS</Text>
              <LineChartCard
                title="Ventas por día"
                subtitle={`Del ${data.periodo.desde} al ${data.periodo.hasta}`}
                data={data.ventas_por_dia.map((d) => ({
                  label: d.dia.slice(5),
                  value: parseFloat(d.monto_total) || 0,
                }))}
                formatValue={(v) => formatCurrency(v)}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>VENTAS POR HORA</Text>
              <BarChartCard
                title="Horas más activas"
                subtitle="Distribución de ventas del día"
                data={data.ventas_por_hora.map((h) => ({
                  label: h.label.slice(0, 2),
                  value: parseFloat(h.monto) || 0,
                }))}
                formatValue={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                  return String(Math.round(v));
                }}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MÉTODOS DE PAGO</Text>
              <DonutChartCard
                title="Distribución"
                data={data.metodos_pago.map((m, idx) => ({
                  label: m.label,
                  value: parseFloat(m.monto) || 0,
                  color:
                    idx === 0
                      ? colors.accent
                      : idx === 1
                        ? colors.success
                        : colors.warning,
                }))}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TOP PRODUCTOS</Text>
              {data.top_productos.length === 0 ? (
                <View style={styles.emptySmall}>
                  <Text style={styles.emptySmallText}>
                    Sin ventas en este período
                  </Text>
                </View>
              ) : (
                <View style={styles.listBox}>
                  {data.top_productos.map((p, idx) => {
                    const maxMonto = parseFloat(
                      data.top_productos[0].monto_total,
                    );
                    const pct =
                      maxMonto > 0
                        ? (parseFloat(p.monto_total) / maxMonto) * 100
                        : 0;

                    return (
                      <View
                        key={p.id}
                        style={[
                          styles.topRow,
                          idx === data.top_productos.length - 1
                            ? styles.topRowLast
                            : null,
                        ]}
                      >
                        <View style={styles.rank}>
                          <Text style={styles.rankText}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <Text style={styles.topNombre} numberOfLines={1}>
                            {p.nombre}
                          </Text>
                          <View style={styles.progressWrap}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${pct}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.topSub}>
                            {p.unidades_vendidas} und ·{' '}
                            {formatCurrency(p.monto_total)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACCIONES RÁPIDAS</Text>
              <View style={styles.quickGrid}>
                <QuickAction
                  icon="cart-plus"
                  label="Vender"
                  onPress={() => navigation.navigate('Vender')}
                />
                <QuickAction
                  icon="plus-circle-outline"
                  label="Producto"
                  onPress={() =>
                    navigation.navigate('Productos', {
                      screen: 'ProductoForm',
                    })
                  }
                />
                <QuickAction
                  icon="swap-horizontal"
                  label="Inventario"
                  onPress={() =>
                    navigation.navigate('Mas', { screen: 'Inventario' })
                  }
                />
                <QuickAction
                  icon={esAdmin ? 'chart-line' : 'account-group-outline'}
                  label={esAdmin ? 'Reportes' : 'Clientes'}
                  onPress={() =>
                    navigation.navigate('Mas', {
                      screen: esAdmin ? 'Reportes' : 'Clientes',
                    })
                  }
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>ÚLTIMAS VENTAS</Text>
                <Pressable onPress={() => navigation.navigate('Ventas')}>
                  <Text style={styles.sectionLink}>Ver todas</Text>
                </Pressable>
              </View>

              {data.ultimas_ventas.length === 0 ? (
                <View style={styles.emptySmall}>
                  <Text style={styles.emptySmallText}>
                    Aún no hay ventas registradas
                  </Text>
                </View>
              ) : (
                <View style={styles.listBox}>
                  {data.ultimas_ventas.map((v, idx) => (
                    <Pressable
                      key={v.id}
                      style={({ pressed }) => [
                        styles.saleRow,
                        idx === data.ultimas_ventas.length - 1
                          ? styles.saleRowLast
                          : null,
                        pressed ? styles.saleRowPressed : null,
                      ]}
                      onPress={() =>
                        navigation.navigate('Ventas', {
                          screen: 'VentaDetalle',
                          params: { ventaId: v.id },
                        })
                      }
                    >
                      <View style={styles.saleIcon}>
                        <MaterialCommunityIcons
                          name="receipt"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </View>
                      <View style={styles.saleInfo}>
                        <Text style={styles.saleNumero}>{v.numero}</Text>
                        <Text style={styles.saleCliente} numberOfLines={1}>
                          {v.cliente_nombre ?? 'Consumidor final'}
                        </Text>
                      </View>
                      <View style={styles.saleRight}>
                        <Text style={styles.saleTotal}>
                          {formatCurrency(v.total)}
                        </Text>
                        <Badge
                          label={
                            v.tipo_pago === 'credito' ? 'Crédito' : 'Contado'
                          }
                          variant={
                            v.tipo_pago === 'credito' ? 'warning' : 'neutral'
                          }
                          size="sm"
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: spacing.xxl }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiChangeBadge(props: {
  direccion: 'up' | 'down' | 'flat';
  porcentaje: number;
}): React.ReactElement {
  const isUp = props.direccion === 'up';
  const isDown = props.direccion === 'down';

  const bg = isUp
    ? colors.successSubtle
    : isDown
      ? colors.dangerSubtle
      : colors.bgSubtle;

  const text = isUp
    ? colors.successText
    : isDown
      ? colors.dangerText
      : colors.textMuted;

  const icon = isUp ? 'trending-up' : isDown ? 'trending-down' : 'minus';

  return (
    <View style={[styles.changeBadge, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={14} color={text} />
      <Text style={[styles.changeText, { color: text }]}>
        {isUp ? '+' : ''}
        {props.porcentaje.toFixed(1)}%
      </Text>
    </View>
  );
}

function KpiCard(props: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}): React.ReactElement {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{props.label}</Text>
      <Text
        style={[
          styles.kpiValue,
          props.valueColor ? { color: props.valueColor } : null,
        ]}
        numberOfLines={1}
      >
        {props.value}
      </Text>
      <Text style={styles.kpiSub} numberOfLines={1}>
        {props.sub}
      </Text>
    </View>
  );
}

function CajaTotal(props: {
  label: string;
  value: string;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <View style={styles.cajaTotalItem}>
      <Text style={styles.cajaTotalLabel}>{props.label}</Text>
      <Text
        style={[
          styles.cajaTotalValue,
          props.highlight ? styles.cajaTotalHighlight : null,
        ]}
      >
        {formatCurrency(props.value)}
      </Text>
    </View>
  );
}

function QuickAction(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed ? styles.quickActionPressed : null,
      ]}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={22}
        color={colors.textPrimary}
      />
      <Text style={styles.quickLabel}>{props.label}</Text>
    </Pressable>
  );
}

function DashboardSkeleton(): React.ReactElement {
  return (
    <View style={{ padding: spacing.lg }}>
      <Skeleton width="40%" height={14} style={{ marginBottom: spacing.md }} />
      <Skeleton
        width="100%"
        height={100}
        borderRadius={radius.lg}
        style={{ marginBottom: spacing.lg }}
      />
      <View style={styles.kpiGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.kpiCard}>
            <Skeleton width="40%" height={10} />
            <Skeleton
              width="70%"
              height={22}
              style={{ marginTop: spacing.sm }}
            />
            <Skeleton
              width="60%"
              height={10}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  businessLogo: { marginRight: spacing.md },
  greeting: { ...typography.h2, color: colors.textPrimary },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileBtnPressed: { opacity: 0.7 },

  scroll: { paddingBottom: spacing.giant },

  periodosScroll: { flexGrow: 0, maxHeight: 44, marginBottom: spacing.md },
  periodosRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },

  section: { marginBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  sectionLink: { ...typography.bodyBold, color: colors.accent },

  kpiFeatured: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  kpiFeaturedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  kpiFeaturedLabel: { ...typography.small, color: colors.textSecondary },
  kpiFeaturedValue: {
    ...typography.display,
    color: colors.textPrimary,
    marginTop: 4,
  },
  kpiFeaturedSub: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  gananciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  gananciaInfo: { flex: 1 },
  gananciaLabel: { ...typography.bodyBold, color: colors.textPrimary },
  gananciaSub: { ...typography.tiny, color: colors.textMuted, marginTop: 3 },
  gananciaValue: { ...typography.bodyBold, color: colors.success },
  gananciaNegativa: { color: colors.danger },

  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  changeText: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiLabel: { ...typography.small, color: colors.textSecondary },
  kpiValue: {
    ...typography.price,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  kpiSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },

  cajaCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.successSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
  },
  cajaCardPressed: { opacity: 0.9 },
  cajaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cajaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cajaTitle: { ...typography.bodyBold, color: colors.successText },
  cajaSub: { ...typography.small, color: colors.successText, marginTop: 2 },
  cajaTotales: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cajaTotalItem: { flex: 1 },
  cajaTotalLabel: {
    ...typography.tiny,
    color: colors.successText,
    marginBottom: 2,
  },
  cajaTotalValue: {
    ...typography.bodyBold,
    color: colors.successText,
  },
  cajaTotalHighlight: {
    fontSize: 16,
  },

  alertSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },

  listBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRowLast: { borderBottomWidth: 0 },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { ...typography.bodyBold, color: colors.textPrimary },
  topNombre: { ...typography.bodyBold, color: colors.textPrimary },
  progressWrap: {
    height: 4,
    backgroundColor: colors.bgSubtle,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  topSub: { ...typography.small, color: colors.textMuted, marginTop: 4 },

  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  quickActionPressed: { backgroundColor: colors.surfacePressed },
  quickLabel: { ...typography.small, color: colors.textPrimary },

  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saleRowLast: { borderBottomWidth: 0 },
  saleRowPressed: { backgroundColor: colors.surfacePressed },
  saleIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  saleInfo: { flex: 1, marginRight: spacing.md },
  saleNumero: { ...typography.bodyBold, color: colors.textPrimary },
  saleCliente: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  saleRight: { alignItems: 'flex-end', gap: spacing.xs },
  saleTotal: { ...typography.bodyBold, color: colors.textPrimary },

  emptySmall: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptySmallText: { ...typography.caption, color: colors.textMuted },
});