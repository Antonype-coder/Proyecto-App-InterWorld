import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { cajaApi } from '@api/index';
import type { CajaSesion } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import Badge from '@components/ui/Badge';
import TopBar from '@components/layout/TopBar';
import EmptyState from '@components/ui/EmptyState';
import Loader from '@components/ui/Loader';

export default function HistorialCajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [historial, setHistorial] = useState<CajaSesion[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const res = await cajaApi.historial();
      setHistorial(res);
    } catch {
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar
        title="Historial de caja"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <Loader message="Cargando historial" />
      ) : historial.length === 0 ? (
        <EmptyState
          icon="history"
          title="Sin historial"
          description="Aún no has cerrado ninguna caja."
        />
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.row,
                index === historial.length - 1 ? styles.rowLast : null,
              ]}
            >
              <View style={styles.info}>
                <Text style={styles.fecha}>
                  {formatDateTime(item.abierta_at)}
                </Text>
                <Text style={styles.sub}>
                  Cierre: {item.cerrada_at ? formatDateTime(item.cerrada_at) : '—'}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.monto}>
                  {formatCurrency(item.monto_cierre_declarado ?? '0')}
                </Text>
                <Badge
                  label={item.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                  variant={item.estado === 'abierta' ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowLast: { marginBottom: 0 },
  info: { flex: 1 },
  fecha: { ...typography.bodyBold, color: colors.textPrimary },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  monto: { ...typography.bodyBold, color: colors.textPrimary },
});