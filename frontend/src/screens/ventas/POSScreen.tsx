import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usePOSShortcuts } from '@hooks/usePOSShortcuts';
import { useProductViewMode } from '@hooks/useProductViewMode';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { useProductosStore } from '@store/productosStore';
import { useCarritoStore } from '@store/carritoStore';
import { useAuthStore } from '@store/authStore';
import { clientesApi, promocionesApi } from '@api/index';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import BusinessLogo from '@components/domain/BusinessLogo';
import {
  crearVentaPendiente,
  guardarVentaPendiente,
  listarVentasPendientes,
  sincronizarVentasPendientes,
  type VentaPendiente,
} from '@services/offline.service';
import type {
  Producto,
  Cliente,
  AppTabsParamList,
  Promocion,
} from '@tipos/index';
import { formatCurrency } from '@utils/format';
import { labelDePromocion } from '@utils/promociones';
import FormattedNumberInput from '@components/forms/FormattedNumberInput';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import Toast from '@components/ui/Toast';
import RichEmptyState from '@components/ui/RichEmptyState';
import ProductViewToggle from '@components/ui/ProductViewToggle';
import { SuccessPulse } from '@components/feedback';
import ProductCard from './components/ProductCard';
import ProductListItem from './components/ProductListItem';
import ProductCompactItem from './components/ProductCompactItem';
import CartItem from './components/CartItem';
import PaymentSheet, { type MetodoPago } from './components/PaymentSheet';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<AppTabsParamList, 'Vender'>;

