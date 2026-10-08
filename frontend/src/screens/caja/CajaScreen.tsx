import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usePolling } from '@hooks/usePolling';
import { cajaApi, ventasApi } from '@api/index';
import type { CajaSesion, CajaMovimiento, VentaResumen } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Badge from '@components/ui/Badge';
import Loader from '@components/ui/Loader';
import TopBar from '@components/layout/TopBar';

const POLL_MS = 5000;

interface Totales {
  ventasTurno: number;
  ventasCantidad: number;
  ingresosManuales: number;
  egresosManuales: number;
}

function calcularDesdeMovimientos(movs: CajaMovimiento[]): Totales {
  let ventasTurno = 0;
  let ventasCantidad = 0;
  let ingresosManuales = 0;
  let egresosManuales = 0;

  for (const m of movs) {
    const monto = parseFloat(m.monto) || 0;
    if (m.tipo === 'venta') {
      ventasTurno += monto;
      ventasCantidad += 1;
    } else if (m.tipo === 'ingreso') {
      ingresosManuales += monto;
    } else if (m.tipo === 'egreso') {
      egresosManuales += monto;
    }
  }

  return { ventasTurno, ventasCantidad, ingresosManuales, egresosManuales };
}

function calcularDesdeVentas(
  ventas: VentaResumen[],
  desde: string,
): Totales {
  const inicio = new Date(desde).getTime();
  let ventasTurno = 0;
  let ventasCantidad = 0;

  for (const v of ventas) {
    if (v.estado !== 'completada') continue;
    const fecha = new Date(v.created_at).getTime();
    if (fecha >= inicio - 60_000) {
      ventasTurno += parseFloat(v.total) || 0;
      ventasCantidad += 1;
    }
  }

  return {
    ventasTurno,
    ventasCantidad,
    ingresosManuales: 0,
    egresosManuales: 0,
  };
}

