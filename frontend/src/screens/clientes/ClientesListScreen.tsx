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

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import TopBar from '@components/layout/TopBar';
import { clientesApi } from '@api/index';
import type { Cliente } from '@tipos/index';
import { useDebounce } from '@hooks/useDebounce';
import { FadeInItem } from '@components/animations';
import ClienteItem from '@components/domain/ClienteItem';
import FAB from '@components/ui/FAB';
import RichEmptyState from '@components/ui/RichEmptyState';
import SkeletonProducto from '@components/ui/SkeletonProducto';
import ErrorState from '@components/feedback/ErrorState';

export default function ClientesListScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
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

  const hayFiltro = busqueda.length > 0 || soloConDeuda;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Clientes"
        subtitle={`${clientesFiltrados.length} ${
          clientesFiltrados.length === 1 ? 'cliente' : 'clientes'
        }`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
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
            style={[styles.searchInput, { color: colors.textPrimary }]}
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
            { color: colors.textMuted },
            soloConDeuda ? { color: colors.textPrimary } : null,
            soloConDeuda ? styles.toggleTextActive : null,
          ]}
        >
          Mostrar solo clientes con deuda
        </Text>
      </Pressable>

      {loading && clientes.length === 0 ? (
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonProducto key={i} />
          ))}
        </View>
      ) : error && clientes.length === 0 ? (
        <ErrorState
          title="No pudimos cargar los clientes"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error}
          onRetry={cargar}
        />
      ) : clientesFiltrados.length === 0 ? (
        <RichEmptyState
          icon={hayFiltro ? 'account-search-outline' : 'account-group-outline'}
          title={hayFiltro ? 'Sin resultados' : 'Sin clientes aún'}
          description={
            soloConDeuda
              ? 'Ningún cliente tiene deuda pendiente.'
              : busqueda
                ? 'Prueba con otro término.'
                : 'Registra tu primer cliente para gestionar créditos y ventas.'
          }
          actionLabel={!hayFiltro ? 'Agregar cliente' : undefined}
          onAction={
            !hayFiltro
              ? () => navigation.navigate('ClienteForm' as never)
              : undefined
          }
          secondaryLabel={hayFiltro ? 'Limpiar filtros' : undefined}
          onSecondary={
            hayFiltro
              ? () => {
                  setBusqueda('');
                  setSoloConDeuda(false);
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          data={clientesFiltrados}
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
              <ClienteItem
                cliente={item}
                onPress={() =>
                  navigation.navigate(
                    'ClienteEstadoCuenta' as never,
                    { clienteId: item.id } as never,
                  )
                }
              />
            </FadeInItem>
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
  safe: { flex: 1 },
  searchWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  toggleText: { ...typography.caption },
  toggleTextActive: {
    fontFamily: typography.button.fontFamily,
  },
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  listContent: { paddingBottom: 100 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});