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

import { colors, radius, spacing, typography } from '@theme/index';
import { reportesApi, ventasApi, productosApi, configuracionApi } from '@api/index';
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

  // ================ EXPORTAR VENTAS PDF ================
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
            ? String(parseFloat(resumen?.ventas_hoy.monto ?? '0') / res.total)
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  // ================ EXPORTAR VENTAS EXCEL ================
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  // ================ EXPORTAR INVENTARIO PDF ================
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  // ================ EXPORTAR INVENTARIO EXCEL ================
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  // ================ EXPORTAR CARTERA PDF ================
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  // ================ EXPORTAR CARTERA EXCEL ================
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportando(null);
    }
  };

  const hayDatosGrafico = ventasPorDia.length >= 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Reportes" onBack={() => navigation.goBack()} />

      {loading && !resumen ? (
        <View style={{ padding: spacing.lg }}>
          <View style={styles.kpiGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.kpiCard}>
                <Skeleton width="60%" height={12} />
                <Skeleton width="80%" height={22} style={{ marginTop: spacing.sm }} />
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
          {/* Selector de período */}
          <View style={styles.periodoRow}>
            <PeriodoBtn label="7 días" active={periodo === '7d'} onPress={() => setPeriodo('7d')} />
            <PeriodoBtn label="30 días" active={periodo === '30d'} onPress={() => setPeriodo('30d')} />
            <PeriodoBtn label="90 días" active={periodo === '90d'} onPress={() => setPeriodo('90d')} />
          </View>

          {/* KPIs */}
          {resumen ? (
            <View style={styles.kpiGrid}>
              <KpiCard label="Ventas hoy" value={formatCurrency(resumen.ventas_hoy.monto)} sub={`${resumen.ventas_hoy.cantidad} trans.`} />
              <KpiCard label="Productos" value={String(resumen.productos_activos)} sub="Activos" />
              <KpiCard label="Stock bajo" value={String(resumen.alertas_stock)} sub="Reposición" valueColor={resumen.alertas_stock > 0 ? colors.warning : undefined} />
              <KpiCard label="Cartera" value={formatCurrency(resumen.cartera_total)} sub="Por cobrar" />
            </View>
          ) : null}

          {/* Exportar Ventas */}
          <Text style={styles.sectionLabel}>EXPORTAR VENTAS</Text>
          <Card variant="default" style={styles.exportCard}>
            <View style={styles.exportRow}>
              <View style={styles.exportIconWrap}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportTitle}>Reporte de ventas</Text>
                <Text style={styles.exportSub}>PDF con todas las ventas del período</Text>
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

          {/* Exportar Inventario */}
          <Text style={styles.sectionLabel}>EXPORTAR INVENTARIO</Text>
          <Card variant="default" style={styles.exportCard}>
            <View style={styles.exportRow}>
              <View style={styles.exportIconWrap}>
                <MaterialCommunityIcons name="package-variant-closed" size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportTitle}>Inventario valorizado</Text>
                <Text style={styles.exportSub}>
                  {productos.length} productos · {formatCurrency(
                    productos.reduce((s, p) => s + p.stock * parseFloat(p.precio_compra), 0),
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

          {/* Exportar Cartera */}
          {cartera ? (
            <>
              <Text style={styles.sectionLabel}>EXPORTAR CARTERA</Text>
              <Card variant="default" style={styles.exportCard}>
                <View style={styles.exportRow}>
                  <View style={styles.exportIconWrap}>
                    <MaterialCommunityIcons name="account-cash" size={24} color={colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportTitle}>Deudas por cobrar</Text>
                    <Text style={styles.exportSub}>
                      {cartera.clientes.length} clientes · {formatCurrency(cartera.total_cartera)}
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

          {/* Gráfico ventas */}
          <Text style={styles.sectionLabel}>VENTAS ÚLTIMOS DÍAS</Text>
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
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Sin datos suficientes</Text>
            </View>
          )}

          {/* Top productos */}
          <Text style={styles.sectionLabel}>TOP PRODUCTOS</Text>
          {topProductos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Sin ventas registradas</Text>
            </View>
          ) : (
            <View style={styles.listBox}>
              {topProductos.map((p, idx) => (
                <View
                  key={p.id}
                  style={[
                    styles.topRow,
                    idx === topProductos.length - 1 ? styles.topRowLast : null,
                  ]}
                >
                  <View style={styles.rank}>
                    <Text style={styles.rankText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.topNombre} numberOfLines={1}>{p.nombre}</Text>
                    <Text style={styles.topSub}>{p.unidades_vendidas} und · {formatCurrency(p.monto_total)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Cartera */}
          {cartera ? (
            <>
              <Text style={styles.sectionLabel}>CARTERA POR CLIENTE</Text>
              <View style={styles.carteraTotal}>
                <Text style={styles.carteraTotalLabel}>Total por cobrar</Text>
                <Text style={styles.carteraTotalValue}>{formatCurrency(cartera.total_cartera)}</Text>
              </View>
              {cartera.clientes.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Sin deudas pendientes</Text>
                </View>
              ) : (
                <View style={styles.listBox}>
                  {cartera.clientes.slice(0, 10).map((c, idx) => (
                    <View
                      key={c.id}
                      style={[
                        styles.topRow,
                        idx === cartera.clientes.length - 1 ? styles.topRowLast : null,
                      ]}
                    >
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>
                          {c.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={styles.topNombre} numberOfLines={1}>{c.nombre}</Text>
                        <Text style={styles.topSub}>
                          Cupo {formatCurrency(c.cupo_credito)} · Disp {formatCurrency(c.cupo_disponible)}
                        </Text>
                      </View>
                      <Badge label={formatCurrency(c.saldo_deuda)} variant="danger" size="sm" />
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      )}

      {/* Overlay de exportación */}
      {exportando ? (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
            <Text style={styles.overlayText}>Generando reporte...</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function PeriodoBtn(props: { label: string; active: boolean; onPress: () => void }): React.ReactElement {
  return (
    <Pressable onPress={props.onPress} style={[styles.periodoBtn, props.active ? styles.periodoBtnActive : null]}>
      <Text style={[styles.periodoLabel, props.active ? styles.periodoLabelActive : null]}>{props.label}</Text>
    </Pressable>
  );
}

function KpiCard(props: { label: string; value: string; sub: string; valueColor?: string }): React.ReactElement {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{props.label}</Text>
      <Text style={[styles.kpiValue, props.valueColor ? { color: props.valueColor } : null]} numberOfLines={1}>{props.value}</Text>
      <Text style={styles.kpiSub} numberOfLines={1}>{props.sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  periodoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  periodoBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  periodoBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodoLabel: { ...typography.small, color: colors.textSecondary },
  periodoLabelActive: { color: colors.textInverse, fontFamily: typography.button.fontFamily },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  kpiCard: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  kpiLabel: { ...typography.small, color: colors.textSecondary },
  kpiValue: { ...typography.price, color: colors.textPrimary, marginTop: spacing.xs },
  kpiSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  sectionLabel: { ...typography.overline, color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.md },
  exportCard: { marginBottom: spacing.sm },
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  exportIconWrap: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' },
  exportTitle: { ...typography.bodyBold, color: colors.textPrimary },
  exportSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  exportBtns: { flexDirection: 'row', gap: spacing.sm },
  emptyBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.caption, color: colors.textMuted },
  listBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  topRowLast: { borderBottomWidth: 0 },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' },
  rankText: { ...typography.bodyBold, color: colors.textPrimary },
  topNombre: { ...typography.bodyBold, color: colors.textPrimary },
  topSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  carteraTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, backgroundColor: colors.dangerSubtle, borderRadius: radius.lg, marginBottom: spacing.md },
  carteraTotalLabel: { ...typography.bodyBold, color: colors.dangerText },
  carteraTotalValue: { ...typography.price, color: colors.danger },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { ...typography.bodyBold, color: colors.textInverse },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  overlayCard: { backgroundColor: colors.surface, padding: spacing.xxl, borderRadius: radius.lg, alignItems: 'center', gap: spacing.md, minWidth: 200 },
  overlayText: { ...typography.bodyBold, color: colors.textPrimary },
});