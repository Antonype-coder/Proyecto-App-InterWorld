import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SectionList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useReturnTo, useSmartBack } from '@hooks/useReturnTo';
import { useBusquedaStore } from '@store/busquedaStore';
import { useDebounce } from '@hooks/useDebounce';
import { fuzzyFilter } from '@utils/fuzzy';
import { formatCurrency } from '@utils/format';
import { getImageUrl } from '@utils/image';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';

const RECENT_KEY = '@interworld:search-recent';
const MAX_RECENT = 8;

interface ResultItem {
  id: string;
  type: 'producto' | 'cliente' | 'venta' | 'proveedor';
  title: string;
  subtitle?: string;
  rightText?: string;
  badge?: { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' | 'info' | 'accent' | 'outline' };
  image?: string | null;
  initials?: string;
  onPress: () => void;
}

export default function BusquedaGlobalScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const goTo = useReturnTo();
  const goBack = useSmartBack();
  const {
    resultados,
    loading,
    error,
    historial,
    buscar,
    cargarHistorial,
    limpiarHistorial,
  } = useBusquedaStore();

  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    void cargarHistorial();
  }, [cargarHistorial]);

  useEffect(() => {
    if (debouncedQuery.length >= 1) {
      void buscar(debouncedQuery);
    }
  }, [debouncedQuery, buscar]);

  const persistRecent = useCallback(async (q: string) => {
    if (!q.trim()) return;
    try {
      const stored = await AsyncStorage.getItem(RECENT_KEY);
      const list: string[] = stored ? JSON.parse(stored) : [];
      const next = [q, ...list.filter((x) => x !== q)].slice(0, MAX_RECENT);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Silencioso
    }
  }, []);

  // Construir secciones con fuzzy
  const sections = useMemo(() => {
    if (!resultados) return [];

    const q = debouncedQuery;

    const productos: ResultItem[] = fuzzyFilter(
      q,
      resultados.productos,
      (p) => `${p.nombre} ${p.codigo_barras}`,
    ).map((p) => ({
      id: `p-${p.id}`,
      type: 'producto',
      title: p.nombre,
      subtitle: p.codigo_barras,
      rightText: formatCurrency(p.precio_venta),
      image: p.imagen,
      onPress: () => {
        void persistRecent(q);
        goTo('Productos', 'ProductoDetalle', { productId: p.id });
      },
    }));

    const clientes: ResultItem[] = fuzzyFilter(
      q,
      resultados.clientes,
      (c) => `${c.nombre} ${c.documento ?? ''} ${c.telefono ?? ''}`,
    ).map((c) => {
      const debe = parseFloat(c.saldo_deuda) > 0;
      return {
        id: `c-${c.id}`,
        type: 'cliente',
        title: c.nombre,
        subtitle: c.documento ?? c.telefono ?? 'Sin datos de contacto',
        badge: debe
          ? { label: formatCurrency(c.saldo_deuda), variant: 'danger' }
          : { label: 'Al día', variant: 'success' },
        initials: c.nombre,
        onPress: () => {
          void persistRecent(q);
          goTo('Mas', 'ClienteEstadoCuenta', { clienteId: c.id });
        },
      };
    });

    const ventas: ResultItem[] = fuzzyFilter(
      q,
      resultados.ventas,
      (v) => `${v.numero} ${v.cliente_nombre ?? ''}`,
    ).map((v) => ({
      id: `v-${v.id}`,
      type: 'venta',
      title: v.numero,
      subtitle: v.cliente_nombre ?? 'Consumidor final',
      rightText: formatCurrency(v.total),
      badge:
        v.estado === 'anulada'
          ? { label: 'Anulada', variant: 'danger' }
          : undefined,
      onPress: () => {
        void persistRecent(q);
        goTo('Ventas', 'VentaDetalle', { ventaId: v.id });
      },
    }));

    const proveedores: ResultItem[] = fuzzyFilter(
      q,
      resultados.proveedores,
      (p) => `${p.nombre} ${p.contacto ?? ''} ${p.telefono ?? ''}`,
    ).map((p) => ({
      id: `pr-${p.id}`,
      type: 'proveedor',
      title: p.nombre,
      subtitle: p.contacto ?? p.telefono ?? 'Sin contacto',
      onPress: () => {
        void persistRecent(q);
        goTo('Mas', 'ProveedorDetalle', { proveedorId: p.id });
      },
    }));

    const out: { title: string; count: number; data: ResultItem[] }[] = [];
    if (productos.length)
      out.push({
        title: 'PRODUCTOS',
        count: productos.length,
        data: productos,
      });
    if (clientes.length)
      out.push({ title: 'CLIENTES', count: clientes.length, data: clientes });
    if (ventas.length)
      out.push({ title: 'VENTAS', count: ventas.length, data: ventas });
    if (proveedores.length)
      out.push({
        title: 'PROVEEDORES',
        count: proveedores.length,
        data: proveedores,
      });

    return out;
  }, [resultados, debouncedQuery, goTo, persistRecent]);

  const totalResults = sections.reduce((sum, s) => sum + s.count, 0);
  const showEmpty =
    !loading && debouncedQuery.length >= 1 && totalResults === 0;
  const showRecent = !query && historial.length > 0;
  const showHint = !query && historial.length === 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityLabel="Cerrar búsqueda"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>

        <View
          style={[styles.searchBox, { backgroundColor: colors.bgSubtle }]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            ref={inputRef}
            placeholder="Buscar productos, clientes, ventas..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
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

      {/* Barra de estado inferior del buscador */}
      {query.length >= 1 && totalResults > 0 ? (
        <View
          style={[
            styles.statusBar,
            {
              backgroundColor: colors.bgSubtle,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {totalResults}{' '}
            {totalResults === 1 ? 'resultado' : 'resultados'}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : null}
        </View>
      ) : null}

      {/* Loading inicial */}
      {loading && totalResults === 0 && debouncedQuery.length >= 1 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Buscando…
          </Text>
        </View>
      ) : null}

      {/* Error */}
      {error ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.dangerSubtle },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={14}
            color={colors.danger}
          />
          <Text style={[styles.errorText, { color: colors.dangerText }]}>
            {error}
          </Text>
        </View>
      ) : null}

      {/* Resultados */}
      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <Text
              style={[
                styles.sectionHeader,
                { color: colors.textMuted, backgroundColor: colors.bg },
              ]}
            >
              {section.title} ({section.count})
            </Text>
          )}
          renderItem={({ item, index, section }) => (
            <ResultRow
              item={item}
              isLast={index === section.data.length - 1}
              colors={colors}
            />
          )}
          renderSectionFooter={() => (
            <View style={{ height: spacing.md }} />
          )}
        />
      ) : null}

      {/* Empty state */}
      {showEmpty ? (
        <View style={styles.empty}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify-close"
              size={36}
              color={colors.textMuted}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Sin resultados
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            No encontramos nada para "{debouncedQuery}". Prueba con otro
            término.
          </Text>
        </View>
      ) : null}

      {/* Búsquedas recientes */}
      {showRecent ? (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[styles.sectionLabel, { color: colors.textMuted }]}
            >
              BÚSQUEDAS RECIENTES
            </Text>
            <Pressable onPress={limpiarHistorial} hitSlop={8}>
              <Text style={[styles.clearLink, { color: colors.accent }]}>
                Limpiar
              </Text>
            </Pressable>
          </View>
          <View style={styles.recentWrap}>
            {historial.map((item, idx) => (
              <Pressable
                key={`${item}-${idx}`}
                onPress={() => setQuery(item)}
                style={({ pressed }) => [
                  styles.recentChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed ? { opacity: 0.7 } : null,
                ]}
              >
                <MaterialCommunityIcons
                  name="history"
                  size={13}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.recentText, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Hint inicial */}
      {showHint ? (
        <View style={styles.hint}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={36}
              color={colors.textMuted}
            />
          </View>
          <Text style={[styles.hintTitle, { color: colors.textPrimary }]}>
            Busca en toda tu tienda
          </Text>
          <Text style={[styles.hintDesc, { color: colors.textSecondary }]}>
            Productos, clientes, ventas y proveedores en un solo lugar.
          </Text>

          {Platform.OS === 'web' ? (
            <View style={styles.hintChips}>
              <HintChip icon="barcode-scan" label="Código de barras" colors={colors} />
              <HintChip icon="account-outline" label="Cliente" colors={colors} />
              <HintChip icon="receipt" label="Número de venta" colors={colors} />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Footer en desktop con atajos */}
      {Platform.OS === 'web' ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            <Text style={styles.kbd}>ESC</Text> cerrar
            {'  ·  '}
            <Text style={styles.kbd}>↵</Text> abrir
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ============================================================
   Subcomponentes
   ============================================================ */

function ResultRow(props: {
  item: ResultItem;
  isLast: boolean;
  colors: ReturnType<typeof useColors>;
}): React.ReactElement {
  const { item, isLast, colors } = props;

  const imageUrl = item.image ? getImageUrl(item.image) : null;

  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        item.onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderBottomColor: isLast ? 'transparent' : colors.border,
          borderBottomWidth: isLast ? 0 : 1,
        },
        pressed ? { backgroundColor: colors.surfacePressed } : null,
      ]}
      accessibilityRole="button"
    >
      {item.type === 'producto' ? (
        imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.thumb, { backgroundColor: colors.bgSubtle }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.thumb,
              styles.thumbIcon,
              { backgroundColor: colors.bgSubtle },
            ]}
          >
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        )
      ) : item.type === 'cliente' ? (
        <Avatar nombre={item.initials ?? item.title} size="sm" />
      ) : (
        <View
          style={[
            styles.thumb,
            styles.thumbIcon,
            { backgroundColor: colors.bgSubtle },
          ]}
        >
          <MaterialCommunityIcons
            name={
              item.type === 'venta'
                ? 'receipt'
                : item.type === 'proveedor'
                  ? 'truck-outline'
                  : 'cube-outline'
            }
            size={16}
            color={colors.textSecondary}
          />
        </View>
      )}

      <View style={styles.rowInfo}>
        <Text
          style={[styles.rowTitle, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text
            style={[styles.rowSub, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowRight}>
        {item.rightText ? (
          <Text style={[styles.rowRightText, { color: colors.textPrimary }]}>
            {item.rightText}
          </Text>
        ) : null}
        {item.badge ? (
          <Badge
            label={item.badge.label}
            variant={item.badge.variant}
            size="sm"
          />
        ) : null}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={16}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

function HintChip(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
}): React.ReactElement {
  const { colors } = props;
  return (
    <View
      style={[
        styles.hintChip,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={13}
        color={colors.textMuted}
      />
      <Text style={[styles.hintChipText, { color: colors.textSecondary }]}>
        {props.label}
      </Text>
    </View>
  );
}

/* ============================================================
   Estilos
   ============================================================ */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  statusText: { ...typography.small },

  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: { ...typography.caption },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { ...typography.caption, flex: 1 },

  listContent: { paddingTop: spacing.md },
  sectionHeader: {
    ...typography.overline,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    borderWidth: 0,
    gap: spacing.md,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
  },
  thumbIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { ...typography.bodyBold },
  rowSub: { ...typography.small, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowRightText: { ...typography.bodyBold },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.giant,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyDesc: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },

  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: { ...typography.overline },
  clearLink: { ...typography.small },
  recentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 220,
  },
  recentText: { ...typography.small, flexShrink: 1 },

  hint: {
    alignItems: 'center',
    paddingVertical: spacing.giant,
    paddingHorizontal: spacing.xxl,
  },
  hintTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hintDesc: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  hintChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  hintChipText: { ...typography.small },

  footer: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  footerText: { ...typography.small },
  kbd: {
    fontFamily: typography.button.fontFamily,
    fontSize: 10,
  },
});