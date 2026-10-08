import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import {
  reportesApi,
  ventasApi,
  productosApi,
  configuracionApi,
} from '@api/index';
import type {
  ReporteResumen,
  VentaPorDia,
  ProductoMasVendido,
  ReporteCartera,
  Producto,
} from '@tipos/index';
import { formatCurrency, toISODate } from '@utils/format';
import { pdfService } from '@services/pdf.service';
import { excelService } from '@services/excel.service';
import Card from '@components/ui/Card';
import Badge from '@components/ui/Badge';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';
import TopBar from '@components/layout/TopBar';
import Button from '@components/ui/Button';
import { LineChartCard } from '@components/charts';

type Periodo = '7d' | '30d' | '90d';

export default function ReportesScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();

  const [periodo, setPeriodo] = useState<Periodo>('30d');
  const [resumen, setResumen] = useState<ReporteResumen | null>(null);
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([]);
  const [topProductos, setTopProductos] = useState<ProductoMasVendido[]>([]);
  const [cartera, setCartera] = useState<ReporteCartera | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [negocio, setNegocio] = useState({
    nombre: 'Mi Tienda',
    nit: '',
    telefono: '',
    direccion: '',
    logo: '',
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportando, setExportando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRango = (p: Periodo): { desde: string; hasta: string } => {
    const hoy = new Date();
    const dias = p === '7d' ? 7 : p === '30d' ? 30 : 90;
    const desde = new Date(hoy.getTime() - dias * 24 * 60 * 60 * 1000);
    return { desde: toISODate(desde), hasta: toISODate(hoy) };
  };

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const rango = getRango(periodo);
      const [r, vd, tp, c, prodsRes, config] = await Promise.all([
        reportesApi.resumen(),
        reportesApi.ventasPorDia(rango.desde, rango.hasta),
        reportesApi.productosMasVendidos(5),
        reportesApi.cartera(),
        productosApi.listar({ activo: 1, limit: 500 }),
        configuracionApi.obtener().catch(() => null),
      ]);
      setResumen(r);
      setVentasPorDia(vd);
      setTopProductos(tp);
      setCartera(c);
      setProductos(prodsRes.items);

      if (config?.negocio) {
        setNegocio({
          nombre: String(config.negocio.negocio_nombre ?? 'Mi Tienda'),
          nit: String(config.negocio.negocio_nit ?? ''),
          telefono: String(config.negocio.negocio_telefono ?? ''),
          direccion: String(config.negocio.negocio_direccion ?? ''),
          logo: String(config.negocio.logo_url ?? ''),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
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

  const exportarVentasPDF = async (): Promise<void> => {
    setExportando('ventas-pdf');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const rango = getRango(periodo);
      const res = await ventasApi.listar({ limit: 500 });

      await pdfService.generarReporteVentas({
        desde: rango.desde,
        hasta: rango.hasta,
        totalVentas: res.total,
        montoTotal: resumen?.ventas_hoy.monto ?? '0',
        ticketPromedio:
          res.total > 0
            ? String(
                parseFloat(resumen?.ventas_hoy.monto ?? '0') / res.total,
              )
            : '0',
        ventas: res.items.map((v) => ({
          id: v.id,
          numero: v.numero,
          fecha: v.created_at,
          cliente: v.cliente_nombre ?? 'Consumidor final',
          vendedor: v.usuario_nombre ?? '-',
          tipoPago: v.tipo_pago === 'credito' ? 'Crédito' : 'Contado',
          total: v.total,
          estado: v.estado,
        })),
        negocio,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  const exportarVentasExcel = async (): Promise<void> => {
    setExportando('ventas-excel');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await ventasApi.listar({ limit: 500 });

      await excelService.generarReporteVentas(
        res.items.map((v) => ({
          numero: v.numero,
          fecha: v.created_at,
          cliente: v.cliente_nombre ?? 'Consumidor final',
          vendedor: v.usuario_nombre ?? '-',
          tipoPago: v.tipo_pago === 'credito' ? 'Crédito' : 'Contado',
          total: v.total,
          estado: v.estado,
        })),
      );

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  const exportarInventarioPDF = async (): Promise<void> => {
    setExportando('inventario-pdf');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const valorTotal = productos.reduce(
        (sum, p) => sum + p.stock * parseFloat(p.precio_compra),
        0,
      );

      await pdfService.generarReporteInventario({
        totalProductos: productos.length,
        valorTotal: String(valorTotal),
        productos: productos.map((p) => ({
          codigo: p.codigo_barras,
          nombre: p.nombre,
          categoria: p.categoria_nombre ?? 'Sin categoría',
          stock: p.stock,
          stockMinimo: p.stock_minimo,
          precioCompra: p.precio_compra,
          precioVenta: p.precio_venta,
          valorTotal: String(p.stock * parseFloat(p.precio_compra)),
        })),
        negocio,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  const exportarInventarioExcel = async (): Promise<void> => {
    setExportando('inventario-excel');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await excelService.generarReporteInventario(
        productos.map((p) => ({
          codigo: p.codigo_barras,
          nombre: p.nombre,
          categoria: p.categoria_nombre ?? 'Sin categoría',
          stock: p.stock,
          stockMinimo: p.stock_minimo,
          precioCompra: p.precio_compra,
          precioVenta: p.precio_venta,
        })),
      );

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  const exportarCarteraPDF = async (): Promise<void> => {
    if (!cartera) return;
    setExportando('cartera-pdf');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await pdfService.generarReporteCartera({
        totalCartera: cartera.total_cartera,
        totalClientes: cartera.clientes.length,
        clientes: cartera.clientes.map((c) => ({
          nombre: c.nombre,
          documento: c.documento ?? '-',
          telefono: c.telefono ?? '-',
          cupo: c.cupo_credito,
          deuda: c.saldo_deuda,
          disponible: c.cupo_disponible,
        })),
        negocio,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  const exportarCarteraExcel = async (): Promise<void> => {
    if (!cartera) return;
    setExportando('cartera-excel');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await excelService.generarReporteCartera(
        cartera.clientes.map((c) => ({
          nombre: c.nombre,
          documento: c.documento ?? '-',
          telefono: c.telefono ?? '-',
          cupo: c.cupo_credito,
          deuda: c.saldo_deuda,
          disponible: c.cupo_disponible,
        })),
      );

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  const hayDatosGrafico = ventasPorDia.length >= 2;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar title="Reportes" onBack={() => navigation.goBack()} />

      {loading && !resumen ? (
        <View style={{ padding: spacing.lg }}>
          <View style={styles.kpiGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.kpiCard,
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
              </View>
            ))}
          </View>
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          description={error}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      ) : (
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
          <View style={styles.periodoRow}>
            <PeriodoBtn
              label="7 días"
              active={periodo === '7d'}
              onPress={() => setPeriodo('7d')}
            />
            <PeriodoBtn
              label="30 días"
              active={periodo === '30d'}
              onPress={() => setPeriodo('30d')}
            />
            <PeriodoBtn
              label="90 días"
              active={periodo === '90d'}
              onPress={() => setPeriodo('90d')}
            />
          </View>

          {resumen ? (
            <View style={styles.kpiGrid}>
              <KpiCard
                label="Ventas hoy"
                value={formatCurrency(resumen.ventas_hoy.monto)}
                sub={`${resumen.ventas_hoy.cantidad} trans.`}
              />
              <KpiCard
                label="Productos"
                value={String(resumen.productos_activos)}
                sub="Activos"
              />
              <KpiCard
                label="Stock bajo"
                value={String(resumen.alertas_stock)}
                sub="Reposición"
                valueColor={
                  resumen.alertas_stock > 0 ? colors.warning : undefined
                }
              />
              <KpiCard
                label="Cartera"
                value={formatCurrency(resumen.cartera_total)}
                sub="Por cobrar"
              />
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            EXPORTAR VENTAS
          </Text>
          <Card variant="default" style={styles.exportCard}>
            <View style={styles.exportRow}>
              <View
                style={[
                  styles.exportIconWrap,
                  { backgroundColor: colors.bgSubtle },
                ]}
              >
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={24}
                  color={colors.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.exportTitle, { color: colors.textPrimary }]}
                >
                  Reporte de ventas
                </Text>
                <Text
                  style={[styles.exportSub, { color: colors.textMuted }]}
                >
                  PDF con todas las ventas del período
                </Text>
              </View>
            </View>
            <View style={styles.exportBtns}>
              <View style={{ flex: 1 }}>
                <Button
                  label="PDF"
                  onPress={exportarVentasPDF}
                  loading={exportando === 'ventas-pdf'}
                  disabled={exportando !== null}
                  variant="outline"
                  size="sm"
                  icon="file-pdf-box"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Excel"
                  onPress={exportarVentasExcel}
                  loading={exportando === 'ventas-excel'}
                  disabled={exportando !== null}
                  variant="outline"
                  size="sm"
                  icon="file-excel"
                  fullWidth
                />
              </View>
            </View>
          </Card>

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            EXPORTAR INVENTARIO
          </Text>
          <Card variant="default" style={styles.exportCard}>
            <View style={styles.exportRow}>
              <View
                style={[
                  styles.exportIconWrap,
                  { backgroundColor: colors.bgSubtle },
                ]}
              >
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={24}
                  color={colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.exportTitle, { color: colors.textPrimary }]}
                >
                  Inventario valorizado
                </Text>
                <Text
                  style={[styles.exportSub, { color: colors.textMuted }]}
                >
                  {productos.length} productos ·{' '}
                  {formatCurrency(
                    productos.reduce(
                      (s, p) => s + p.stock * parseFloat(p.precio_compra),
                      0,
                    ),
                  )}
                </Text>
              </View>
            </View>
            <View style={styles.exportBtns}>
              <View style={{ flex: 1 }}>
                <Button
                  label="PDF"
                  onPress={exportarInventarioPDF}
                  loading={exportando === 'inventario-pdf'}
                  disabled={exportando !== null}
                  variant="outline"
                  size="sm"
                  icon="file-pdf-box"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Excel"
                  onPress={exportarInventarioExcel}
                  loading={exportando === 'inventario-excel'}
                  disabled={exportando !== null}
                  variant="outline"
                  size="sm"
                  icon="file-excel"
                  fullWidth
                />
              </View>
            </View>
          </Card>

          {cartera ? (
            <>
              <Text
                style={[styles.sectionLabel, { color: colors.textMuted }]}
              >
                EXPORTAR CARTERA
              </Text>
              <Card variant="default" style={styles.exportCard}>
                <View style={styles.exportRow}>
                  <View
                    style={[
                      styles.exportIconWrap,
                      { backgroundColor: colors.bgSubtle },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-cash"
                      size={24}
                      color={colors.warning}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.exportTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Deudas por cobrar
                    </Text>
                    <Text
                      style={[styles.exportSub, { color: colors.textMuted }]}
                    >
                      {cartera.clientes.length} clientes ·{' '}
                      {formatCurrency(cartera.total_cartera)}
                    </Text>
                  </View>
                </View>
                <View style={styles.exportBtns}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="PDF"
                      onPress={exportarCarteraPDF}
                      loading={exportando === 'cartera-pdf'}
                      disabled={exportando !== null}
                      variant="outline"
                      size="sm"
                      icon="file-pdf-box"
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Excel"
                      onPress={exportarCarteraExcel}
                      loading={exportando === 'cartera-excel'}
                      disabled={exportando !== null}
                      variant="outline"
                      size="sm"
                      icon="file-excel"
                      fullWidth
                    />
                  </View>
                </View>
              </Card>
            </>
          ) : null}

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            VENTAS ÚLTIMOS DÍAS
          </Text>
          {hayDatosGrafico ? (
            <LineChartCard
              title="Ventas por día"
              data={ventasPorDia.slice(-14).map((d) => ({
                label: d.dia.slice(5),
                value: parseFloat(d.monto_total) || 0,
              }))}
              formatValue={(v) => formatCurrency(v)}
            />
          ) : (
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
                Sin datos suficientes
              </Text>
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            TOP PRODUCTOS
          </Text>
          {topProductos.length === 0 ? (
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
                Sin ventas registradas
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
              {topProductos.map((p, idx) => (
                <View
                  key={p.id}
                  style={[
                    styles.topRow,
                    { borderBottomColor: colors.border },
                    idx === topProductos.length - 1
                      ? styles.topRowLast
                      : null,
                  ]}
                >
                  <View
                    style={[
                      styles.rank,
                      { backgroundColor: colors.bgSubtle },
                    ]}
                  >
                    <Text
                      style={[styles.rankText, { color: colors.textPrimary }]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text
                      style={[styles.topNombre, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {p.nombre}
                    </Text>
                    <Text style={[styles.topSub, { color: colors.textMuted }]}>
                      {p.unidades_vendidas} und ·{' '}
                      {formatCurrency(p.monto_total)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {cartera ? (
            <>
              <Text
                style={[styles.sectionLabel, { color: colors.textMuted }]}
              >
                CARTERA POR CLIENTE
              </Text>
              <View
                style={[
                  styles.carteraTotal,
                  { backgroundColor: colors.dangerSubtle },
                ]}
              >
                <Text
                  style={[
                    styles.carteraTotalLabel,
                    { color: colors.dangerText },
                  ]}
                >
                  Total por cobrar
                </Text>
                <Text
                  style={[
                    styles.carteraTotalValue,
                    { color: colors.danger },
                  ]}
                >
                  {formatCurrency(cartera.total_cartera)}
                </Text>
              </View>
              {cartera.clientes.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.emptyText, { color: colors.textMuted }]}
                  >
                    Sin deudas pendientes
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
                  {cartera.clientes.slice(0, 10).map((c, idx) => (
                    <View
                      key={c.id}
                      style={[
                        styles.topRow,
                        { borderBottomColor: colors.border },
                        idx === cartera.clientes.length - 1
                          ? styles.topRowLast
                          : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.avatarSmall,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarSmallText,
                            { color: colors.textInverse },
                          ]}
                        >
                          {c.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text
                          style={[
                            styles.topNombre,
                            { color: colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {c.nombre}
                        </Text>
                        <Text
                          style={[styles.topSub, { color: colors.textMuted }]}
                        >
                          Cupo {formatCurrency(c.cupo_credito)} · Disp{' '}
                          {formatCurrency(c.cupo_disponible)}
                        </Text>
                      </View>
                      <Badge
                        label={formatCurrency(c.saldo_deuda)}
                        variant="danger"
                        size="sm"
                      />
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      )}

      {exportando ? (
        <View
          style={[
            styles.overlay,
            { backgroundColor: 'rgba(0,0,0,0.5)' },
          ]}
        >
          <View
            style={[
              styles.overlayCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <ActivityIndicator size="large" color={colors.textPrimary} />
            <Text style={[styles.overlayText, { color: colors.textPrimary }]}>
              Generando reporte...
            </Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function PeriodoBtn(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.periodoBtn,
        {
          backgroundColor: props.active ? colors.primary : colors.surface,
          borderColor: props.active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.periodoLabel,
          {
            color: props.active ? colors.textInverse : colors.textSecondary,
          },
          props.active ? styles.periodoLabelActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function KpiCard(props: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}): React.ReactElement {
  const colors = useColors();

  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
        {props.label}
      </Text>
      <Text
        style={[
          styles.kpiValue,
          { color: props.valueColor ?? colors.textPrimary },
        ]}
        numberOfLines={1}
      >
        {props.value}
      </Text>
      <Text style={[styles.kpiSub, { color: colors.textMuted }]} numberOfLines={1}>
        {props.sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  periodoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  periodoLabel: { ...typography.small },
  periodoLabelActive: { fontFamily: typography.button.fontFamily },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  kpiLabel: { ...typography.small },
  kpiValue: { ...typography.price, marginTop: spacing.xs },
  kpiSub: { ...typography.small, marginTop: 2 },
  sectionLabel: {
    ...typography.overline,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  exportCard: { marginBottom: spacing.sm },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  exportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTitle: { ...typography.bodyBold },
  exportSub: { ...typography.small, marginTop: 2 },
  exportBtns: { flexDirection: 'row', gap: spacing.sm },
  emptyBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { ...typography.caption },
  listBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  topRowLast: { borderBottomWidth: 0 },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { ...typography.bodyBold },
  topNombre: { ...typography.bodyBold },
  topSub: { ...typography.small, marginTop: 2 },
  carteraTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  carteraTotalLabel: { ...typography.bodyBold },
  carteraTotalValue: { ...typography.price },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: { ...typography.bodyBold },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayCard: {
    padding: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 200,
  },
  overlayText: { ...typography.bodyBold },
});