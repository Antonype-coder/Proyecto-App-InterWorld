import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing, radius, typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useColors } from '@hooks/useColors';
import { useChartColors } from '@hooks/useChartColors';
import { useReturnTo } from '@hooks/useReturnTo';
import { useCajaResumen } from '@hooks/useCajaResumen';
import { dashboardApi } from '@api/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import type { DashboardAvanzado, DashboardPeriodo } from '@tipos/index';
import Badge from '@components/ui/Badge';
import AlertaStock from '@components/domain/AlertaStock';
import Skeleton from '@components/ui/Skeleton';
import ErrorState from '@components/feedback/ErrorState';
import Chip from '@components/ui/Chip';
import AppHeader from '@components/layout/AppHeader';
import KpiHeroCard from '@components/ui/KpiHeroCard';
import StatCard from '@components/ui/StatCard';
import { LineChartCard, BarChartCard, DonutChartCard } from '@components/charts';
import { StaggeredSection, ShineEffect, FadeInItem } from '@components/animations';

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
  const colors = useColors();
  const chartColors = useChartColors();
  const goTo = useReturnTo();

  const [periodo, setPeriodo] = useState<DashboardPeriodo>('mes');
  const [data, setData] = useState<DashboardAvanzado | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cajaResumen = useCajaResumen(data?.caja_abierta ?? null);

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

  const onRefresh = async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    void cargar();
  };

  const esAdmin = user?.rol === 'admin';

  const sparkData = useMemo(() => {
    if (!data) return [];
    return data.ventas_por_dia.map((d) => parseFloat(d.monto_total) || 0);
  }, [data]);

  const totalPeriodo = data
    ? parseFloat(data.kpis.ventas_periodo.actual.monto) || 0
    : 0;

  const gananciaMonto = data
    ? parseFloat(data.kpis.ganancias_periodo.monto) || 0
    : 0;

  const ventasHoyMonto = data
    ? parseFloat(data.kpis.ventas_hoy.monto) || 0
    : 0;

  const carteraTotal = data
    ? parseFloat(data.kpis.cartera_total.total) || 0
    : 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <AppHeader
        subtitle="Resumen de tu tienda"
        unreadCount={data?.notificaciones_no_leidas ?? 0}
      />

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
        {/* Periodo selector */}
        <StaggeredSection delay={0}>
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
                onPress={() => {
                  void Haptics.selectionAsync();
                  setPeriodo(p.value);
                }}
              />
            ))}
          </ScrollView>
        </StaggeredSection>

        {loading && !data ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState
            title="No pudimos cargar el dashboard"
            message="Revisa tu conexión e intenta de nuevo."
            technicalMessage={error}
            onRetry={() => {
              setLoading(true);
              void cargar();
            }}
          />
        ) : data ? (
          <>
            {/* ============ KPI HERO ============ */}
            <StaggeredSection delay={80}>
              <View style={styles.section}>
                <ShineEffect borderRadius={radius.lg} delay={400}>
                  <KpiHeroCard
                    label="Vendido en el período"
                    value={totalPeriodo}
                    formatValue={(v) => formatCurrency(v)}
                    subtitle={`${data.kpis.ventas_periodo.actual.cantidad} transacciones · Ticket ${formatCurrency(data.kpis.ticket_promedio.valor)}`}
                    trend={{
                      direction: data.kpis.ventas_periodo.cambio.direccion,
                      percentage:
                        data.kpis.ventas_periodo.cambio.porcentaje,
                    }}
                    sparkData={sparkData}
                    sparkColor={chartColors.primary}
                  />
                </ShineEffect>
              </View>
            </StaggeredSection>

            {/* ============ GRID DE STATS ============ */}
            <StaggeredSection delay={160}>
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  RESUMEN
                </Text>

                <View style={styles.grid}>
                  <StatCard
                    icon="cash"
                    label="Ventas hoy"
                    value={ventasHoyMonto}
                    formatValue={(v) => formatCurrency(v)}
                    subtitle={`${data.kpis.ventas_hoy.cantidad} ${
                      data.kpis.ventas_hoy.cantidad === 1 ? 'venta' : 'ventas'
                    }`}
                    tone="wine"
                  />

                  <StatCard
                    icon="trending-up"
                    label="Ganancia est."
                    value={gananciaMonto}
                    formatValue={(v) => formatCurrency(v)}
                    subtitle={`Margen ${data.kpis.ganancias_periodo.margen_porcentaje}%`}
                    tone={gananciaMonto < 0 ? 'berry' : 'primary'}
                  />

                  <StatCard
                    icon="account-cash-outline"
                    label="Cartera"
                    value={carteraTotal}
                    formatValue={(v) => formatCurrency(v)}
                    subtitle={`${data.kpis.cartera_total.clientes} clientes`}
                    tone={carteraTotal > 0 ? 'plum' : 'primary'}
                  />

                  <StatCard
                    icon="alert-outline"
                    label="Stock bajo"
                    value={data.kpis.alertas_stock}
                    formatValue={(v) => String(Math.round(v))}
                    subtitle="Requieren reposición"
                    tone={data.kpis.alertas_stock > 0 ? 'berry' : 'primary'}
                  />
                </View>
              </View>
            </StaggeredSection>

            {/* ============ CAJA ABIERTA ============ */}
            {data.caja_abierta ? (
              <StaggeredSection delay={240}>
                <View style={styles.section}>
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                      goTo('Mas', 'Caja');
                    }}
                    style={({ pressed }) => [
                      styles.cajaCard,
                      {
                        backgroundColor: colors.chartPlumSubtle,
                        borderColor: colors.chartPlum,
                      },
                      pressed ? { opacity: 0.94 } : null,
                    ]}
                  >
                    <View style={styles.cajaHeader}>
                      <View
                        style={[
                          styles.cajaIcon,
                          { backgroundColor: colors.surface },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="cash-register"
                          size={18}
                          color={colors.chartPlum}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.cajaTitle,
                            { color: colors.chartPlum },
                          ]}
                        >
                          Caja abierta
                        </Text>

                        <Text
                          style={[
                            styles.cajaSub,
                            { color: colors.chartPlum, opacity: 0.7 },
                          ]}
                        >
                          Desde {formatDateTime(data.caja_abierta.abierta_at)}
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={18}
                        color={colors.chartPlum}
                      />
                    </View>

                    <View style={styles.cajaTotales}>
                      <CajaTotal
                        label="Apertura"
                        value={formatCurrency(cajaResumen.apertura)}
                        textColor={colors.chartPlum}
                      />

                      <CajaTotal
                        label="Ventas"
                        value={formatCurrency(cajaResumen.ventasTotal)}
                        textColor={colors.chartPlum}
                        highlight
                      />

                      <CajaTotal
                        label="Efectivo"
                        value={formatCurrency(cajaResumen.efectivo)}
                        textColor={colors.chartPlum}
                      />
                    </View>
                  </Pressable>
                </View>
              </StaggeredSection>
            ) : null}

            {/* ============ ALERTA STOCK ============ */}
            {data.kpis.alertas_stock > 0 ? (
              <StaggeredSection delay={320}>
                <View style={styles.alertSection}>
                  <AlertaStock
                    cantidad={data.kpis.alertas_stock}
                    onPress={() => goTo('Mas', 'Inventario')}
                  />
                </View>
              </StaggeredSection>
            ) : null}

            {/* ============ CHARTS ============ */}
            <StaggeredSection delay={400}>
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  TENDENCIA
                </Text>

                <LineChartCard
                  title="Ventas por día"
                  subtitle={`Del ${data.periodo.desde} al ${data.periodo.hasta}`}
                  data={data.ventas_por_dia.map((d) => ({
                    label: d.dia.slice(5),
                    value: parseFloat(d.monto_total) || 0,
                  }))}
                  formatValue={(v) => formatCurrency(v)}
                  color={chartColors.wine}
                />
              </View>
            </StaggeredSection>

            <StaggeredSection delay={480}>
              <View style={styles.section}>
                <BarChartCard
                  title="Ventas por hora"
                  subtitle="Distribución de hoy"
                  data={data.ventas_por_hora.map((h) => ({
                    label: h.label.slice(0, 2),
                    value: parseFloat(h.monto) || 0,
                  }))}
                  formatValue={(v) => {
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return String(Math.round(v));
                  }}
                  color={chartColors.plum}
                />
              </View>
            </StaggeredSection>

            <StaggeredSection delay={560}>
              <View style={styles.section}>
                <DonutChartCard
                  title="Métodos de pago"
                  data={data.metodos_pago.map((m, idx) => ({
                    label: m.label,
                    value: parseFloat(m.monto) || 0,
                    color:
                      chartColors.series[idx % chartColors.series.length],
                  }))}
                  centerColor={chartColors.plum}
                />
              </View>
            </StaggeredSection>

            {/* ============ TOP PRODUCTOS ============ */}
            <StaggeredSection delay={640}>
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  TOP PRODUCTOS
                </Text>

                {data.top_productos.length === 0 ? (
                  <View
                    style={[
                      styles.emptySmall,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptySmallText,
                        { color: colors.textMuted },
                      ]}
                    >
                      Sin ventas en este período
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.listBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {data.top_productos.map((p, idx) => {
                      const maxMonto = parseFloat(
                        data.top_productos[0].monto_total,
                      );

                      const pct =
                        maxMonto > 0
                          ? (parseFloat(p.monto_total) / maxMonto) * 100
                          : 0;

                      const barColor =
                        idx === 0
                          ? chartColors.plum
                          : idx === 1
                            ? chartColors.wine
                            : idx === 2
                              ? chartColors.berry
                              : chartColors.mauve;

                      const rankBg =
                        idx === 0
                          ? chartColors.plumSubtle
                          : colors.bgSubtle;

                      const rankColor =
                        idx === 0
                          ? chartColors.plum
                          : colors.textPrimary;

                      return (
                        <FadeInItem key={p.id} delay={700 + idx * 60}>
                          <View
                            style={[
                              styles.topRow,
                              { borderBottomColor: colors.border },
                              idx === data.top_productos.length - 1
                                ? styles.topRowLast
                                : null,
                            ]}
                          >
                            <View
                              style={[
                                styles.rank,
                                { backgroundColor: rankBg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.rankText,
                                  { color: rankColor },
                                ]}
                              >
                                {idx + 1}
                              </Text>
                            </View>

                            <View
                              style={{ flex: 1, marginLeft: spacing.md }}
                            >
                              <Text
                                style={[
                                  styles.topNombre,
                                  { color: colors.textPrimary },
                                ]}
                                numberOfLines={1}
                              >
                                {p.nombre}
                              </Text>

                              <View
                                style={[
                                  styles.progressWrap,
                                  { backgroundColor: colors.bgSubtle },
                                ]}
                              >
                                <AnimatedProgress
                                  pct={pct}
                                  color={barColor}
                                  delay={700 + idx * 60}
                                />
                              </View>

                              <Text
                                style={[
                                  styles.topSub,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {p.unidades_vendidas} und ·{' '}
                                {formatCurrency(p.monto_total)}
                              </Text>
                            </View>
                          </View>
                        </FadeInItem>
                      );
                    })}
                  </View>
                )}
              </View>
            </StaggeredSection>

            {/* ============ ACCIONES RÁPIDAS ============ */}
            <StaggeredSection delay={760}>
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  ACCESOS RÁPIDOS
                </Text>

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
                    onPress={() => goTo('Mas', 'Inventario')}
                  />

                  <QuickAction
                    icon={esAdmin ? 'chart-line' : 'account-group-outline'}
                    label={esAdmin ? 'Reportes' : 'Clientes'}
                    onPress={() =>
                      goTo('Mas', esAdmin ? 'Reportes' : 'Clientes')
                    }
                  />
                </View>
              </View>
            </StaggeredSection>

            {/* ============ ÚLTIMAS VENTAS ============ */}
            <StaggeredSection delay={840}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textMuted }]}
                  >
                    ÚLTIMAS VENTAS
                  </Text>

                  <Pressable onPress={() => navigation.navigate('Ventas')}>
                    <Text
                      style={[styles.sectionLink, { color: colors.accent }]}
                    >
                      Ver todas
                    </Text>
                  </Pressable>
                </View>

                {data.ultimas_ventas.length === 0 ? (
                  <View
                    style={[
                      styles.emptySmall,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptySmallText,
                        { color: colors.textMuted },
                      ]}
                    >
                      Aún no hay ventas registradas
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.listBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {data.ultimas_ventas.map((v, idx) => (
                      <FadeInItem key={v.id} delay={900 + idx * 50}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.saleRow,
                            { borderBottomColor: colors.border },
                            idx === data.ultimas_ventas.length - 1
                              ? styles.saleRowLast
                              : null,
                            pressed
                              ? { backgroundColor: colors.surfacePressed }
                              : null,
                          ]}
                          onPress={() =>
                            goTo('Ventas', 'VentaDetalle', { ventaId: v.id })
                          }
                        >
                          <View
                            style={[
                              styles.saleIcon,
                              { backgroundColor: colors.bgSubtle },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="receipt"
                              size={16}
                              color={colors.textSecondary}
                            />
                          </View>

                          <View style={styles.saleInfo}>
                            <Text
                              style={[
                                styles.saleNumero,
                                { color: colors.textPrimary },
                              ]}
                            >
                              {v.numero}
                            </Text>

                            <Text
                              style={[
                                styles.saleCliente,
                                { color: colors.textMuted },
                              ]}
                              numberOfLines={1}
                            >
                              {v.cliente_nombre ?? 'Consumidor final'}
                            </Text>
                          </View>

                          <View style={styles.saleRight}>
                            <Text
                              style={[
                                styles.saleTotal,
                                { color: colors.textPrimary },
                              ]}
                            >
                              {formatCurrency(v.total)}
                            </Text>

                            <Badge
                              label={
                                v.tipo_pago === 'credito'
                                  ? 'Crédito'
                                  : 'Contado'
                              }
                              variant={
                                v.tipo_pago === 'credito'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            />
                          </View>
                        </Pressable>
                      </FadeInItem>
                    ))}
                  </View>
                )}
              </View>
            </StaggeredSection>

            <View style={{ height: spacing.xxl }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   Subcomponentes
   ============================================================ */

function AnimatedProgress({
  pct,
  color,
  delay,
}: {
  pct: number;
  color: string;
  delay: number;
}): React.ReactElement {
  const width = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [pct, delay, width]);

  const widthInterpolated = width.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.progressFill,
        {
          width: widthInterpolated,
          backgroundColor: color,
        },
      ]}
    />
  );
}

