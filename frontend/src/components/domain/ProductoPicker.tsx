import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { formatCurrency } from '@utils/format';
import type { Producto } from '@tipos/index';

interface ProductoPickerProps {
  productos: Producto[];
  selectedId: number | null;
  onSelect: (producto: Producto | null) => void;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
}

export default function ProductoPicker({
  productos,
  selectedId,
  onSelect,
  label = 'Producto',
  placeholder = 'Seleccionar producto',
  allowClear = true,
}: ProductoPickerProps): React.ReactElement {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const selected = productos.find((p) => p.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!busqueda) return productos;
    const q = busqueda.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo_barras.toLowerCase().includes(q),
    );
  }, [productos, busqueda]);

  const handleSelect = (producto: Producto | null): void => {
    onSelect(producto);
    setOpen(false);
    setBusqueda('');
  };

  return (
    <>
      <View style={styles.container}>
        {label ? (
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {label}
          </Text>
        ) : null}

        <Pressable
          onPress={() => setOpen(true)}
          style={[
            styles.selectBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderStrong,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={18}
            color={colors.textMuted}
          />
          <View style={styles.selectText}>
            <Text
              style={[
                styles.selectValue,
                {
                  color: selected ? colors.textPrimary : colors.textMuted,
                },
              ]}
              numberOfLines={1}
            >
              {selected ? selected.nombre : placeholder}
            </Text>
            {selected ? (
              <Text style={[styles.selectSub, { color: colors.textMuted }]}>
                {formatCurrency(selected.precio_venta)} · Stock {selected.stock}
              </Text>
            ) : null}
          </View>
          {selected && allowClear ? (
            <Pressable
              onPress={() => handleSelect(null)}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          ) : (
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={colors.textMuted}
            />
          )}
        </Pressable>
      </View>

      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title="Seleccionar producto"
        scrollable
      >
        <View
          style={[styles.searchBox, { backgroundColor: colors.bgSubtle }]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar producto"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              disabled={item.stock <= 0}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border },
                index === filtered.length - 1 ? styles.rowLast : null,
                item.stock <= 0 ? styles.rowDisabled : null,
                pressed && item.stock > 0
                  ? { backgroundColor: colors.surfacePressed }
                  : null,
              ]}
            >
              <View
                style={[styles.iconWrap, { backgroundColor: colors.bgSubtle }]}
              >
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
              <View style={styles.rowInfo}>
                <Text
                  style={[styles.rowNombre, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.nombre}
                </Text>
                <Text
                  style={[styles.rowSub, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.codigo_barras} · {formatCurrency(item.precio_venta)}
                </Text>
              </View>
              <Badge
                label={item.stock > 0 ? `Stock ${item.stock}` : 'Agotado'}
                variant={item.stock > 0 ? 'success' : 'danger'}
                size="sm"
              />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Sin productos
            </Text>
          }
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    gap: spacing.sm,
  },
  selectText: { flex: 1, minWidth: 0 },
  selectValue: { ...typography.body },
  selectSub: { ...typography.small, marginTop: 2 },
  clearBtn: { padding: 2 },
  searchBox: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  rowLast: { borderBottomWidth: 0 },
  rowDisabled: { opacity: 0.4 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowNombre: { ...typography.bodyBold },
  rowSub: { ...typography.small, marginTop: 2 },
  empty: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});