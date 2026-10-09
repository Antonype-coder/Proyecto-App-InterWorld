import React, { useCallback, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppColors } from '@theme/colors';
import { useFocusedLoad } from '@hooks/useFocusedLoad';
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
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  useFocusedLoad(cargar, () => setLoading(true));

  const confirmarEliminar = (p: Promocion): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Eliminar promoción',
      `¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await promocionesApi.eliminar(p.id);
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                setItems((prev) => prev.filter((x) => x.id !== p.id));
              } catch (e) {
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );
                const msg = e instanceof Error ? e.message : 'Error';
                Alert.alert('Error', msg);
              }
            })();
          },
        },
      ],
    );
  };

  const toggleActivo = async (p: Promocion): Promise<void> => {
    void Haptics.selectionAsync();
    const nuevoActivo = p.activo === 1 ? 0 : 1;

    setItems((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, activo: nuevoActivo } : x)),
    );

    try {
      await promocionesApi.actualizar(p.id, { activo: nuevoActivo });
    } catch (e) {
      // Revertir si falla
      setItems((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, activo: p.activo } : x)),
      );
      const msg = e instanceof Error ? e.message : 'Error';
      Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar title="Promociones" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3].map((i) => (
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
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
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
          renderItem={({ item }) => {
            const activa = item.activo === 1;
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('PromocionForm', { promocionId: item.id })
                }
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.border },
                  pressed ? { backgroundColor: colors.surfacePressed } : null,
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor: activa
                        ? colors.successSubtle
                        : colors.bgSubtle,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getIconForTipo(item.tipo)}
                    size={20}
                    color={activa ? colors.success : colors.textMuted}
                  />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.titulo, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.nombre}
                  </Text>
                  <Text
                    style={[styles.sub, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {getDescripcion(item)}
                  </Text>
                  <Text
                    style={[styles.fecha, { color: colors.textMuted }]}
                  >
                    {formatDate(item.fecha_inicio)} → {formatDate(item.fecha_fin)}
                  </Text>
                </View>

                <View style={styles.actionsCol}>
                  <Pressable
                    onPress={() => void toggleActivo(item)}
                    hitSlop={6}
                    style={[
                      styles.miniBtn,
                      {
                        backgroundColor: colors.bgSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                    accessibilityLabel={activa ? 'Desactivar' : 'Activar'}
                  >
                    <MaterialCommunityIcons
                      name={activa ? 'toggle-switch' : 'toggle-switch-off-outline'}
                      size={18}
                      color={activa ? colors.success : colors.textMuted}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => confirmarEliminar(item)}
                    hitSlop={6}
                    style={[
                      styles.miniBtn,
                      {
                        backgroundColor: colors.dangerSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                    accessibilityLabel="Eliminar"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={16}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
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

function getIconForTipo(
  tipo: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (tipo) {
    case 'porcentaje':
      return 'percent-outline';
    case 'monto_fijo':
      return 'cash-minus';
    case 'precio_especial':
      return 'tag-outline';
    case '2x1':
      return 'numeric-2-box-multiple-outline';
    case '3x2':
      return 'numeric-3-box-multiple-outline';
    default:
      return 'tag-outline';
  }
}

function getDescripcion(p: Promocion): string {
  switch (p.tipo) {
    case 'porcentaje':
      return `${p.valor}% de descuento`;
    case 'monto_fijo':
      return `${formatCurrency(p.valor)} de descuento`;
    case 'precio_especial':
      return `Precio especial: ${formatCurrency(p.valor)}`;
    case '2x1':
      return '2x1 (lleva 2 paga 1)';
    case '3x2':
      return '3x2 (lleva 3 paga 2)';
    default:
      return '';
  }
}

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    list: { flex: 1, borderTopWidth: 1 },
    listContent: { paddingBottom: 100 },
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
      padding: spacing.md,
      borderBottomWidth: 1,
      gap: spacing.md,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titulo: { ...typography.bodyBold },
    sub: { ...typography.small, marginTop: 2 },
    fecha: { ...typography.tiny, marginTop: 2 },
    actionsCol: {
      gap: spacing.xs,
    },
    miniBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
  });