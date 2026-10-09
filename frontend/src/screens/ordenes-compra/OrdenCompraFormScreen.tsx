import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { ordenesCompraApi, proveedoresApi, productosApi } from '@api/index';
import type { Proveedor, Producto } from '@tipos/index';
import { formatCurrency, formatNumericInput, parseNumericInput } from '@utils/format';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import Toast from '@components/ui/Toast';
import { SuccessPulse } from '@components/feedback';
import type { ToastVariant } from '@tipos/index';

interface ItemLocal {
  producto_id: number;
  producto_nombre: string;
  codigo_barras: string;
  cantidad: number;
  precio_unitario: number;
}

export default function OrdenCompraFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [fechaEsperada, setFechaEsperada] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<ItemLocal[]>([]);
  const [modalProv, setModalProv] = useState(false);
  const [modalProd, setModalProd] = useState(false);
  const [busqProv, setBusqProv] = useState('');
  const [busqProd, setBusqProd] = useState('');
  const [saving, setSaving] = useState(false);
  const [pulseVisible, triggerPulse] = useSuccessPulse();

  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: ToastVariant }>({
    visible: false, message: '', variant: 'info',
  });

  useEffect(() => {
    (async () => {
      try {
        const [provs, prods] = await Promise.all([
          proveedoresApi.listar(1),
          productosApi.listar({ activo: 1, limit: 500 }),
        ]);
        setProveedores(provs);
        setProductos(prods.items);
      } catch { /* ignorar */ }
    })();
  }, []);

  const proveedorSel = proveedores.find((p) => p.id === proveedorId) ?? null;
  const total = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);

  const agregarProducto = (p: Producto): void => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto_id === p.id);
      if (existente) {
        return prev.map((i) => i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, {
        producto_id: p.id,
        producto_nombre: p.nombre,
        codigo_barras: p.codigo_barras,
        cantidad: 1,
        precio_unitario: parseFloat(p.precio_compra),
      }];
    });
    setModalProd(false);
    setBusqProd('');
  };

  // ✅ Fix: NO borra el item cuando el input queda vacío. Solo actualiza la cantidad.
  const setCantidadTexto = (pid: number, texto: string): void => {
    const limpio = texto.replace(/[^0-9]/g, '');
    const n = limpio === '' ? 0 : parseInt(limpio, 10);
    setItems((prev) =>
      prev.map((i) => (i.producto_id === pid ? { ...i, cantidad: n } : i)),
    );
  };

  // ✅ Fix: borrar SOLO desde el botón X.
  const quitarItem = (pid: number): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => prev.filter((i) => i.producto_id !== pid));
  };

  const setPrecio = (pid: number, precio: number): void => {
    setItems((prev) => prev.map((i) => i.producto_id === pid ? { ...i, precio_unitario: precio } : i));
  };

  const onSubmit = async (): Promise<void> => {
    if (!proveedorId) { setToast({ visible: true, message: 'Selecciona un proveedor', variant: 'error' }); return; }

    // Filtrar items inválidos (cantidad 0) antes de guardar
    const itemsValidos = items.filter((i) => i.cantidad > 0);
    if (itemsValidos.length === 0) {
      setToast({ visible: true, message: 'Agrega al menos un producto con cantidad mayor a 0', variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      await ordenesCompraApi.crear({
        proveedor_id: proveedorId,
        fecha_esperada: fechaEsperada || undefined,
        notas: notas || undefined,
        estado: 'borrador',
        items: itemsValidos.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
        })),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerPulse();
      setTimeout(() => navigation.goBack(), 700);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const provsFiltrados = proveedores.filter((p) => !busqProv || p.nombre.toLowerCase().includes(busqProv.toLowerCase()));

  const prodsFiltrados = productos.filter((p) => {
    if (!busqProd) return true;
    const q = busqProd.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || p.codigo_barras.toLowerCase().includes(q);
  });

  return (
    <KeyboardScreen
      header={
        <TopBar
          title="Nueva orden de compra"
          onBack={() => navigation.goBack()}
        />
      }
      contentContainerStyle={{ padding: 0 }}
    >
      <View style={styles.content}>
        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Proveedor</Text>
          <Pressable
            onPress={() => setModalProv(true)}
            style={[styles.selectBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {proveedorSel ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectValue, { color: colors.textPrimary }]}>{proveedorSel.nombre}</Text>
                {proveedorSel.contacto ? (
                  <Text style={[styles.selectSub, { color: colors.textMuted }]}>{proveedorSel.contacto}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.selectPlaceholder, { color: colors.textMuted }]}>
                Seleccionar proveedor
              </Text>
            )}
            <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>

        <Card variant="default" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Productos ({items.length})
            </Text>
            <Pressable onPress={() => setModalProd(true)}>
              <Text style={[styles.addLink, { color: colors.accent }]}>+ Agregar</Text>
            </Pressable>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sin productos</Text>
            </View>
          ) : (
            items.map((it) => (
              <View key={it.producto_id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.itemNombre, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {it.producto_nombre}
                  </Text>
                  <Text style={[styles.itemCodigo, { color: colors.textMuted }]}>
                    {it.codigo_barras}
                  </Text>

                  <View style={styles.itemInputs}>
                    <View style={styles.itemInput}>
                      <Text style={[styles.itemInputLabel, { color: colors.textMuted }]}>
                        Cant.
                      </Text>
                      <TextInput
                        style={[
                          styles.itemInputField,
                          { backgroundColor: colors.bgSubtle, color: colors.textPrimary },
                        ]}
                        keyboardType="numeric"
                        value={it.cantidad === 0 ? '' : String(it.cantidad)}
                        onChangeText={(t) => setCantidadTexto(it.producto_id, t)}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={styles.itemInput}>
                      <Text style={[styles.itemInputLabel, { color: colors.textMuted }]}>
                        Precio
                      </Text>
                      <TextInput
                        style={[
                          styles.itemInputField,
                          { backgroundColor: colors.bgSubtle, color: colors.textPrimary },
                        ]}
                        keyboardType="decimal-pad"
                        value={formatNumericInput(String(it.precio_unitario))}
                        onChangeText={(t) =>
                          setPrecio(it.producto_id, Number(parseNumericInput(t)) || 0)
                        }
                      />
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => quitarItem(it.producto_id)}
                  style={styles.removeBtn}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
                </Pressable>
              </View>
            ))
          )}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notas</Text>
          <Input
            label="Notas"
            placeholder="Opcional"
            value={notas}
            onChangeText={setNotas}
            multiline
          />
        </Card>

        <Card variant="elevated" style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
              {formatCurrency(total)}
            </Text>
          </View>
        </Card>

        <Button
          label="Crear orden"
          onPress={onSubmit}
          loading={saving}
          disabled={saving || items.length === 0}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>

      <Modal
        visible={modalProv}
        onClose={() => setModalProv(false)}
        title="Seleccionar proveedor"
        scrollable
      >
        <View style={[styles.modalSearchBox, { backgroundColor: colors.bgSubtle }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Buscar proveedor"
            placeholderTextColor={colors.textMuted}
            value={busqProv}
            onChangeText={setBusqProv}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {provsFiltrados.map((p, idx) => (
          <Pressable
            key={p.id}
            onPress={() => {
              setProveedorId(p.id);
              setModalProv(false);
              setBusqProv('');
            }}
            style={[
              styles.modalRow,
              { borderBottomColor: colors.border },
              idx === provsFiltrados.length - 1 ? styles.modalRowLast : null,
            ]}
          >
            <Text style={[styles.modalNombre, { color: colors.textPrimary }]}>
              {p.nombre}
            </Text>
          </Pressable>
        ))}
      </Modal>

      <Modal
        visible={modalProd}
        onClose={() => setModalProd(false)}
        title="Agregar producto"
        scrollable
      >
        <View style={[styles.modalSearchBox, { backgroundColor: colors.bgSubtle }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Buscar producto"
            placeholderTextColor={colors.textMuted}
            value={busqProd}
            onChangeText={setBusqProd}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {prodsFiltrados.slice(0, 50).map((p, idx) => (
          <Pressable
            key={p.id}
            onPress={() => agregarProducto(p)}
            style={[
              styles.modalRow,
              { borderBottomColor: colors.border },
              idx === prodsFiltrados.length - 1 ? styles.modalRowLast : null,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalNombre, { color: colors.textPrimary }]}>
                {p.nombre}
              </Text>
              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Stock actual: {p.stock}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        ))}
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <SuccessPulse visible={pulseVisible} label="Orden creada" />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.giant },
  section: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3 },
  addLink: { ...typography.buttonSmall },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 52,
  },
  selectValue: { ...typography.bodyBold },
  selectSub: { ...typography.small, marginTop: 2 },
  selectPlaceholder: { flex: 1, ...typography.body },
  emptyBox: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.caption },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  itemNombre: { ...typography.bodyBold },
  itemCodigo: { ...typography.small, marginTop: 2 },
  itemInputs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  itemInput: { flex: 1 },
  itemInputLabel: { ...typography.tiny, marginBottom: 2 },
  itemInputField: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.body,
  },
  removeBtn: { padding: spacing.xs, alignSelf: 'flex-start' },
  totalCard: { marginBottom: spacing.md },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { ...typography.h3 },
  totalValue: { ...typography.price },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    marginLeft: spacing.sm,
    paddingVertical: 0,
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
});