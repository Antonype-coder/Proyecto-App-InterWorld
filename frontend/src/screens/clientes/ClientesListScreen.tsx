import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import TopBar from '@components/layout/TopBar';
import { clientesApi } from '@api/index';
import type { Cliente } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import ClienteItem from '@components/domain/ClienteItem';
import FAB from '@components/ui/FAB';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';

export default function ClientesListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [soloConDeuda, setSoloConDeuda] = useState(false);

  const debouncedBusqueda = useDebounce(busqueda, 400);

  const cargar = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const data = await clientesApi.listar({
        busqueda: debouncedBusqueda,
        activo: 1,
      });
      setClientes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedBusqueda]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  const clientesFiltrados = soloConDeuda
    ? clientes.filter((c) => parseFloat(c.saldo_deuda) > 0)
    : clientes;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar
        title="Clientes"
        subtitle={`${clientesFiltrados.length} ${clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar por nombre o documento"
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.searchInput}
          />
        </View>
      </View>

      <Pressable
        onPress={() => setSoloConDeuda((v) => !v)}
        style={styles.toggleRow}
      >
        <MaterialCommunityIcons
          name={soloConDeuda ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={18}
          color={soloConDeuda ? colors.textPrimary : colors.textMuted}
        />
        <Text
          style={[
            styles.toggleText,
            soloConDeuda ? styles.toggleTextActive : null,
          ]}
        >
          Mostrar solo clientes con deuda
        </Text>
      </Pressable>

      {loading ? (
        <View style={styles.listWrapper}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skelItem}>
              <Skeleton width={40} height={40} borderRadius={20} />
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
      ) : clientesFiltrados.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="Sin clientes"
          description={
            soloConDeuda
              ? 'Ningún cliente tiene deuda pendiente.'
              : 'Aún no has agregado clientes.'
          }
          actionLabel={!soloConDeuda ? 'Agregar cliente' : undefined}
          onAction={
            !soloConDeuda
              ? () => navigation.navigate('ClienteForm' as never)
              : undefined
          }
        />
      ) : (
        <FlatList
          data={clientesFiltrados}
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
          renderItem={({ item }) => (
            <ClienteItem
              cliente={item}
              onPress={() =>
                navigation.navigate(
                  'ClienteEstadoCuenta' as never,
                  { clienteId: item.id } as never,
                )
              }
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('ClienteForm' as never)}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  toggleText: { ...typography.caption, color: colors.textMuted },
  toggleTextActive: {
    color: colors.textPrimary,
    fontFamily: typography.button.fontFamily,
  },
  list: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listContent: { paddingBottom: 100 },
  listWrapper: { paddingHorizontal: spacing.lg },
  skelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});