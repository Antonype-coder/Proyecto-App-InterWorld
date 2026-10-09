import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
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
import type { AppColors } from '@theme/colors';
import { useReturnTo } from '@hooks/useReturnTo';
import { useConfirm } from '@components/feedback/ConfirmProvider';
import {
  productosApi,
  promocionesApi,
  type ProductoEstadisticas,
} from '@api/index';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import type {
  Producto,
  Promocion,
  ProductosStackParamList,
} from '@tipos/index';
import { formatCurrency, formatDate } from '@utils/format';
import { labelDePromocion, analizarPromocion } from '@utils/promociones';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Loader from '@components/ui/Loader';
import ErrorState from '@components/feedback/ErrorState';
import TopBar from '@components/layout/TopBar';
import ProductoImageCarousel from '@components/domain/ProductoImageCarousel';

type Params = RouteProp<ProductosStackParamList, 'ProductoDetalle'>;

export default function ProductoDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const productId = route.params.productId;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const goTo = useReturnTo();
  const confirm = useConfirm();
  const showToast = useUIStore((s) => s.showToast);

  const user = useAuthStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const [producto, setProducto] = useState<Producto | null>(null);
  const [stats, setStats] = useState<ProductoEstadisticas | null>(null);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const p = await productosApi.obtener(productId);
      setProducto(p);

      const [s, todasPromos] = await Promise.all([
        productosApi.estadisticas(productId).catch(() => null),
        promocionesApi.listar({ activo: 1 }).catch(() => []),
      ]);

      setStats(s);

      // Filtrar promos que aplican a este producto Y están vigentes por fecha
      const hoy = new Date();
      const aplicables = todasPromos.filter((promo) => {
        // Fecha vigente
        const ini = new Date(promo.fecha_inicio);
        const fin = new Date(promo.fecha_fin);
        if (hoy < ini || hoy > fin) return false;

        // Aplicación por tipo
        if (promo.aplica_a === 'global') return true;
        if (promo.aplica_a === 'producto') {
          return Number(promo.producto_id) === Number(p.id);
        }
        if (promo.aplica_a === 'categoria') {
          return (
            p.categoria_id != null &&
            Number(promo.categoria_id) === Number(p.categoria_id)
          );
        }
        return false;
      });

      setPromos(aplicables);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar producto');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const desactivar = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Desactivar producto',
      message:
        'El producto dejará de aparecer en el POS. Puedes reactivarlo cuando quieras.',
      confirmLabel: 'Desactivar',
      variant: 'warning',
    });
    if (!ok) return;

    try {
      await productosApi.eliminar(productId);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast('Producto desactivado.', 'success');
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al desactivar';
      showToast(msg, 'error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <Header onBack={() => navigation.goBack()} />
        <Loader message="Cargando producto" />
      </SafeAreaView>
    );
  }

  if (error || !producto) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <Header onBack={() => navigation.goBack()} />
        <ErrorState
          title="No pudimos cargar el producto"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error ?? undefined}
          onRetry={cargar}
        />
      </SafeAreaView>
    );
  }

  const stockInfo = getStockInfo(producto.stock, producto.stock_minimo, colors);
  const tienePromo = promos.length > 0;
  const precioVenta = parseFloat(producto.precio_venta);
  const precioCompra = parseFloat(producto.precio_compra);

  // Elegir la promo que más descuenta
  const analisis =
    tienePromo
      ? analizarPromocion(
          promos.reduce((mejor, actual) => {
            const dMejor = analizarPromocion(mejor, precioVenta, precioCompra)
              .descuento;
            const dActual = analizarPromocion(
              actual,
              precioVenta,
              precioCompra,
            ).descuento;
            return dActual > dMejor ? actual : mejor;
          }, promos[0]),
          precioVenta,
          precioCompra,
        )
      : null;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <Header
        onBack={() => navigation.goBack()}
        onEdit={
          esAdmin
            ? () =>
                navigation.navigate(
                  'ProductoForm' as never,
                  { productId } as never,
                )
            : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <ProductoImageCarousel
            images={
              producto.imagenes?.length
                ? producto.imagenes
                : producto.imagen
                  ? [producto.imagen]
                  : []
            }
            height={220}
          />

          {tienePromo && analisis ? (
            <View
              style={[
                styles.promoHeroBadge,
                { backgroundColor: colors.success },
              ]}
            >
              <MaterialCommunityIcons name="tag" size={14} color="#FFFFFF" />
              <Text style={styles.promoHeroText}>
                EN PROMOCIÓN · {labelDePromocion(analisis.promo)}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.nombre, { color: colors.textPrimary }]}>
            {producto.nombre}
          </Text>
          <Text style={[styles.codigo, { color: colors.textMuted }]}>
            {producto.codigo_barras}
          </Text>
          <View style={styles.badgeRow}>
            <Badge label={stockInfo.label} variant={stockInfo.variant} />
            <Badge
              label={producto.activo === 1 ? 'Activo' : 'Inactivo'}
              variant={producto.activo === 1 ? 'success' : 'neutral'}
            />
          </View>
        </View>

        {/* PRECIOS */}
        <View style={styles.priceRow}>
          <View
            style={[
              styles.priceCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Precio de venta
            </Text>
            <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
              {formatCurrency(producto.precio_venta)}
            </Text>
          </View>
          <View
            style={[
              styles.priceCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Precio de compra
            </Text>
            <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
              {formatCurrency(producto.precio_compra)}
            </Text>
          </View>
        </View>

        {/* ============ PROMOCIÓN ACTIVA + ANÁLISIS ============ */}
        {tienePromo && analisis ? (
          <Card
            variant="default"
            style={[
              styles.section,
              { borderColor: colors.success, borderWidth: 1 },
            ]}
          >
            <View style={styles.promoHeaderRow}>
              <MaterialCommunityIcons
                name="tag-multiple"
                size={18}
                color={colors.success}
              />
              <Text style={[styles.sectionTitle, { color: colors.success }]}>
                Promoción vigente
              </Text>
              <View
                style={[
                  styles.liveBadge,
                  { backgroundColor: colors.success },
                ]}
              >
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>ACTIVA</Text>
              </View>
            </View>

            {/* Info de la promo */}
            <View
              style={[
                styles.promoInfoBox,
                { backgroundColor: colors.bgSubtle },
              ]}
            >
              <Text
                style={[styles.promoNombre, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {analisis.promo.nombre}
              </Text>
              <Text style={[styles.promoSub, { color: colors.textSecondary }]}>
                {labelDePromocion(analisis.promo)} ·{' '}
                {analisis.promo.aplica_a === 'global'
                  ? 'Todos los productos'
                  : analisis.promo.aplica_a === 'categoria'
                    ? 'Toda la categoría'
                    : 'Solo este producto'}
              </Text>
              <View style={styles.promoFechaRow}>
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={12}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.promoFecha, { color: colors.textMuted }]}
                >
                  Vigente hasta {formatDate(analisis.promo.fecha_fin)}
                </Text>
              </View>
            </View>

            {/* Ejemplo con cantidad de referencia */}
            <Text style={[styles.promoEjemplo, { color: colors.textSecondary }]}>
              Si vendes{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {analisis.cantidadReferencia}{' '}
                {analisis.cantidadReferencia === 1 ? 'unidad' : 'unidades'}
              </Text>
              :
            </Text>

            <View
              style={[styles.promoBox, { backgroundColor: colors.bgSubtle }]}
            >
              <Row
                label="Total sin promo"
                value={formatCurrency(analisis.totalBruto)}
                valueColor={colors.textPrimary}
              />
              <Row
                label="Descuento por promo"
                value={`−${formatCurrency(analisis.descuento)}`}
                valueColor={colors.success}
                icon="tag-outline"
              />
              <View
                style={[
                  styles.rowDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <Row
                label="Total cobrado"
                value={formatCurrency(analisis.totalNeto)}
                valueColor={colors.textPrimary}
                bold
              />
            </View>

            {/* Comparativa de ganancia */}
            <View
              style={[
                styles.gananciaBox,
                {
                  backgroundColor:
                    analisis.diferencia >= 0
                      ? colors.successSubtle
                      : colors.dangerSubtle,
                },
              ]}
            >
              <View style={styles.gananciaHeader}>
                <MaterialCommunityIcons
                  name={
                    analisis.diferencia >= 0
                      ? 'trending-up'
                      : 'trending-down'
                  }
                  size={20}
                  color={
                    analisis.diferencia >= 0 ? colors.success : colors.danger
                  }
                />
                <Text
                  style={[
                    styles.gananciaTitle,
                    {
                      color:
                        analisis.diferencia >= 0
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                >
                  {analisis.diferencia >= 0
                    ? 'Ganas igual o más'
                    : 'Pierdes ganancia'}
                </Text>
              </View>

              <View style={styles.gananciaComparativa}>
                <View style={styles.gananciaCol}>
                  <Text
                    style={[
                      styles.gananciaColLabel,
                      { color: colors.textMuted },
                    ]}
                  >
                    Sin promo
                  </Text>
                  <Text
                    style={[
                      styles.gananciaColValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {formatCurrency(analisis.gananciaSinPromo)}
                  </Text>
                  <Text
                    style={[
                      styles.gananciaColSub,
                      { color: colors.textMuted },
                    ]}
                  >
                    {analisis.margenSinPromo.toFixed(1)}% margen
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color={colors.textMuted}
                />

                <View style={styles.gananciaCol}>
                  <Text
                    style={[
                      styles.gananciaColLabel,
                      { color: colors.textMuted },
                    ]}
                  >
                    Con promo
                  </Text>
                  <Text
                    style={[
                      styles.gananciaColValue,
                      {
                        color:
                          analisis.diferencia >= 0
                            ? colors.success
                            : colors.danger,
                      },
                    ]}
                  >
                    {formatCurrency(analisis.gananciaConPromo)}
                  </Text>
                  <Text
                    style={[
                      styles.gananciaColSub,
                      { color: colors.textMuted },
                    ]}
                  >
                    {analisis.margenConPromo.toFixed(1)}% margen
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.rowDivider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.difRow}>
                <Text
                  style={[styles.difLabel, { color: colors.textPrimary }]}
                >
                  {analisis.diferencia >= 0
                    ? 'Ganancia extra'
                    : 'Ganancia perdida'}
                </Text>
                <Text
                  style={[
                    styles.difValue,
                    {
                      color:
                        analisis.diferencia >= 0
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                >
                  {analisis.diferencia >= 0 ? '+' : ''}
                  {formatCurrency(analisis.diferencia)}
                </Text>
              </View>
            </View>

            {/* Botón editar */}
            <Pressable
              onPress={() =>
                navigation.navigate('Mas' as never, {
                  screen: 'PromocionForm',
                  params: { promocionId: analisis.promo.id },
                } as never)
              }
              style={({ pressed }) => [
                styles.editPromoBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={16}
                color={colors.textPrimary}
              />
              <Text
                style={[styles.editPromoText, { color: colors.textPrimary }]}
              >
                Editar promoción
              </Text>
            </Pressable>

            {/* Otras promos */}
            {promos.length > 1 ? (
              <View style={styles.otherPromosWrap}>
                <Text
                  style={[
                    styles.otherPromosTitle,
                    { color: colors.textMuted },
                  ]}
                >
                  OTRAS PROMOS APLICABLES ({promos.length - 1})
                </Text>
                {promos
                  .filter((p) => p.id !== analisis.promo.id)
                  .map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() =>
                        navigation.navigate('Mas' as never, {
                          screen: 'PromocionForm',
                          params: { promocionId: p.id },
                        } as never)
                      }
                      style={[
                        styles.otherPromoRow,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.otherPromoNombre,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {p.nombre}
                      </Text>
                      <Text
                        style={[
                          styles.otherPromoSub,
                          { color: colors.textMuted },
                        ]}
                      >
                        {labelDePromocion(p)}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            ) : null}
          </Card>
        ) : (
          <Card
            variant="default"
            style={[
              styles.section,
              { borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <View style={styles.promoHeaderRow}>
              <MaterialCommunityIcons
                name="tag-off-outline"
                size={18}
                color={colors.textMuted}
              />
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Sin promociones activas
              </Text>
            </View>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Este producto no tiene promociones vigentes. Crea una desde
              Más → Promociones.
            </Text>
          </Card>
        )}

        {/* ============ RENDIMIENTO HISTÓRICO ============ */}
        {stats && stats.unidades_vendidas > 0 ? (
          <Card variant="default" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Rendimiento real
            </Text>

            <View style={styles.statsRow}>
              <StatBox
                icon="package-variant"
                label="Unidades vendidas"
                value={String(stats.unidades_vendidas)}
              />
              <StatBox
                icon="receipt"
                label="Ventas"
                value={String(stats.transacciones)}
              />
            </View>

            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />

            <Row
              label="Facturado bruto"
              value={formatCurrency(stats.bruto)}
              valueColor={colors.textPrimary}
            />

            {stats.descuento > 0 ? (
              <Row
                label="Descontado por promos"
                value={`−${formatCurrency(stats.descuento)}`}
                valueColor={colors.success}
                icon="tag-outline"
              />
            ) : null}

            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />

            <Row
              label="Cobrado real"
              value={formatCurrency(stats.neto)}
              valueColor={colors.textPrimary}
              bold
            />

            {stats.ultima_venta ? (
              <Text
                style={[styles.ultimaVenta, { color: colors.textMuted }]}
              >
                Última venta: {formatDate(stats.ultima_venta)}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {/* STOCK */}
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Stock
          </Text>
          <View style={styles.stockRow}>
            <View>
              <Text style={[styles.stockValue, { color: colors.textPrimary }]}>
                {producto.stock} unidades
              </Text>
              <Text style={[styles.stockMinimo, { color: colors.textMuted }]}>
                Mínimo: {producto.stock_minimo}
              </Text>
            </View>
            <View
              style={[styles.stockDot, { backgroundColor: stockInfo.color }]}
            />
          </View>

          {esAdmin ? (
            <View style={{ marginTop: spacing.lg }}>
              <Button
                label="Registrar movimiento"
                variant="outline"
                icon="swap-horizontal"
                onPress={() =>
                  goTo('Mas', 'MovimientoForm', { productoId: productId })
                }
                fullWidth
              />
            </View>
          ) : null}
        </Card>

        {/* INFO */}
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Información
          </Text>
          <InfoRow
            icon="shape-outline"
            label="Categoría"
            value={producto.categoria_nombre ?? 'Sin categoría'}
          />
          <InfoRow
            icon="truck-outline"
            label="Proveedor"
            value={producto.proveedor_nombre ?? 'Sin proveedor'}
          />
          {producto.descripcion ? (
            <InfoRow
              icon="text-box-outline"
              label="Descripción"
              value={producto.descripcion}
            />
          ) : null}
        </Card>

        {esAdmin && producto.activo === 1 ? (
          <Button
            label="Desactivar producto"
            variant="danger"
            icon="trash-can-outline"
            onPress={() => {
              void desactivar();
            }}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header(props: {
  onBack: () => void;
  onEdit?: () => void;
}): React.ReactElement {
  return (
    <TopBar
      title="Producto"
      onBack={props.onBack}
      rightIcon={props.onEdit ? 'pencil-outline' : undefined}
      onRightPress={props.onEdit}
    />
  );
}

function Row(props: {
  label: string;
  value: string;
  valueColor: string;
  bold?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}): React.ReactElement {
  const colors = useColors();
  return (
    <View style={localStyles.rowWrap}>
      <View style={localStyles.rowLabelWrap}>
        {props.icon ? (
          <MaterialCommunityIcons
            name={props.icon}
            size={12}
            color={props.valueColor}
          />
        ) : null}
        <Text
          style={[
            props.bold ? localStyles.rowLabelBold : localStyles.rowLabel,
            { color: props.bold ? colors.textPrimary : colors.textSecondary },
          ]}
        >
          {props.label}
        </Text>
      </View>
      <Text
        style={[
          props.bold ? localStyles.rowValueBold : localStyles.rowValue,
          { color: props.valueColor },
        ]}
      >
        {props.value}
      </Text>
    </View>
  );
}

function InfoRow(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}): React.ReactElement {
  const colors = useColors();
  return (
    <View style={[localStyles.infoRow, { borderTopColor: colors.border }]}>
      <MaterialCommunityIcons
        name={props.icon}
        size={16}
        color={colors.textMuted}
      />
      <View style={localStyles.infoText}>
        <Text style={[localStyles.infoLabel, { color: colors.textMuted }]}>
          {props.label}
        </Text>
        <Text style={[localStyles.infoValue, { color: colors.textPrimary }]}>
          {props.value}
        </Text>
      </View>
    </View>
  );
}

function StatBox(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}): React.ReactElement {
  const colors = useColors();
  return (
    <View style={[localStyles.statBox, { backgroundColor: colors.bgSubtle }]}>
      <MaterialCommunityIcons
        name={props.icon}
        size={18}
        color={colors.textSecondary}
      />
      <Text style={[localStyles.statValue, { color: colors.textPrimary }]}>
        {props.value}
      </Text>
      <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>
        {props.label}
      </Text>
    </View>
  );
}

function getStockInfo(
  stock: number,
  minimo: number,
  colors: AppColors,
): {
  label: string;
  variant: 'success' | 'warning' | 'danger';
  color: string;
} {
  if (stock <= 0)
    return { label: 'Agotado', variant: 'danger', color: colors.danger };
  if (stock <= minimo)
    return { label: 'Stock bajo', variant: 'warning', color: colors.warning };
  return { label: 'Disponible', variant: 'success', color: colors.success };
}

const localStyles = StyleSheet.create({
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  rowLabel: { ...typography.caption },
  rowLabelBold: { ...typography.bodyBold },
  rowValue: { ...typography.bodyBold },
  rowValueBold: { ...typography.price },
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
  statBox: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { ...typography.h3 },
  statLabel: { ...typography.tiny, textAlign: 'center' },
});

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
    hero: { alignItems: 'center', marginBottom: spacing.xl },
    promoHeroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      marginTop: spacing.md,
    },
    promoHeroText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    nombre: { ...typography.h2, textAlign: 'center', marginTop: spacing.sm },
    codigo: { ...typography.caption, marginTop: 4 },
    badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    priceRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    priceCard: {
      flex: 1,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    priceLabel: { ...typography.small },
    priceValue: { ...typography.price, marginTop: spacing.xs },
    section: { marginBottom: spacing.md },
    sectionTitle: { ...typography.h3, marginBottom: spacing.md },

    promoHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      marginLeft: 'auto',
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    liveText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },

    promoInfoBox: {
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    promoNombre: { ...typography.bodyBold },
    promoSub: { ...typography.small, marginTop: 4 },
    promoFechaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    promoFecha: { ...typography.tiny },
    promoEjemplo: {
      ...typography.caption,
      marginBottom: spacing.sm,
    },
    promoBox: {
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    rowDivider: {
      height: 1,
      marginVertical: spacing.sm,
    },
    emptyText: {
      ...typography.caption,
      lineHeight: 20,
    },

    gananciaBox: {
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    gananciaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    gananciaTitle: { ...typography.bodyBold },
    gananciaComparativa: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    gananciaCol: { flex: 1, alignItems: 'center', gap: 2 },
    gananciaColLabel: { ...typography.tiny },
    gananciaColValue: { ...typography.h3 },
    gananciaColSub: { ...typography.tiny },
    difRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    difLabel: { ...typography.bodyBold },
    difValue: { ...typography.h3 },

    editPromoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    editPromoText: { ...typography.button },

    otherPromosWrap: { marginTop: spacing.lg },
    otherPromosTitle: {
      ...typography.overline,
      marginBottom: spacing.sm,
    },
    otherPromoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
    },
    otherPromoNombre: { ...typography.body, flex: 1 },
    otherPromoSub: { ...typography.small },

    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statDivider: { height: 1, marginVertical: spacing.md },
    ultimaVenta: {
      ...typography.tiny,
      marginTop: spacing.md,
      textAlign: 'right',
    },

    stockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stockValue: { ...typography.h3 },
    stockMinimo: { ...typography.small, marginTop: 2 },
    stockDot: { width: 12, height: 12, borderRadius: 6 },
  });