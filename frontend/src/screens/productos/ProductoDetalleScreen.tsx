import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
import { productosApi } from '@api/index';
import { useAuthStore } from '@store/authStore';
import type { Producto, ProductosStackParamList } from '@tipos/index';
import { formatCurrency } from '@utils/format';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Loader from '@components/ui/Loader';
import EmptyState from '@components/ui/EmptyState';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';
import TopBar from '@components/layout/TopBar';
import ProductoImageCarousel from '@components/domain/ProductoImageCarousel';

type Params = RouteProp<ProductosStackParamList, 'ProductoDetalle'>;

export default function ProductoDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const productId = route.params.productId;

  const user = useAuthStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

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

  const desactivar = (): void => {
    Alert.alert(
      'Desactivar producto',
      'El producto dejará de aparecer en el POS.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await productosApi.eliminar(productId);
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              navigation.goBack();
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Error al desactivar';
              setToast({ visible: true, message: msg, variant: 'error' });
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} />
        <Loader message="Cargando producto" />
      </SafeAreaView>
    );
  }

  if (error || !producto) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudo cargar"
          description={error ?? 'Producto no encontrado'}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      </SafeAreaView>
    );
  }

  const stockInfo = getStockInfo(producto.stock, producto.stock_minimo);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
            images={producto.imagenes?.length ? producto.imagenes : producto.imagen ? [producto.imagen] : []}
            height={220}
          />
          <Text style={styles.nombre}>{producto.nombre}</Text>
          <Text style={styles.codigo}>{producto.codigo_barras}</Text>
          <View style={styles.badgeRow}>
            <Badge label={stockInfo.label} variant={stockInfo.variant} />
            <Badge
              label={producto.activo === 1 ? 'Activo' : 'Inactivo'}
              variant={producto.activo === 1 ? 'success' : 'neutral'}
            />
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Precio de venta</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(producto.precio_venta)}
            </Text>
          </View>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Precio de compra</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(producto.precio_compra)}
            </Text>
          </View>
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Stock</Text>
          <View style={styles.stockRow}>
            <View>
              <Text style={styles.stockValue}>
                {producto.stock} unidades
              </Text>
              <Text style={styles.stockMinimo}>
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
                  navigation.navigate(
                    'Mas' as never,
                    {
                      screen: 'MovimientoForm',
                      params: { productoId: productId },
                    } as never,
                  )
                }
                fullWidth
              />
            </View>
          ) : null}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
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
            onPress={desactivar}
            fullWidth
          />
        ) : null}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
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

function getStockInfo(
  stock: number,
  minimo: number,
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
  nombre: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  codigo: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  priceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  priceLabel: { ...typography.small, color: colors.textSecondary },
  priceValue: {
    ...typography.price,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockValue: { ...typography.h3, color: colors.textPrimary },
  stockMinimo: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  stockDot: { width: 12, height: 12, borderRadius: 6 },
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
});