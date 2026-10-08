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
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { formatCurrency } from '@utils/format';
import type { Cliente } from '@tipos/index';

interface ClientePickerProps {
  clientes: Cliente[];
  selectedId: number | null;
  onSelect: (clienteId: number | null) => void;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
}

export default function ClientePicker({
  clientes,
  selectedId,
  onSelect,
  label = 'Cliente',
  placeholder = 'Seleccionar cliente',
  allowClear = true,
}: ClientePickerProps): React.ReactElement {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const selected = clientes.find((c) => c.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!busqueda) return clientes;
    const q = busqueda.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.documento ?? '').toLowerCase().includes(q),
    );
  }, [clientes, busqueda]);

  const handleSelect = (id: number | null): void => {
    onSelect(id);
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
            name="account-outline"
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
                Deuda: {formatCurrency(selected.saldo_deuda)}
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
        title="Seleccionar cliente"
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
            placeholder="Buscar cliente"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => handleSelect(item.id)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border },
                index === filtered.length - 1 ? styles.rowLast : null,
                pressed ? { backgroundColor: colors.surfacePressed } : null,
              ]}
            >
              <Avatar nombre={item.nombre} size="sm" />
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
                  {item.documento ?? item.telefono ?? 'Sin datos'}
                </Text>
              </View>
              {parseFloat(item.saldo_deuda) > 0 ? (
                <Badge label="Debe" variant="danger" size="sm" />
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Sin clientes registrados
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
  rowInfo: { flex: 1, minWidth: 0 },
  rowNombre: { ...typography.bodyBold },
  rowSub: { ...typography.small, marginTop: 2 },
  empty: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});