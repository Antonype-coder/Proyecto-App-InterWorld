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
import { useReturnTo } from '@hooks/useReturnTo';
import { useConfirm } from '@components/feedback/ConfirmProvider';
import { productosApi } from '@api/index';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import type { Producto, ProductosStackParamList } from '@tipos/index';
import { formatCurrency } from '@utils/format';
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
  const goTo = useReturnTo();
  const confirm = useConfirm();
  const showToast = useUIStore((s) => s.showToast);

  const user = useAuthStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const p = await productosApi.obtener(productId);
      setProducto(p);
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

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Stock
          </Text>
          <View style={styles.stockRow}>
            <View>
              <Text style={[styles.stockValue, { color: colors.textPrimary }]}>
                {producto.stock} unidades
              </Text>
              <Text
                style={[styles.stockMinimo, { color: colors.textMuted }]}
              >
                Mínimo: {producto.stock_minimo}
              </Text>
            </View>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: stockInfo.color },
              ]}
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

function getStockInfo(
  stock: number,
  minimo: number,
  colors: ReturnType<typeof useColors>,
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  nombre: { ...typography.h2, textAlign: 'center' },
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
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockValue: { ...typography.h3 },
  stockMinimo: { ...typography.small, marginTop: 2 },
  stockDot: { width: 12, height: 12, borderRadius: 6 },
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
});