import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing } from '@theme/index';
import { useColors } from '@hooks/useColors';
import TopBar from '@components/layout/TopBar';
import { notificacionesApi } from '@api/index';
import type { Notificacion } from '@tipos/index';
import { FadeInItem } from '@components/animations';
import NotificacionItem from '@components/domain/NotificacionItem';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonVenta from '@components/ui/SkeletonVenta';
import ErrorState from '@components/feedback/ErrorState';
import Chip from '@components/ui/Chip';

type Filtro = 'todas' | 'no_leidas';

export default function NotificacionesScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await notificacionesApi.listar();
      setItems(res.items);
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

  const marcarTodas = async (): Promise<void> => {
    try {
      await notificacionesApi.marcarTodas();
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      setItems((actuales) => actuales.map((n) => ({ ...n, leida: 1 })));
    } catch {
      // Silencioso
    }
  };

  const noLeidas = useMemo(
    () => items.filter((n) => !n.leida).length,
    [items],
  );

  const filtrados = useMemo(
    () => (filtro === 'no_leidas' ? items.filter((n) => !n.leida) : items),
    [items, filtro],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Notificaciones"
        subtitle={
          noLeidas > 0
            ? `${noLeidas} sin leer`
            : `${items.length} ${
                items.length === 1 ? 'notificación' : 'notificaciones'
              }`
        }
        onBack={() => navigation.goBack()}
        rightIcon="check-all"
        rightLabel="Marcar leídas"
        onRightPress={noLeidas > 0 ? marcarTodas : undefined}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <Chip
          label="Todas"
          active={filtro === 'todas'}
          onPress={() => setFiltro('todas')}
        />
        <Chip
          label={`Sin leer${noLeidas > 0 ? ` (${noLeidas})` : ''}`}
          active={filtro === 'no_leidas'}
          onPress={() => setFiltro('no_leidas')}
        />
      </ScrollView>

      {loading && items.length === 0 ? (
        <View>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonVenta key={i} />
          ))}
        </View>
      ) : error && items.length === 0 ? (
        <ErrorState
          title="No pudimos cargar las notificaciones"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : filtrados.length === 0 ? (
        <RichEmptyState
          icon={filtro === 'no_leidas' ? 'bell-check-outline' : 'bell-outline'}
          title={filtro === 'no_leidas' ? 'Todo al día' : 'Sin notificaciones'}
          description={
            filtro === 'no_leidas'
              ? 'No tienes notificaciones pendientes.'
              : 'Aquí verás avisos importantes de tu negocio.'
          }
        />
      ) : (
        <FlatList
          data={filtrados}
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
              <NotificacionItem
                notificacion={item}
                onPress={async () => {
                  if (!item.leida) {
                    try {
                      await notificacionesApi.marcarLeida(item.id);
                      setItems((actuales) =>
                        actuales.map((n) =>
                          n.id === item.id ? { ...n, leida: 1 } : n,
                        ),
                      );
                    } catch {
                      // Silencioso
                    }
                  }
                }}
              />
            </FadeInItem>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  chipsScroll: { flexGrow: 0, maxHeight: 60, marginBottom: spacing.sm },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  list: { flex: 1, borderTopWidth: 1 },
  listContent: { paddingBottom: spacing.xxl },
});