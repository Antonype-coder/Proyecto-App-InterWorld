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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
import { useProductosStore } from '@store/productosStore';
import { useCarritoStore } from '@store/carritoStore';
import { useAuthStore } from '@store/authStore';
import { ventasApi, clientesApi } from '@api/index';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import BusinessLogo from '@components/domain/BusinessLogo';
import {
  crearVentaPendiente,
  guardarVentaPendiente,
  listarVentasPendientes,
  sincronizarVentasPendientes,
  type VentaPendiente,
} from '@services/offline.service';
import type { Producto, Cliente, AppTabsParamList } from '@tipos/index';
import { formatCurrency } from '@utils/format';
import Input from '@components/ui/Input';
import FormattedNumberInput from '@components/forms/FormattedNumberInput';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import Toast from '@components/ui/Toast';
import Tooltip from '@components/ui/Tooltip';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<AppTabsParamList, 'Vender'>;

export default function POSScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const usuario = useAuthStore((state) => state.user);
  const isOnline = useNetworkStatus();
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
    total,
    cantidadTotal,
  } = useCarritoStore();

  const [busqueda, setBusqueda] = useState('');
  const [cobrando, setCobrando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modalCliente, setModalCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [modalDescuento, setModalDescuento] = useState(false);
  const [descuentoInput, setDescuentoInput] = useState('0');
  const [ventasPendientes, setVentasPendientes] = useState<VentaPendiente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const syncLock = useRef(false);
  const cobrarLock = useRef(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

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
      agregar(producto, 1);
    },
    [agregar],
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

  const onCobrar = async (): Promise<void> => {
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
    if (!usuario?.id) {
      setToast({ visible: true, message: 'Vuelve a iniciar sesión para cobrar.', variant: 'error' });
      return;
    }
    if (cobrarLock.current) return;

    cobrarLock.current = true;
    setCobrando(true);
    let guardadaLocalmente = false;
    try {
      const pending = crearVentaPendiente({
        tipo_pago: tipoPago,
        cliente_id: clienteId,
        descuento,
        items: items.map((i) => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
        })),
      }, usuario.id, total());

      await guardarVentaPendiente(pending);
      guardadaLocalmente = true;
      await recargarPendientes();

      if (isOnline === true) {
        await sincronizarPendientes();
      }

      const remaining = await listarVentasPendientes(usuario.id);
      setVentasPendientes(remaining);
      limpiar();

      if (remaining.some((sale) => sale.id === pending.id)) {
        const failure = remaining.find((sale) => sale.id === pending.id)?.ultimoError;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setToast({
          visible: true,
          message: failure
            ? `Venta guardada y pendiente de revisión: ${failure}`
            : 'Venta guardada en el dispositivo; se enviará al recuperar conexión.',
          variant: 'warning',
        });
        return;
      }

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      limpiar();
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
        setToast({
          visible: true,
          message: 'La venta quedó guardada en el dispositivo y se sincronizará después.',
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

  const guardarDescuento = (): void => {
    const val = parseFloat(descuentoInput) || 0;
    setDescuento(val);
    setModalDescuento(false);
  };

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header con Tooltip */}
      <View style={styles.header}>
        <BusinessLogo size={36} style={styles.businessLogo} />
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Punto de venta</Text>
            <Tooltip
              title="Cómo vender"
              text="Busca productos por nombre, código o usa el botón de cámara. Toca un producto para agregarlo al carrito y luego toca Cobrar."
            />
          </View>
          <Text style={styles.headerSub}>
            {cantidadTotal()} {cantidadTotal() === 1 ? 'item' : 'items'} en
            carrito
          </Text>
        </View>
        {items.length > 0 ? (
          <Pressable
            onPress={limpiarCarrito}
            style={({ pressed }) => [
              styles.clearBtn,
              pressed ? styles.clearBtnPressed : null,
            ]}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={colors.danger}
            />
          </Pressable>
        ) : null}
      </View>

      {!isOnline || ventasPendientes.length > 0 ? (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons
            name={isOnline ? 'cloud-upload-outline' : 'cloud-off-outline'}
            size={18}
            color={isOnline ? colors.warning : colors.danger}
          />
          <Text style={styles.offlineBannerText} numberOfLines={2}>
            {isOnline
              ? `${ventasPendientes.length} venta(s) pendiente(s) de sincronizar.`
              : `Sin conexión. ${ventasPendientes.length} venta(s) guardada(s) en este dispositivo.`}
          </Text>
          {isOnline && ventasPendientes.length > 0 ? (
            <Pressable
              onPress={() => void sincronizarPendientes(true)}
              disabled={sincronizando}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Sincronizar ventas pendientes"
              style={styles.syncButton}
            >
              <MaterialCommunityIcons
                name={sincronizando ? 'progress-clock' : 'sync'}
                size={20}
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
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={colors.textMuted}
            />
            <TextInput
              placeholder="Buscar producto por nombre o código"
              placeholderTextColor={colors.textMuted}
              value={busqueda}
              onChangeText={setBusqueda}
              style={styles.searchInput}
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

          <Pressable
            onPress={abrirScanner}
            style={({ pressed }) => [
              styles.scanBtn,
              pressed ? styles.scanBtnPressed : null,
            ]}
            accessibilityLabel="Escanear código de barras"
          >
            <MaterialCommunityIcons
              name="barcode-scan"
              size={22}
              color={colors.textInverse}
            />
          </Pressable>
        </View>

        <View style={styles.productosWrap}>
          <FlatList
            data={productosFiltrados}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productosScroll}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onAgregar(item)}
                disabled={item.stock <= 0}
                style={({ pressed }) => [
                  styles.prodCard,
                  item.stock <= 0 ? styles.prodCardDisabled : null,
                  pressed && item.stock > 0 ? styles.prodCardPressed : null,
                ]}
              >
                <Text style={styles.prodNombre} numberOfLines={2}>
                  {item.nombre}
                </Text>
                <Text style={styles.prodPrecio}>
                  {formatCurrency(item.precio_venta)}
                </Text>
                <Text style={styles.prodStock}>
                  {item.stock > 0 ? `${item.stock} und` : 'Agotado'}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Sin resultados</Text>
            }
          />
        </View>

        <View style={styles.carritoWrap}>
          <View style={styles.carritoHeader}>
            <Text style={styles.carritoTitle}>Carrito</Text>
            {items.length > 0 ? (
              <View style={styles.carritoCount}>
                <Text style={styles.carritoCountText}>{items.length}</Text>
              </View>
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
                  size={28}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyCartText}>
                  Agrega productos para comenzar
                </Text>
              </View>
            ) : (
              items.map((item, idx) => (
                <View
                  key={item.producto.id}
                  style={[
                    styles.cartItem,
                    idx === items.length - 1 ? styles.cartItemLast : null,
                  ]}
                >
                  <View style={styles.cartInfo}>
                    <Text style={styles.cartName} numberOfLines={1}>
                      {item.producto.nombre}
                    </Text>
                    <Text style={styles.cartPrecio}>
                      {formatCurrency(item.producto.precio_venta)} ×{' '}
                      {item.cantidad}
                    </Text>
                  </View>

                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        setCantidad(item.producto.id, item.cantidad - 1)
                      }
                      style={styles.stepBtn}
                      hitSlop={4}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={14}
                        color={colors.textPrimary}
                      />
                    </Pressable>
                    <Text style={styles.stepValue}>{item.cantidad}</Text>
                    <Pressable
                      onPress={() =>
                        setCantidad(item.producto.id, item.cantidad + 1)
                      }
                      style={styles.stepBtn}
                      hitSlop={4}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={14}
                        color={colors.textPrimary}
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.cartSubtotal}>
                    {formatCurrency(
                      parseFloat(item.producto.precio_venta) * item.cantidad,
                    )}
                  </Text>

                  <Pressable
                    onPress={() => quitar(item.producto.id)}
                    hitSlop={6}
                    style={styles.cartQuitar}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.totales}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(subtotal())}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setDescuentoInput(String(descuento));
                setModalDescuento(true);
              }}
              style={styles.totalRow}
            >
              <Text style={[styles.totalLabel, { color: colors.accent }]}>
                Descuento{' '}
                {descuento > 0 ? `(-${formatCurrency(descuento)})` : ''}
              </Text>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={14}
                color={colors.accent}
              />
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalGrandeLabel}>Total</Text>
              <Text style={styles.totalGrandeValue}>
                {formatCurrency(total())}
              </Text>
            </View>

            <View style={styles.tipoPagoWrap}>
              <Pressable
                onPress={() => setTipoPago('contado')}
                style={[
                  styles.segBtn,
                  tipoPago === 'contado' ? styles.segBtnActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.segLabel,
                    tipoPago === 'contado' ? styles.segLabelActive : null,
                  ]}
                >
                  Contado
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTipoPago('credito')}
                style={[
                  styles.segBtn,
                  tipoPago === 'credito' ? styles.segBtnActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.segLabel,
                    tipoPago === 'credito' ? styles.segLabelActive : null,
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
                  pressed ? styles.clienteBoxPressed : null,
                ]}
                onPress={abrirModalCliente}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <View style={styles.clienteInfo}>
                  <Text style={styles.clienteLabel}>Cliente</Text>
                  <Text
                    style={[
                      styles.clienteValue,
                      !clienteSel ? styles.clientePlaceholder : null,
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
                onPress={onCobrar}
                loading={cobrando}
                disabled={cobrando || items.length === 0}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalCliente}
        onClose={() => setModalCliente(false)}
        title="Seleccionar cliente"
        scrollable
      >
        <View style={styles.modalSearchBox}>
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
            style={styles.searchInput}
          />
        </View>

        {clientesFiltrados.map((c, index) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [
              styles.modalRow,
              index === clientesFiltrados.length - 1
                ? styles.modalRowLast
                : null,
              pressed ? styles.modalRowPressed : null,
            ]}
            onPress={() => {
              setClienteId(c.id);
              setModalCliente(false);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.modalNombre}>{c.nombre}</Text>
              <Text style={styles.modalSub}>
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
          <Text style={styles.emptyText}>Sin clientes registrados</Text>
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

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  businessLogo: { marginRight: spacing.sm },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warningSubtle,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  offlineBannerText: {
    ...typography.small,
    color: colors.textPrimary,
    flex: 1,
  },
  syncButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  headerSub: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnPressed: { opacity: 0.7 },
  searchWrapper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnPressed: { opacity: 0.85 },
  productosWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productosScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  prodCard: {
    width: 116,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  prodCardPressed: { backgroundColor: colors.surfacePressed },
  prodCardDisabled: { opacity: 0.4 },
  prodNombre: {
    ...typography.small,
    color: colors.textPrimary,
    fontFamily: typography.bodyBold.fontFamily,
  },
  prodPrecio: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  prodStock: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    width: '100%',
  },
  carritoWrap: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  carritoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  carritoTitle: { ...typography.h3, color: colors.textPrimary },
  carritoCount: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  carritoCountText: {
    ...typography.small,
    color: colors.textSecondary,
    fontFamily: typography.button.fontFamily,
  },
  carritoScroll: { flex: 1 },
  carritoScrollContent: { paddingBottom: spacing.md },
  emptyCart: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyCartText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  cartItemLast: { borderBottomWidth: 0 },
  cartInfo: { flex: 1, minWidth: 0 },
  cartName: { ...typography.bodyBold, color: colors.textPrimary },
  cartPrecio: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  stepBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    ...typography.small,
    color: colors.textPrimary,
    fontFamily: typography.button.fontFamily,
    minWidth: 22,
    textAlign: 'center',
  },
  cartSubtotal: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    minWidth: 60,
    textAlign: 'right',
  },
  cartQuitar: { padding: 2 },
  totales: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { ...typography.caption, color: colors.textSecondary },
  totalValue: { ...typography.bodyBold, color: colors.textPrimary },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalGrandeLabel: { ...typography.h3, color: colors.textPrimary },
  totalGrandeValue: { ...typography.price, color: colors.textPrimary },
  tipoPagoWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
  },
  segBtnActive: { backgroundColor: colors.primary },
  segLabel: { ...typography.buttonSmall, color: colors.textSecondary },
  segLabelActive: { color: colors.textInverse },
  clienteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  clienteBoxPressed: { backgroundColor: colors.surfacePressed },
  clienteInfo: { flex: 1 },
  clienteLabel: { ...typography.small, color: colors.textMuted },
  clienteValue: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2,
  },
  clientePlaceholder: { color: colors.textMuted },
  cobrarWrap: { marginTop: spacing.md, marginBottom: spacing.md },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
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
    borderBottomColor: colors.border,
  },
  modalRowLast: { borderBottomWidth: 0 },
  modalRowPressed: { opacity: 0.7 },
  modalNombre: { ...typography.bodyBold, color: colors.textPrimary },
  modalSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});