export default function POSScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const usuario = useAuthStore((state) => state.user);
  const isOnline = useNetworkStatus();
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const isWide = width >= 900;
  const { mode: productMode, setMode: setProductMode } = useProductViewMode();

  const { productos, cargar } = useProductosStore();

  const {
    items,
    tipoPago,
    clienteId,
    descuento,
    agregar,
    quitar,
    setCantidad,
    limpiar,
    setTipoPago,
    setClienteId,
    setDescuento,
    subtotal,
    descuentoPromociones,
    total,
    cantidadTotal,
  } = useCarritoStore();

  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modalCliente, setModalCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [modalDescuento, setModalDescuento] = useState(false);
  const [descuentoInput, setDescuentoInput] = useState('0');
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [ventasPendientes, setVentasPendientes] = useState<VentaPendiente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [pulseVisible, triggerPulse] = useSuccessPulse();
  const syncLock = useRef(false);
  const cobrarLock = useRef(false);
  const searchRef = useRef<TextInput>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  // ⚡ Mapa de promociones por producto
  const [promosPorProducto, setPromosPorProducto] = useState<
    Map<number, Promocion[]>
  >(new Map());

  // Altura dinámica del carrito
  const CART_HEADER_H = 56;
  const CART_ITEM_H = 96;
  const CART_TOTALS_H = 260;
  const CART_PADDING = 24;

  const cartIdealHeight = Math.min(
    CART_HEADER_H +
      items.length * CART_ITEM_H +
      CART_TOTALS_H +
      CART_PADDING,
    height * 0.65,
  );

  const recargarPendientes = useCallback(async (): Promise<void> => {
    if (!usuario?.id) {
      setVentasPendientes([]);
      return;
    }
    setVentasPendientes(await listarVentasPendientes(usuario.id));
  }, [usuario?.id]);

  const sincronizarPendientes = useCallback(
    async (manual = false): Promise<void> => {
      if (!usuario?.id || isOnline !== true || syncLock.current) return;
      syncLock.current = true;
      setSincronizando(true);
      try {
        const result = await sincronizarVentasPendientes(usuario.id, manual);
        await recargarPendientes();
        if (manual) {
          setToast({
            visible: true,
            message: result.error
              ? `Quedan ventas pendientes: ${result.error}`
              : `${result.sincronizadas} venta(s) sincronizada(s).`,
            variant: result.error ? 'warning' : 'success',
          });
        }
      } finally {
        syncLock.current = false;
        setSincronizando(false);
      }
    },
    [usuario?.id, isOnline, recargarPendientes],
  );

  useEffect(() => {
    void recargarPendientes();
  }, [recargarPendientes]);

  useEffect(() => {
    if (
      isOnline === true &&
      ventasPendientes.length > 0 &&
      ventasPendientes.some((sale) => sale.reintentable !== false)
    ) {
      void sincronizarPendientes();
    }
  }, [isOnline, ventasPendientes.length, usuario?.id, sincronizarPendientes]);

  // ⚡ Cargar todas las promociones vigentes y agruparlas por producto
  useEffect(() => {
    if (productos.length === 0) return;
    let cancel = false;

    (async () => {
      try {
        const promos = await promocionesApi.listar({
          activo: 1,
          vigentes: true,
        });
        if (cancel) return;

        const globales = promos.filter((p) => p.aplica_a === 'global');
        const porProd = promos.filter((p) => p.aplica_a === 'producto');
        const porCat = promos.filter((p) => p.aplica_a === 'categoria');

        const map = new Map<number, Promocion[]>();
        for (const prod of productos) {
          const lista: Promocion[] = [...globales];
          for (const pp of porProd) {
            if (Number(pp.producto_id) === prod.id) lista.push(pp);
          }
          if (prod.categoria_id) {
            for (const pc of porCat) {
              if (Number(pc.categoria_id) === prod.categoria_id) {
                lista.push(pc);
              }
            }
          }
          if (lista.length > 0) map.set(prod.id, lista);
        }
        setPromosPorProducto(map);
      } catch {
        // silencioso
      }
    })();

    return () => {
      cancel = true;
    };
  }, [productos]);

  const getPromosDeProducto = useCallback(
    (p: Producto): Promocion[] => promosPorProducto.get(p.id) ?? [],
    [promosPorProducto],
  );

  const onAgregar = useCallback(
    async (producto: Producto): Promise<void> => {
      if (producto.stock <= 0) {
        setToast({
          visible: true,
          message: 'Producto sin stock',
          variant: 'warning',
        });
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const promos = getPromosDeProducto(producto);
      agregar(producto, 1, promos.length > 0 ? promos : undefined);
    },
    [agregar, getPromosDeProducto],
  );

  const abrirScanner = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ProductoScanner', { origen: 'pos' });
  }, [navigation]);

  useEffect(() => {
    void cargar({ busqueda: '' });
  }, [cargar]);

  useEffect(() => {
    const productoEscaneado = route.params?.productoEscaneado;
    if (productoEscaneado) {
      void onAgregar(productoEscaneado);
      setToast({
        visible: true,
        message: `${productoEscaneado.nombre} agregado`,
        variant: 'success',
      });
      navigation.setParams({ productoEscaneado: undefined });
    }
  }, [route.params?.productoEscaneado, navigation, onAgregar]);

  useEffect(() => {
    if (tipoPago === 'credito') {
      (async () => {
        try {
          const lista = await clientesApi.listar({ activo: 1 });
          setClientes(lista);
        } catch {
          // Silencioso
        }
      })();
    }
  }, [tipoPago]);

  const productosFiltrados = productos.filter((p) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.codigo_barras.toLowerCase().includes(q)
    );
  });

  const clienteSel = clientes.find((c) => c.id === clienteId) ?? null;

  const clientesFiltrados = clientes.filter((c) => {
    if (!busquedaCliente) return true;
    const q = busquedaCliente.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.documento ?? '').toLowerCase().includes(q)
    );
  });

  const abrirModalCliente = async (): Promise<void> => {
    setBusquedaCliente('');
    try {
      const lista = await clientesApi.listar({ activo: 1 });
      setClientes(lista);
    } catch {
      // Ignorar
    }
    setModalCliente(true);
  };

  const limpiarCarrito = (): void => {
    if (items.length === 0) return;
    Alert.alert('Vaciar carrito', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: () => limpiar() },
    ]);
  };

  const guardarDescuento = (): void => {
    const val = parseFloat(descuentoInput) || 0;
    setDescuento(val);
    setModalDescuento(false);
  };

  const abrirCobro = (): void => {
    if (items.length === 0) {
      setToast({
        visible: true,
        message: 'El carrito está vacío',
        variant: 'error',
      });
      return;
    }
    if (tipoPago === 'credito' && clienteId === null) {
      setToast({
        visible: true,
        message: 'Selecciona un cliente para crédito',
        variant: 'error',
      });
      return;
    }
    setPaymentSheetOpen(true);
  };

  const cobrar = async (metodo: MetodoPago): Promise<void> => {
    if (!usuario?.id) {
      setToast({
        visible: true,
        message: 'Vuelve a iniciar sesión para cobrar.',
        variant: 'error',
      });
      return;
    }
    if (cobrarLock.current) return;
    cobrarLock.current = true;
    setCobrando(true);
    let guardadaLocalmente = false;
    try {
      const descuentoTotal = descuento + descuentoPromociones();

      const pending = crearVentaPendiente(
        {
          tipo_pago: tipoPago,
          cliente_id: clienteId,
          descuento: descuentoTotal,
          metodo_pago: metodo,
          items: items.map((i) => ({
            producto_id: i.producto.id,
            cantidad: i.cantidad,
          })),
        },
        usuario.id,
        total(),
      );

      await guardarVentaPendiente(pending);
      guardadaLocalmente = true;
      await recargarPendientes();

      if (isOnline === true) {
        await sincronizarPendientes();
      }

      const remaining = await listarVentasPendientes(usuario.id);
      setVentasPendientes(remaining);
      limpiar();
      setPaymentSheetOpen(false);

      if (remaining.some((sale) => sale.id === pending.id)) {
        const failure = remaining.find(
          (sale) => sale.id === pending.id,
        )?.ultimoError;
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        setToast({
          visible: true,
          message: failure
            ? `Venta guardada y pendiente: ${failure}`
            : 'Venta guardada en el dispositivo; se enviará al recuperar conexión.',
          variant: 'warning',
        });
        return;
      }

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      triggerPulse();
      await cargar({ busqueda: '' });
      setToast({
        visible: true,
        message: 'Venta registrada',
        variant: 'success',
      });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al cobrar';
      if (guardadaLocalmente) {
        limpiar();
        setPaymentSheetOpen(false);
        setToast({
          visible: true,
          message:
            'La venta quedó guardada en el dispositivo y se sincronizará después.',
          variant: 'warning',
        });
      } else {
        setToast({ visible: true, message: msg, variant: 'error' });
      }
    } finally {
      cobrarLock.current = false;
      setCobrando(false);
    }
  };

  usePOSShortcuts({
    onCustomer: abrirModalCliente,
    onDiscount: () => {
      setDescuentoInput(String(descuento));
      setModalDescuento(true);
    },
    onClear: limpiarCarrito,
    onCheckout: abrirCobro,
    onSearch: () => searchRef.current?.focus(),
  });

  const renderProductos = (): React.ReactElement => {
    const numColumns = productMode === 'grid' ? (isWide ? 4 : 2) : 1;

    const renderItem = ({
      item,
      index,
    }: {
      item: Producto;
      index: number;
    }): React.ReactElement => {
      const listaPromos = getPromosDeProducto(item);
      const tiene = listaPromos.length > 0;
      const etiqueta = tiene ? labelDePromocion(listaPromos[0]) : '';

      if (productMode === 'grid') {
        return (
          <View style={{ flex: 1 / numColumns }}>
            <ProductCard
              producto={item}
              onPress={() => void onAgregar(item)}
            />
            {tiene ? (
              <View
                pointerEvents="none"
                style={[
                  styles.promoBadge,
                  { backgroundColor: colors.success },
                ]}
              >
                <MaterialCommunityIcons name="tag" size={10} color="#FFFFFF" />
                <Text style={styles.promoBadgeText}>{etiqueta}</Text>
              </View>
            ) : null}
          </View>
        );
      }

      if (productMode === 'list') {
        return (
          <View>
            <ProductListItem
              producto={item}
              onPress={() => void onAgregar(item)}
              isLast={index === productosFiltrados.length - 1}
            />
            {tiene ? (
              <View
                pointerEvents="none"
                style={[
                  styles.promoBadgeList,
                  { backgroundColor: colors.success },
                ]}
              >
                <MaterialCommunityIcons name="tag" size={10} color="#FFFFFF" />
                <Text style={styles.promoBadgeText}>{etiqueta}</Text>
              </View>
            ) : null}
          </View>
        );
      }

      return (
        <View>
          <ProductCompactItem
            producto={item}
            onPress={() => void onAgregar(item)}
            isLast={index === productosFiltrados.length - 1}
          />
          {tiene ? (
            <View
              pointerEvents="none"
              style={[
                styles.promoBadgeList,
                { backgroundColor: colors.success },
              ]}
            >
              <MaterialCommunityIcons name="tag" size={10} color="#FFFFFF" />
              <Text style={styles.promoBadgeText}>{etiqueta}</Text>
            </View>
          ) : null}
        </View>
      );
    };

    return (
      <View style={styles.productosSection}>
        <View style={styles.searchWrapper}>
          <View
            style={[styles.searchBox, { backgroundColor: colors.bgSubtle }]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={colors.textMuted}
            />
            <TextInput
              ref={searchRef}
              placeholder="Buscar por nombre o código"
              placeholderTextColor={colors.textMuted}
              value={busqueda}
              onChangeText={setBusqueda}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {busqueda.length > 0 ? (
              <Pressable onPress={() => setBusqueda('')} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            ) : null}
          </View>

          <ProductViewToggle mode={productMode} onChange={setProductMode} />

          <Pressable
            onPress={abrirScanner}
            style={({ pressed }) => [
              styles.scanBtn,
              { backgroundColor: colors.primary },
              pressed ? { opacity: 0.85 } : null,
            ]}
            accessibilityLabel="Escanear código"
          >
            <MaterialCommunityIcons
              name="barcode-scan"
              size={22}
              color={colors.textInverse}
            />
          </Pressable>
        </View>

        {productosFiltrados.length === 0 ? (
          <RichEmptyState
            icon="package-variant"
            title={busqueda ? 'Sin resultados' : 'Sin productos'}
            description={
              busqueda
                ? `No hay productos que coincidan con "${busqueda}"`
                : 'Agrega productos en el catálogo.'
            }
          />
        ) : (
          <FlatList
            data={productosFiltrados}
            keyExtractor={(item) => String(item.id)}
            numColumns={numColumns}
            key={`${productMode}-${numColumns}`}
            columnWrapperStyle={
              productMode === 'grid' ? { gap: spacing.sm } : undefined
            }
            contentContainerStyle={
              productMode === 'grid'
                ? styles.productosGrid
                : styles.productosList
            }
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
          />
        )}
      </View>
    );
  };

  const renderCarrito = (): React.ReactElement => (
    <View
      style={[
        styles.carritoSection,
        {
          backgroundColor: colors.surface,
          borderLeftWidth: isWide ? 1 : 0,
          borderLeftColor: colors.border,
        },
      ]}
    >
      <View style={styles.carritoHeader}>
        <View style={styles.carritoHeaderLeft}>
          <Text style={[styles.carritoTitle, { color: colors.textPrimary }]}>
            Carrito
          </Text>
          {items.length > 0 ? (
            <View
              style={[
                styles.carritoCount,
                { backgroundColor: colors.accentSubtle },
              ]}
            >
              <Text
                style={[styles.carritoCountText, { color: colors.accentText }]}
              >
                {cantidadTotal()}
              </Text>
            </View>
          ) : null}
        </View>

        {items.length > 0 ? (
          <Pressable
            onPress={limpiarCarrito}
            style={({ pressed }) => [
              styles.clearBtn,
              { backgroundColor: colors.dangerSubtle },
              pressed ? { opacity: 0.7 } : null,
            ]}
            accessibilityLabel="Vaciar carrito"
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color={colors.danger}
            />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.carritoScroll}
        contentContainerStyle={styles.carritoScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={styles.emptyCart}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={36}
              color={colors.textMuted}
            />
            <Text
              style={[styles.emptyCartTitle, { color: colors.textPrimary }]}
            >
              Carrito vacío
            </Text>
            <Text style={[styles.emptyCartText, { color: colors.textMuted }]}>
              Toca un producto para agregarlo
            </Text>
          </View>
        ) : (
          items.map((item, idx) => (
            <CartItem
              key={item.producto.id}
              item={item}
              onIncrement={() =>
                setCantidad(item.producto.id, item.cantidad + 1)
              }
              onDecrement={() =>
                setCantidad(item.producto.id, item.cantidad - 1)
              }
              onRemove={() => quitar(item.producto.id)}
              isLast={idx === items.length - 1}
            />
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.totales,
          { borderTopColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Subtotal
          </Text>
          <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
            {formatCurrency(subtotal())}
          </Text>
        </View>

        {descuentoPromociones() > 0 ? (
          <View style={styles.totalRow}>
            <View style={styles.discountLabelRow}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={14}
                color={colors.success}
              />
              <Text style={[styles.totalLabel, { color: colors.success }]}>
                Promociones
              </Text>
            </View>
            <Text style={[styles.discountValue, { color: colors.success }]}>
              −{formatCurrency(descuentoPromociones())}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            setDescuentoInput(String(descuento));
            setModalDescuento(true);
          }}
          style={styles.totalRow}
        >
          <View style={styles.discountLabelRow}>
            <Text style={[styles.totalLabel, { color: colors.accent }]}>
              Descuento
            </Text>
            {descuento > 0 ? (
              <Text style={[styles.discountValue, { color: colors.accent }]}>
                −{formatCurrency(descuento)}
              </Text>
            ) : null}
          </View>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={14}
            color={colors.accent}
          />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.totalRow}>
          <Text style={[styles.totalGrandeLabel, { color: colors.textPrimary }]}>
            Total
          </Text>
          <Text style={[styles.totalGrandeValue, { color: colors.textPrimary }]}>
            {formatCurrency(total())}
          </Text>
        </View>

        <View style={styles.tipoPagoWrap}>
          <Pressable
            onPress={() => setTipoPago('contado')}
            style={[
              styles.segBtn,
              {
                backgroundColor:
                  tipoPago === 'contado' ? colors.primary : colors.bgSubtle,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="cash-check"
              size={14}
              color={
                tipoPago === 'contado'
                  ? colors.textInverse
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.segLabel,
                {
                  color:
                    tipoPago === 'contado'
                      ? colors.textInverse
                      : colors.textSecondary,
                },
              ]}
            >
              Contado
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTipoPago('credito')}
            style={[
              styles.segBtn,
              {
                backgroundColor:
                  tipoPago === 'credito' ? colors.primary : colors.bgSubtle,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-cash-outline"
              size={14}
              color={
                tipoPago === 'credito'
                  ? colors.textInverse
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.segLabel,
                {
                  color:
                    tipoPago === 'credito'
                      ? colors.textInverse
                      : colors.textSecondary,
                },
              ]}
            >
              Crédito
            </Text>
          </Pressable>
        </View>

        {tipoPago === 'credito' ? (
          <Pressable
            style={({ pressed }) => [
              styles.clienteBox,
              { backgroundColor: colors.bgSubtle },
              pressed ? { backgroundColor: colors.surfacePressed } : null,
            ]}
            onPress={abrirModalCliente}
          >
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={colors.textSecondary}
            />
            <View style={styles.clienteInfo}>
              <Text style={[styles.clienteLabel, { color: colors.textMuted }]}>
                Cliente
              </Text>
              <Text
                style={[
                  styles.clienteValue,
                  {
                    color: clienteSel ? colors.textPrimary : colors.textMuted,
                  },
                ]}
                numberOfLines={1}
              >
                {clienteSel
                  ? `${clienteSel.nombre} · Deuda ${formatCurrency(
                      clienteSel.saldo_deuda,
                    )}`
                  : 'Seleccionar cliente'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}

        <View style={styles.cobrarWrap}>
          <Button
            label={`Cobrar ${formatCurrency(total())}`}
            onPress={abrirCobro}
            disabled={items.length === 0}
            variant="primary"
            size="lg"
            icon="check-circle-outline"
            fullWidth
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <BusinessLogo size={32} style={styles.businessLogo} />
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Punto de venta
            </Text>
            {Platform.OS === 'web' ? (
              <View
                style={[
                  styles.shortcutHint,
                  {
                    backgroundColor: colors.bgSubtle,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.shortcutHintText, { color: colors.textMuted }]}
                >
                  Ctrl+K buscar
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {cantidadTotal()}{' '}
            {cantidadTotal() === 1 ? 'item en carrito' : 'items en carrito'}
          </Text>
        </View>
      </View>

      {!isOnline || ventasPendientes.length > 0 ? (
        <View
          style={[
            styles.offlineBanner,
            {
              backgroundColor: colors.warningSubtle,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isOnline ? 'cloud-upload-outline' : 'cloud-off-outline'}
            size={16}
            color={isOnline ? colors.warning : colors.danger}
          />
          <Text
            style={[styles.offlineBannerText, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {isOnline
              ? `${ventasPendientes.length} venta(s) pendiente(s) de sincronizar.`
              : `Sin conexión. ${ventasPendientes.length} venta(s) guardada(s) localmente.`}
          </Text>
          {isOnline && ventasPendientes.length > 0 ? (
            <Pressable
              onPress={() => void sincronizarPendientes(true)}
              disabled={sincronizando}
              hitSlop={8}
              style={styles.syncButton}
            >
              <MaterialCommunityIcons
                name={sincronizando ? 'progress-clock' : 'sync'}
                size={18}
                color={colors.primary}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isWide ? (
          <View style={styles.splitView}>
            <View style={styles.splitLeft}>{renderProductos()}</View>
            <View style={styles.splitRight}>{renderCarrito()}</View>
          </View>
        ) : (
          <View style={styles.mobileLayout}>
            <View style={styles.mobileTop}>{renderProductos()}</View>
            <View style={[styles.mobileBottom, { height: cartIdealHeight }]}>
              {renderCarrito()}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={modalCliente}
        onClose={() => setModalCliente(false)}
        title="Seleccionar cliente"
        scrollable
      >
        <View
          style={[styles.modalSearchBox, { backgroundColor: colors.bgSubtle }]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar cliente"
            placeholderTextColor={colors.textMuted}
            value={busquedaCliente}
            onChangeText={setBusquedaCliente}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {clientesFiltrados.map((c, index) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [
              styles.modalRow,
              { borderBottomColor: colors.border },
              index === clientesFiltrados.length - 1
                ? styles.modalRowLast
                : null,
              pressed ? { opacity: 0.7 } : null,
            ]}
            onPress={() => {
              setClienteId(c.id);
              setModalCliente(false);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.modalNombre, { color: colors.textPrimary }]}
              >
                {c.nombre}
              </Text>
              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Deuda: {formatCurrency(c.saldo_deuda)} · Cupo:{' '}
                {formatCurrency(c.cupo_credito)}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ))}

        {clientesFiltrados.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Sin clientes registrados
          </Text>
        ) : null}
      </Modal>

      <Modal
        visible={modalDescuento}
        onClose={() => setModalDescuento(false)}
        title="Aplicar descuento"
      >
        <FormattedNumberInput
          label="Monto de descuento"
          placeholder="0"
          icon="currency-usd"
          value={descuentoInput}
          onChangeText={setDescuentoInput}
        />
        <Button
          label="Aplicar"
          onPress={guardarDescuento}
          fullWidth
          variant="primary"
        />
      </Modal>

      <PaymentSheet
        visible={paymentSheetOpen}
        total={total()}
        onClose={() => setPaymentSheetOpen(false)}
        onConfirm={(metodo) => void cobrar(metodo)}
        loading={cobrando}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <SuccessPulse visible={pulseVisible} label="Venta registrada" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  businessLogo: {},
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: { ...typography.h3 },
  shortcutHint: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  shortcutHintText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 10,
  },
  headerSub: { ...typography.small, marginTop: 2 },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  offlineBannerText: { ...typography.small, flex: 1 },
  syncButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  splitView: { flex: 1, flexDirection: 'row' },
  splitLeft: { flex: 1 },
  splitRight: { width: 400 },

  mobileLayout: { flex: 1 },
  mobileTop: { flex: 1, minHeight: 180 },
  mobileBottom: { flexShrink: 0 },

  productosSection: { flex: 1 },
  searchWrapper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  scanBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  productosGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  promoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  promoBadgeList: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  promoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  productosList: {
    paddingBottom: spacing.lg,
  },

  carritoSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  carritoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  carritoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  carritoTitle: { ...typography.h3 },
  carritoCount: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  carritoCountText: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  carritoScroll: { flex: 1 },
  carritoScrollContent: { paddingBottom: spacing.md },

  emptyCart: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyCartTitle: { ...typography.bodyBold, marginTop: spacing.sm },
  emptyCartText: {
    ...typography.small,
    textAlign: 'center',
    maxWidth: 220,
  },

  totales: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalLabel: { ...typography.caption },
  discountValue: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },
  totalValue: { ...typography.bodyBold },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  totalGrandeLabel: { ...typography.h3 },
  totalGrandeValue: { ...typography.price },

  tipoPagoWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  segLabel: { ...typography.buttonSmall },

  clienteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  clienteInfo: { flex: 1 },
  clienteLabel: { ...typography.small },
  clienteValue: { ...typography.caption, marginTop: 2 },

  cobrarWrap: { marginTop: spacing.md },

  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalRowLast: { borderBottomWidth: 0 },
  modalNombre: { ...typography.bodyBold },
  modalSub: { ...typography.small, marginTop: 2 },
  emptyText: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});