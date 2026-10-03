// src/screens/busqueda/BusquedaGlobalScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';

import { colors, radius, spacing, typography } from '@theme/index';
import { useBusquedaStore } from '@store/busquedaStore';
import { useDebounce } from '@hooks/useDebounce';
import { formatCurrency } from '@utils/format';
import { getImageUrl } from '@utils/image';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';

export default function BusquedaGlobalScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const {
    resultados,
    loading,
    error,
    historial,
    buscar,
    cargarHistorial,
    limpiarHistorial,
  } = useBusquedaStore();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    void cargarHistorial();
  }, [cargarHistorial]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      void buscar(debouncedQuery);
    }
  }, [debouncedQuery, buscar]);

  const hasResults =
    resultados &&
    (resultados.productos.length > 0 ||
      resultados.clientes.length > 0 ||
      resultados.ventas.length > 0 ||
      resultados.proveedores.length > 0);

  const showEmpty =
    !loading &&
    debouncedQuery.length >= 2 &&
    resultados &&
    !hasResults;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar productos, clientes, ventas..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cargando */}
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : null}

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Historial (cuando no hay búsqueda) */}
        {!query && historial.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>BÚSQUEDAS RECIENTES</Text>
              <Pressable onPress={limpiarHistorial} hitSlop={8}>
                <Text style={styles.clearLink}>Limpiar</Text>
              </Pressable>
            </View>
            <View style={styles.historialWrap}>
              {historial.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setQuery(item)}
                  style={({ pressed }) => [
                    styles.historyChip,
                    pressed ? styles.historyChipPressed : null,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.historyChipText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Sin resultados */}
        {showEmpty ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              No se encontró nada para "{debouncedQuery}"
            </Text>
          </View>
        ) : null}

        {/* PRODUCTOS */}
        {resultados && resultados.productos.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              PRODUCTOS ({resultados.productos.length})
            </Text>
            <View style={styles.listBox}>
              {resultados.productos.map((p, idx) => {
                const img = getImageUrl(p.imagen);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() =>
                      navigation.navigate('Productos', {
                        screen: 'ProductoDetalle',
                        params: { productId: p.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.row,
                      idx === resultados.productos.length - 1
                        ? styles.rowLast
                        : null,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        style={styles.thumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <MaterialCommunityIcons
                          name="package-variant-closed"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {p.nombre}
                      </Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {p.codigo_barras} · Stock: {p.stock}
                      </Text>
                    </View>
                    <Text style={styles.rowPrice}>
                      {formatCurrency(p.precio_venta)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* CLIENTES */}
        {resultados && resultados.clientes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              CLIENTES ({resultados.clientes.length})
            </Text>
            <View style={styles.listBox}>
              {resultados.clientes.map((c, idx) => {
                const debe = parseFloat(c.saldo_deuda) > 0;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() =>
                      navigation.navigate('Mas', {
                        screen: 'ClienteEstadoCuenta',
                        params: { clienteId: c.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.row,
                      idx === resultados.clientes.length - 1
                        ? styles.rowLast
                        : null,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    <Avatar nombre={c.nombre} size="sm" />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {c.nombre}
                      </Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {c.documento ?? c.telefono ?? 'Sin datos'}
                      </Text>
                    </View>
                    {debe ? (
                      <Text style={styles.rowDebt}>
                        {formatCurrency(c.saldo_deuda)}
                      </Text>
                    ) : (
                      <Badge label="Al día" variant="success" size="sm" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* VENTAS */}
        {resultados && resultados.ventas.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              VENTAS ({resultados.ventas.length})
            </Text>
            <View style={styles.listBox}>
              {resultados.ventas.map((v, idx) => (
                <Pressable
                  key={v.id}
                  onPress={() =>
                    navigation.navigate('Ventas', {
                      screen: 'VentaDetalle',
                      params: { ventaId: v.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.row,
                    idx === resultados.ventas.length - 1
                      ? styles.rowLast
                      : null,
                    pressed ? styles.rowPressed : null,
                  ]}
                >
                  <View style={styles.rowIcon}>
                    <MaterialCommunityIcons
                      name="receipt"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {v.numero}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {v.cliente_nombre ?? 'Consumidor final'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.rowPrice}>
                      {formatCurrency(v.total)}
                    </Text>
                    {v.estado === 'anulada' ? (
                      <Badge label="Anulada" variant="danger" size="sm" />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* PROVEEDORES */}
        {resultados && resultados.proveedores.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              PROVEEDORES ({resultados.proveedores.length})
            </Text>
            <View style={styles.listBox}>
              {resultados.proveedores.map((p, idx) => (
                <View
                  key={p.id}
                  style={[
                    styles.row,
                    idx === resultados.proveedores.length - 1
                      ? styles.rowLast
                      : null,
                  ]}
                >
                  <View style={styles.rowIcon}>
                    <MaterialCommunityIcons
                      name="truck-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {p.nombre}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {p.contacto ?? p.telefono ?? 'Sin contacto'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: spacing.giant }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  scroll: { padding: spacing.lg },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: { ...typography.caption, color: colors.textMuted },
  errorBox: {
    backgroundColor: colors.dangerSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.dangerText },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  clearLink: { ...typography.small, color: colors.accent },
  historialWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyChipPressed: { opacity: 0.7 },
  historyChipText: { ...typography.small, color: colors.textPrimary },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.giant,
    gap: spacing.md,
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  listBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.surfacePressed },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: { ...typography.bodyBold, color: colors.textPrimary },
  rowSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  rowPrice: { ...typography.bodyBold, color: colors.textPrimary },
  rowDebt: { ...typography.bodyBold, color: colors.danger },
});