export default function CajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();

  const [sesion, setSesion] = useState<CajaSesion | null>(null);
  const [movimientos, setMovimientos] = useState<CajaMovimiento[]>([]);
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focused, setFocused] = useState(false);

  const cargar = useCallback(
    async (silent = false): Promise<void> => {
      if (!silent) setLoading(true);
      try {
        const res = await cajaApi.estado();
        setSesion(res);

        if (res) {
          const [movs, ventasRes] = await Promise.all([
            cajaApi.movimientos(res.id).catch(() => []),
            ventasApi
              .listar({ limit: 500 })
              .catch(() => ({ items: [], total: 0 })),
          ]);
          setMovimientos(movs);
          setVentas(ventasRes.items);
        } else {
          setMovimientos([]);
          setVentas([]);
        }
      } catch {
        setSesion(null);
        setMovimientos([]);
        setVentas([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // Cargar al enfocar
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void cargar();
      return () => setFocused(false);
    }, [cargar]),
  );

  // Polling silencioso mientras la pantalla está enfocada
  usePolling(
    () => {
      void cargar(true);
    },
    POLL_MS,
    focused,
  );

  const totales = useMemo<Totales>(() => {
    if (!sesion) {
      return {
        ventasTurno: 0,
        ventasCantidad: 0,
        ingresosManuales: 0,
        egresosManuales: 0,
      };
    }

    const desdeMovs = calcularDesdeMovimientos(movimientos);
    const desdeVentas = calcularDesdeVentas(ventas, sesion.abierta_at);

    const ventasTurno = Math.max(
      desdeMovs.ventasTurno,
      desdeVentas.ventasTurno,
    );
    const ventasCantidad =
      ventasTurno === desdeMovs.ventasTurno
        ? desdeMovs.ventasCantidad
        : desdeVentas.ventasCantidad;

    const ingresosManuales =
      desdeMovs.ingresosManuales > 0
        ? desdeMovs.ingresosManuales
        : parseFloat(sesion.total_ingresos) || 0;
    const egresosManuales =
      desdeMovs.egresosManuales > 0
        ? desdeMovs.egresosManuales
        : parseFloat(sesion.total_egresos) || 0;

    return {
      ventasTurno,
      ventasCantidad,
      ingresosManuales,
      egresosManuales,
    };
  }, [sesion, movimientos, ventas]);

  const efectivoEnCaja = useMemo(() => {
    if (!sesion) return 0;
    return (
      (parseFloat(sesion.monto_apertura) || 0) +
      totales.ventasTurno +
      totales.ingresosManuales -
      totales.egresosManuales
    );
  }, [sesion, totales]);

  if (loading && !sesion) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <TopBar title="Caja" onBack={() => navigation.goBack()} />
        <Loader message="Cargando estado de caja" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Caja"
        onBack={() => navigation.goBack()}
        rightIcon="history"
        onRightPress={() => navigation.navigate('CajaHistorial' as never)}
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
        {sesion === null ? (
          <Card variant="elevated" style={styles.emptyCard}>
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.bgSubtle }]}
            >
              <MaterialCommunityIcons
                name="cash-register"
                size={32}
                color={colors.textMuted}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Caja cerrada
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Abre la caja para comenzar a registrar ventas de tu turno.
            </Text>
            <View style={{ marginTop: spacing.xl, width: '100%' }}>
              <Button
                label="Abrir caja"
                icon="lock-open-outline"
                onPress={() => navigation.navigate('AbrirCaja' as never)}
                fullWidth
                variant="primary"
                size="lg"
              />
            </View>
          </Card>
        ) : (
          <>
            <Card variant="elevated" style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={[styles.heroLabel, { color: colors.textMuted }]}>
                    Caja abierta
                  </Text>
                  <Text
                    style={[styles.heroMonto, { color: colors.textPrimary }]}
                  >
                    {formatCurrency(sesion.monto_apertura)}
                  </Text>
                </View>
                <Badge label="Activa" variant="success" />
              </View>
              <Text style={[styles.heroFecha, { color: colors.textMuted }]}>
                Desde {formatDateTime(sesion.abierta_at)}
              </Text>
            </Card>

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              TOTALES DEL TURNO
            </Text>
            <View style={styles.grid}>
              <TotalCard
                icon="receipt"
                label="Ventas del turno"
                sublabel={`${totales.ventasCantidad} ${
                  totales.ventasCantidad === 1 ? 'venta' : 'ventas'
                }`}
                value={formatCurrency(totales.ventasTurno)}
                color={colors.accent}
              />
              <TotalCard
                icon="cash-plus"
                label="Ingresos manuales"
                sublabel="Registrados por vos"
                value={formatCurrency(totales.ingresosManuales)}
                color={colors.success}
              />
              <TotalCard
                icon="cash-minus"
                label="Egresos manuales"
                sublabel="Registrados por vos"
                value={formatCurrency(totales.egresosManuales)}
                color={colors.danger}
              />
              <TotalCard
                icon="calculator-variant"
                label="Efectivo en caja"
                sublabel="Apertura + ventas + mov."
                value={formatCurrency(efectivoEnCaja)}
                color={colors.primary}
              />
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <Button
                label="Registrar movimiento"
                icon="swap-horizontal"
                variant="outline"
                onPress={() =>
                  navigation.navigate(
                    'CajaMovimientoForm' as never,
                    { sesionId: sesion.id } as never,
                  )
                }
                fullWidth
              />
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label="Cerrar caja"
                icon="lock-outline"
                variant="danger"
                onPress={() =>
                  navigation.navigate(
                    'CerrarCaja' as never,
                    { sesionId: sesion.id } as never,
                  )
                }
                fullWidth
              />
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              MOVIMIENTOS MANUALES (
              {
                movimientos.filter(
                  (m) => m.tipo === 'ingreso' || m.tipo === 'egreso',
                ).length
              }
              )
            </Text>
            {movimientos.filter(
              (m) => m.tipo === 'ingreso' || m.tipo === 'egreso',
            ).length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Aún no registraste ingresos ni egresos
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
                {movimientos
                  .filter((m) => m.tipo === 'ingreso' || m.tipo === 'egreso')
                  .map((m, idx, arr) => {
                    const isIngreso = m.tipo === 'ingreso';
                    const tint = isIngreso ? colors.success : colors.danger;
                    const bgTint = isIngreso
                      ? colors.successSubtle
                      : colors.dangerSubtle;
                    const icon: keyof typeof MaterialCommunityIcons.glyphMap =
                      isIngreso
                        ? 'arrow-down-circle-outline'
                        : 'arrow-up-circle-outline';
                    const label = isIngreso ? 'Ingreso' : 'Egreso';
                    const sign = isIngreso ? '+' : '-';

                    return (
                      <View
                        key={m.id}
                        style={[
                          styles.movRow,
                          { borderBottomColor: colors.border },
                          idx === arr.length - 1 ? styles.movRowLast : null,
                        ]}
                      >
                        <View
                          style={[styles.movIcon, { backgroundColor: bgTint }]}
                        >
                          <MaterialCommunityIcons
                            name={icon}
                            size={16}
                            color={tint}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={[
                              styles.movTitulo,
                              { color: colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {m.descripcion ?? label}
                          </Text>
                          <Text
                            style={[styles.movSub, { color: colors.textMuted }]}
                          >
                            {label} · {m.metodo_pago} ·{' '}
                            {formatDateTime(m.created_at)}
                          </Text>
                        </View>
                        <Text style={[styles.movMonto, { color: tint }]}>
                          {sign}
                          {formatCurrency(m.monto)}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TotalCard(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  sublabel?: string;
  value: string;
  color: string;
}): React.ReactElement {
  const colors = useColors();
  return (
    <View
      style={[
        styles.totalCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.totalIcon, { backgroundColor: props.color + '15' }]}>
        <MaterialCommunityIcons
          name={props.icon}
          size={18}
          color={props.color}
        />
      </View>
      <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
        {props.label}
      </Text>
      <Text
        style={[styles.totalValue, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {props.value}
      </Text>
      {props.sublabel ? (
        <Text style={[styles.totalSub, { color: colors.textMuted }]}>
          {props.sublabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  emptyCard: { alignItems: 'center', padding: spacing.xxl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroCard: { marginBottom: spacing.xl },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heroLabel: { ...typography.small },
  heroMonto: {
    ...typography.price,
    marginTop: 4,
  },
  heroFecha: { ...typography.small },
  sectionLabel: {
    ...typography.overline,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  totalCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  totalIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: { ...typography.small },
  totalValue: {
    ...typography.bodyBold,
    marginTop: 2,
  },
  totalSub: {
    ...typography.tiny,
    marginTop: 2,
  },
  emptyBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { ...typography.caption },
  listBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  movRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  movRowLast: { borderBottomWidth: 0 },
  movIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movTitulo: { ...typography.bodyBold },
  movSub: { ...typography.small, marginTop: 2 },
  movMonto: {
    ...typography.bodyBold,
    fontFamily: typography.button.fontFamily,
  },
});