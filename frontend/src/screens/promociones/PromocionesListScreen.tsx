import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { promocionesApi } from '@api/index';
import type { Promocion } from '@tipos/index';
import { formatCurrency, formatDate } from '@utils/format';
import TopBar from '@components/layout/TopBar';
import Badge from '@components/ui/Badge';
import FAB from '@components/ui/FAB';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';

export default function PromocionesListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const res = await promocionesApi.listar();
      setItems(res);
    } catch {
      setItems([]);
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

  const eliminar = (p: Promocion): void => {
    Alert.alert('Desactivar', `¿Desactivar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          try {
            await promocionesApi.eliminar(p.id);
            await cargar();
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Promociones" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={40} height={40} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="tag-outline"
          title="Sin promociones"
          description="Crea tu primera promoción para tus clientes."
          actionLabel="Crear promoción"
          onAction={() => navigation.navigate('PromocionForm')}
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
              onRefresh={() => {
                setRefreshing(true);
                void cargar();
              }}
              tintColor={colors.textSecondary}
            />
          }
          renderItem={({ item }) => {
            const activa = item.activo === 1;
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('PromocionForm', { promocionId: item.id })
                }
                onLongPress={() => eliminar(item)}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: activa ? colors.successSubtle : colors.bgSubtle },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getIconForTipo(item.tipo)}
                    size={20}
                    color={activa ? colors.success : colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.titulo} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {getDescripcion(item)}
                  </Text>
                  <Text style={styles.fecha}>
                    {formatDate(item.fecha_inicio)} → {formatDate(item.fecha_fin)}
                  </Text>
                </View>
                <Badge
                  label={activa ? 'Activa' : 'Inactiva'}
                  variant={activa ? 'success' : 'neutral'}
                  size="sm"
                />
              </Pressable>
            );
          }}
        />
      )}

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('PromocionForm')}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

function getIconForTipo(tipo: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (tipo) {
    case 'porcentaje': return 'percent-outline';
    case 'monto_fijo': return 'cash-minus';
    case 'precio_especial': return 'tag-outline';
    case '2x1': return 'numeric-2-box-multiple-outline';
    case '3x2': return 'numeric-3-box-multiple-outline';
    default: return 'tag-outline';
  }
}

function getDescripcion(p: Promocion): string {
  switch (p.tipo) {
    case 'porcentaje': return `${p.valor}% de descuento`;
    case 'monto_fijo': return `${formatCurrency(p.valor)} de descuento`;
    case 'precio_especial': return `Precio especial: ${formatCurrency(p.valor)}`;
    case '2x1': return '2x1 (lleva 2 paga 1)';
    case '3x2': return '3x2 (lleva 3 paga 2)';
    default: return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  listContent: { paddingBottom: 100 },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  titulo: { ...typography.bodyBold, color: colors.textPrimary },
  sub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  fecha: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});