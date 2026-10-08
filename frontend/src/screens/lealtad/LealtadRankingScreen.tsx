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
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { lealtadApi } from '@api/index';
import type { ClienteRanking } from '@tipos/index';
import { formatCurrency } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import { FadeInItem } from '@components/animations';
import Avatar from '@components/ui/Avatar';
import LealtadBadge from '@components/domain/LealtadBadge';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonVenta from '@components/ui/SkeletonVenta';
import ErrorState from '@components/feedback/ErrorState';

export default function LealtadRankingScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [items, setItems] = useState<ClienteRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await lealtadApi.ranking(100);
      setItems(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
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

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Ranking de lealtad"
        subtitle={`${items.length} ${
          items.length === 1 ? 'cliente' : 'clientes'
        }`}
        onBack={() => navigation.goBack()}
      />

      {loading && items.length === 0 ? (
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonVenta key={i} />
          ))}
        </View>
      ) : error && items.length === 0 ? (
        <ErrorState
          title="No pudimos cargar el ranking"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : items.length === 0 ? (
        <RichEmptyState
          icon="crown-outline"
          title="Sin datos de lealtad"
          description="Los clientes ganan puntos al comprar. El ranking aparecerá cuando tengas clientes con actividad."
        />
      ) : (
        <FlatList
          data={items}
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
              onRefresh={() => {
                setRefreshing(true);
                void cargar();
              }}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item, index }) => (
            <FadeInItem delay={Math.min(index * 20, 240)}>
              <Pressable
                onPress={() =>
                  navigation.navigate('Mas', {
                    screen: 'ClienteEstadoCuenta',
                    params: { clienteId: item.id },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.border },
                  pressed ? { backgroundColor: colors.surfacePressed } : null,
                ]}
              >
                <View
                  style={[
                    styles.rank,
                    { backgroundColor: colors.bgSubtle },
                    index === 0
                      ? { backgroundColor: colors.warningSubtle }
                      : null,
                    index === 1 ? { backgroundColor: colors.bgMuted } : null,
                    index === 2
                      ? { backgroundColor: colors.warningSubtle }
                      : null,
                  ]}
                >
                  <Text style={[styles.rankText, { color: colors.textPrimary }]}>
                    {index + 1}
                  </Text>
                </View>
                <Avatar nombre={item.nombre} size="sm" />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text
                    style={[styles.nombre, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.nombre}
                  </Text>
                  <View style={styles.metaRow}>
                    <LealtadBadge nivel={item.nivel_lealtad} size="sm" />
                    <Text style={[styles.puntos, { color: colors.accent }]}>
                      {item.puntos_actuales} pts
                    </Text>
                  </View>
                  <Text style={[styles.sub, { color: colors.textMuted }]}>
                    Total compras: {formatCurrency(item.total_compras)}
                  </Text>
                </View>
              </Pressable>
            </FadeInItem>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { flex: 1, borderTopWidth: 1 },
  listContent: { paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { ...typography.bodyBold },
  nombre: { ...typography.bodyBold },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  puntos: { ...typography.small, fontFamily: typography.button.fontFamily },
  sub: { ...typography.small, marginTop: 2 },
});