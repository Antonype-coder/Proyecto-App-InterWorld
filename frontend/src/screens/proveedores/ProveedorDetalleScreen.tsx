import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { colors, spacing, typography } from '@theme/index';
import { proveedoresApi } from '@api/index';
import type { MasStackParamList, Proveedor } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import EmptyState from '@components/ui/EmptyState';
import Skeleton from '@components/ui/Skeleton';

type Params = RouteProp<MasStackParamList, 'ProveedorDetalle'>;

export default function ProveedorDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const proveedorId = route.params.proveedorId;

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const data = await proveedoresApi.obtener(proveedorId);
      setProveedor(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [proveedorId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <KeyboardScreen>
      <TopBar
        title="Proveedor"
        onBack={() => navigation.goBack()}
        rightIcon="pencil-outline"
        onRightPress={() => navigation.navigate('ProveedorForm' as never, { proveedorId } as never)}
      />

      {loading ? (
        <View style={styles.content}>
          <Card variant="default" style={styles.card}>
            <Skeleton width="50%" height={18} />
            <Skeleton width="80%" height={14} style={{ marginTop: 12 }} />
            <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
          </Card>
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          description={error}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      ) : !proveedor ? (
        <EmptyState
          icon="truck-outline"
          title="Proveedor no encontrado"
          description="No pudimos cargar esta información."
        />
      ) : (
        <View style={styles.content}>
          <Card variant="default" style={styles.card}>
            <Text style={styles.name}>{proveedor.nombre}</Text>
            <Text style={styles.status}>
              {proveedor.activo === 1 ? 'Activo' : 'Inactivo'}
            </Text>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Contacto</Text>
              <Text style={styles.value}>{proveedor.contacto || 'Sin contacto'}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{proveedor.telefono || 'Sin teléfono'}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Correo</Text>
              <Text style={styles.value}>{proveedor.email || 'Sin correo'}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>{proveedor.direccion || 'Sin dirección'}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Notas</Text>
              <Text style={styles.value}>{proveedor.notas || 'Sin notas'}</Text>
            </View>
          </Card>

          <Button
            label="Editar proveedor"
            icon="pencil-outline"
            variant="outline"
            onPress={() => navigation.navigate('ProveedorForm' as never, { proveedorId } as never)}
            fullWidth
          />
        </View>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg, paddingBottom: spacing.giant },
  card: { marginBottom: spacing.md },
  name: { ...typography.h2, color: colors.textPrimary },
  status: {
    ...typography.bodyBold,
    color: colors.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  infoBlock: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  value: { ...typography.body, color: colors.textPrimary },
});
