import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { spacing, typography, radius } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppColors } from '@theme/colors';
import { http } from '@api/client';
import { formatDateTime } from '@utils/format';
import { useDebounce } from '@hooks/useDebounce';
import { useFocusedLoad } from '@hooks/useFocusedLoad';
import TopBar from '@components/layout/TopBar';
import Chip from '@components/ui/Chip';
import Skeleton from '@components/ui/Skeleton';
import EmptyState from '@components/ui/EmptyState';

interface AuditoriaItem {
  id: number;
  usuario_nombre?: string | null;
  accion: string;
  entidad: string;
  entidad_id?: number | null;
  descripcion?: string | null;
  created_at: string;
}

type Filtro = 'todos' | 'ventas' | 'productos' | 'clientes' | 'usuarios';

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'productos', label: 'Productos' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'usuarios', label: 'Usuarios' },
];

export default function AuditoriaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [logs, setLogs] = useState<AuditoriaItem[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtroDebounced = useDebounce(filtro, 200);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const params: Record<string, string | number> = {
        limit: 100,
        offset: 0,
      };
      if (filtroDebounced !== 'todos') {
        params.entidad = filtroDebounced;
      }

      const data = await http.get<AuditoriaItem[]>('/auditoria', { params });
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'No se pudo cargar la auditoría';
      if (logs.length === 0) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroDebounced]);

  useFocusedLoad(cargar, () => setLoading(true));

  const onRefresh = (): void => {
    setRefreshing(true);
    void cargar();
  };

  const renderItem = ({ item }: { item: AuditoriaItem }): React.ReactElement => (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bgSubtle }]}>
        <MaterialCommunityIcons
          name={iconForAccion(item.accion)}
          size={16}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.rowContent}>
        <Text
          style={[styles.rowTitle, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.descripcion ?? `${item.accion} · ${item.entidad}`}
        </Text>
        <Text
          style={[styles.rowMeta, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {item.usuario_nombre ?? 'Sistema'} · {formatDateTime(item.created_at)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Auditoría"
        subtitle="Registro de actividad"
        onBack={() => navigation.goBack()}
      />

      <View
        style={[
          styles.filtersWrap,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.filtersRow}>
          {FILTROS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              active={filtro === f.value}
              onPress={() => setFiltro(f.value)}
            />
          ))}
        </View>
      </View>

      {loading && logs.length === 0 ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={32} height={32} borderRadius={radius.md} />
              <View style={styles.skeletonText}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : error && logs.length === 0 ? (
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudo cargar"
          description={error}
          actionLabel="Reintentar"
          onAction={() => {
            setLoading(true);
            void cargar();
          }}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          icon="history"
          title="Sin actividad registrada"
          description={
            filtro === 'todos'
              ? 'Cuando el equipo realice acciones importantes, aparecerán aquí.'
              : 'No hay actividad para este filtro.'
          }
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          style={{ backgroundColor: colors.bg }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
          ItemSeparatorComponent={() => (
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function iconForAccion(
  accion: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  const normalized = accion.toLowerCase();
  if (normalized.includes('crear')) return 'plus-circle-outline';
  if (normalized.includes('actualiz')) return 'pencil-outline';
  if (normalized.includes('elimin')) return 'trash-can-outline';
  if (normalized.includes('anul')) return 'cancel';
  if (normalized.includes('login')) return 'login';
  return 'information-outline';
}

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1 },

    filtersWrap: {
      borderBottomWidth: 1,
    },
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      padding: spacing.md,
    },

    skeletonWrap: { padding: spacing.lg, gap: spacing.md },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    skeletonText: { flex: 1 },

    listContent: {
      paddingVertical: spacing.sm,
      paddingBottom: spacing.giant,
    },
    separator: {
      height: 1,
      marginLeft: spacing.lg + 32 + spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowContent: { flex: 1, minWidth: 0 },
    rowTitle: { ...typography.bodyBold },
    rowMeta: {
      ...typography.small,
      marginTop: 2,
    },
  });