function CajaTotal(props: {
  label: string;
  value: string;
  textColor: string;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <View style={styles.cajaTotalItem}>
      <Text style={[styles.cajaTotalLabel, { color: props.textColor }]}>
        {props.label}
      </Text>

      <Text
        style={[
          styles.cajaTotalValue,
          { color: props.textColor },
          props.highlight ? styles.cajaTotalHighlight : null,
        ]}
        numberOfLines={1}
      >
        {props.value}
      </Text>
    </View>
  );
}

function QuickAction(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  return (
    <Animated.View style={[{ flex: 1, transform: [{ scale }] }]}>
      <Pressable
        onPress={props.onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.quickAction,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.quickIcon,
            { backgroundColor: colors.bgSubtle },
          ]}
        >
          <MaterialCommunityIcons
            name={props.icon}
            size={20}
            color={colors.textPrimary}
          />
        </View>

        <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>
          {props.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function DashboardSkeleton(): React.ReactElement {
  const colors = useColors();

  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <View
        style={[
          styles.skelHero,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Skeleton width="40%" height={12} />

        <Skeleton
          width="60%"
          height={32}
          style={{ marginTop: spacing.md }}
        />

        <Skeleton
          width="70%"
          height={12}
          style={{ marginTop: spacing.sm }}
        />

        <Skeleton
          width="100%"
          height={40}
          style={{ marginTop: spacing.lg }}
        />
      </View>

      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.skelStat,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Skeleton width="60%" height={12} />

            <Skeleton
              width="80%"
              height={22}
              style={{ marginTop: spacing.sm }}
            />

            <Skeleton
              width="50%"
              height={10}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/* ============================================================
   Estilos
   ============================================================ */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: spacing.giant },

  periodosScroll: {
    flexGrow: 0,
    maxHeight: 44,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },

  periodosRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },

  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.md,
  },

  sectionLink: {
    ...typography.bodyBold,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  cajaCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },

  cajaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  cajaIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cajaTitle: {
    ...typography.bodyBold,
  },

  cajaSub: {
    ...typography.tiny,
    marginTop: 2,
  },

  cajaTotales: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  cajaTotalItem: {
    flex: 1,
  },

  cajaTotalLabel: {
    ...typography.tiny,
    marginBottom: 2,
  },

  cajaTotalValue: {
    ...typography.bodyBold,
  },

  cajaTotalHighlight: {
    fontSize: 16,
  },

  alertSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  listBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },

  topRowLast: {
    borderBottomWidth: 0,
  },

  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankText: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },

  topNombre: {
    ...typography.bodyBold,
  },

  progressWrap: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  topSub: {
    ...typography.small,
    marginTop: 4,
  },

  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  quickAction: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickLabel: {
    ...typography.small,
  },

  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },

  saleRowLast: {
    borderBottomWidth: 0,
  },

  saleIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  saleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },

  saleNumero: {
    ...typography.bodyBold,
  },

  saleCliente: {
    ...typography.small,
    marginTop: 2,
  },

  saleRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },

  saleTotal: {
    ...typography.bodyBold,
  },

  emptySmall: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },

  emptySmallText: {
    ...typography.caption,
  },

  skelHero: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  skelStat: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
});
