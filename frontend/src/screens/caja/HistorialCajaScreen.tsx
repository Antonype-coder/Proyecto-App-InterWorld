import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { cajaApi } from '@api/index';
import type { CajaSesion } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import Badge from '@components/ui/Badge';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';

/**
 * Calcula un "techo razonable" para la diferencia.
 * Si la diferencia absoluta lo supera, es un dato anómalo (bug del backend)
 * y no lo mostramos como número para no confundir al usuario.
 */
function techoRazonable(sesion: CajaSesion): number {
  const apertura = parseFloat(sesion.monto_apertura) || 0;
  const ventas =
    (parseFloat(sesion.total_ventas_efectivo) || 0) +
    (parseFloat(sesion.total_ventas_tarjeta) || 0) +
    (parseFloat(sesion.total_ventas_transferencia) || 0);
  const ingresos = parseFloat(sesion.total_ingresos) || 0;
  return apertura + ventas + ingresos;
}

export default function HistorialCajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();

  const [sesiones, setSesiones] = useState<CajaSesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await cajaApi.historial();
      setSesiones(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
      setSesiones([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  const onRefresh = (): void => {
    setRefreshing(true);
    void cargar();
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar title="Historial de caja" onBack={() => navigation.goBack()} />

      {loading && sesiones.length === 0 ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.skelItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Skeleton width={40} height={40} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="60%" height={14} />
                <Skeleton
                  width="40%"
                  height={12}
                  style={{ marginTop: 6 }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          description={error}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      ) : sesiones.length === 0 ? (
        <EmptyState
          icon="history"
          title="Sin historial"
          description="Cuando cierres una caja, aparecerá aquí."
        />
      ) : (
        <FlatList
          data={sesiones}
          keyExtractor={(item) => String(item.id)}
          style={[
            styles.list,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item }) => (
            <SesionRow
              sesion={item}
              colors={colors}
              onPress={
                item.estado === 'abierta'
                  ? () => navigation.navigate('Caja' as never)
                  : undefined
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SesionRow(props: {
  sesion: CajaSesion;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
}): React.ReactElement {
  const { sesion, colors, onPress } = props;
  const abierta = sesion.estado === 'abierta';

  const diferenciaRaw = sesion.diferencia ? parseFloat(sesion.diferencia) : 0;
  const tech = techoRazonable(sesion);
  const esAnomala = tech > 0 && Math.abs(diferenciaRaw) > tech;
  const tieneDiferencia = !esAnomala && Math.abs(diferenciaRaw) >= 0.5;
  const sinDiferencia = !esAnomala && !tieneDiferencia && !abierta;

  const content = (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: abierta
              ? colors.successSubtle
              : colors.bgSubtle,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={abierta ? 'lock-open-outline' : 'lock-outline'}
          size={18}
          color={abierta ? colors.success : colors.textMuted}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {formatDateTime(sesion.abierta_at)}
          </Text>
          {abierta ? (
            <Badge label="Abierta" variant="success" size="sm" />
          ) : null}
        </View>

        <Text
          style={[styles.sub, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {sesion.cerrada_at
            ? `Cerrada: ${formatDateTime(sesion.cerrada_at)}`
            : 'Aún abierta'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
            Apertura:{' '}
            <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
              {formatCurrency(sesion.monto_apertura)}
            </Text>
          </Text>

          {sesion.monto_cierre_declarado ? (
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
              Declarado:{' '}
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                {formatCurrency(sesion.monto_cierre_declarado)}
              </Text>
            </Text>
          ) : null}
        </View>

        {tieneDiferencia ? (
          <View style={styles.diffRow}>
            <MaterialCommunityIcons
              name={diferenciaRaw > 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={diferenciaRaw > 0 ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.diffText,
                { color: diferenciaRaw > 0 ? colors.success : colors.danger },
              ]}
            >
              {diferenciaRaw > 0 ? 'Sobrante ' : 'Faltante '}
              {formatCurrency(Math.abs(diferenciaRaw))}
            </Text>
          </View>
        ) : sinDiferencia ? (
          <View style={styles.diffRow}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={12}
              color={colors.success}
            />
            <Text style={[styles.diffText, { color: colors.success }]}>
              Sin diferencia
            </Text>
          </View>
        ) : esAnomala ? (
          <View style={styles.diffRow}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={12}
              color={colors.textMuted}
            />
            <Text
              style={[styles.diffText, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              Diferencia anómala · revisar
            </Text>
          </View>
        ) : null}
      </View>

      {sesion.monto_cierre_declarado ? (
        <View style={styles.right}>
          <Text style={[styles.rightLabel, { color: colors.textMuted }]}>
            Cierre
          </Text>
          <Text
            style={[styles.rightValue, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {formatCurrency(sesion.monto_cierre_declarado)}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) =>
        pressed ? { backgroundColor: colors.surfacePressed } : null
      }
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  listContent: { paddingBottom: spacing.xxl },
  listWrapper: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  skelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.bodyBold, flexShrink: 1 },
  sub: { ...typography.small, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaLabel: { ...typography.tiny },
  metaValue: {
    fontFamily: typography.button.fontFamily,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  diffText: {
    ...typography.tiny,
    fontFamily: typography.button.fontFamily,
    flexShrink: 1,
  },
  right: { alignItems: 'flex-end' },
  rightLabel: { ...typography.tiny },
  rightValue: {
    ...typography.bodyBold,
    marginTop: 2,
  },
});