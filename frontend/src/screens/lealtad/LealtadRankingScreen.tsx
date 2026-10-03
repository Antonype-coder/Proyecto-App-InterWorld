import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { lealtadApi } from '@api/index';
import type { ClienteRanking } from '@tipos/index';
import { formatCurrency } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import Avatar from '@components/ui/Avatar';
import LealtadBadge from '@components/domain/LealtadBadge';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';

export default function LealtadRankingScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<ClienteRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const res = await lealtadApi.ranking(100);
      setItems(res);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); void cargar(); }, [cargar]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Ranking de lealtad" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="crown-outline"
          title="Sin datos de lealtad"
          description="Los clientes ganan puntos al comprar."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void cargar(); }}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('Mas', {
                  screen: 'ClienteEstadoCuenta',
                  params: { clienteId: item.id },
                })
              }
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <View style={[
                styles.rank,
                index === 0 ? styles.rank1 : null,
                index === 1 ? styles.rank2 : null,
                index === 2 ? styles.rank3 : null,
              ]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Avatar nombre={item.nombre} size="sm" />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
                <View style={styles.metaRow}>
                  <LealtadBadge nivel={item.nivel_lealtad} size="sm" />
                  <Text style={styles.puntos}>{item.puntos_actuales} pts</Text>
                </View>
                <Text style={styles.sub}>Total compras: {formatCurrency(item.total_compras)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  listContent: { paddingBottom: spacing.xxl },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  rank: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center',
  },
  rank1: { backgroundColor: '#FEF3C7' },
  rank2: { backgroundColor: '#E5E7EB' },
  rank3: { backgroundColor: '#FED7AA' },
  rankText: { ...typography.bodyBold, color: colors.textPrimary },
  nombre: { ...typography.bodyBold, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  puntos: { ...typography.small, color: colors.accent, fontFamily: typography.button.fontFamily },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});