import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
import { cajaApi } from '@api/index';
import type { CajaSesion } from '@tipos/index';
import { formatCurrency, formatDateTime } from '@utils/format';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Badge from '@components/ui/Badge';
import Loader from '@components/ui/Loader';
import TopBar from '@components/layout/TopBar';

export default function CajaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [sesion, setSesion] = useState<CajaSesion | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const res = await cajaApi.estado();
      setSesion(res);
    } catch {
      setSesion(null);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopBar title="Caja" onBack={() => navigation.goBack()} />
        <Loader message="Cargando estado de caja" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar
        title="Caja"
        onBack={() => navigation.goBack()}
        rightIcon="history"
        onRightPress={() =>
          navigation.navigate('CajaHistorial' as never)
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {sesion === null ? (
          <Card variant="elevated" style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="cash-register"
                size={32}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>Caja cerrada</Text>
            <Text style={styles.emptyDesc}>
              Abre la caja para comenzar a registrar ventas de tu turno.
            </Text>
            <View style={{ marginTop: spacing.xl, width: '100%' }}>
              <Button
                label="Abrir caja"
                icon="lock-open-outline"
                onPress={() =>
                  navigation.navigate('AbrirCaja' as never)
                }
                fullWidth
                variant="primary"
                size="lg"
              />
            </View>
          </Card>
        ) : (
          <>
            <Card variant="elevated" style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroLabel}>Caja abierta</Text>
                  <Text style={styles.heroMonto}>
                    {formatCurrency(sesion.monto_apertura)}
                  </Text>
                </View>
                <Badge label="Activa" variant="success" />
              </View>
              <Text style={styles.heroFecha}>
                Desde {formatDateTime(sesion.abierta_at)}
              </Text>
            </Card>

            <Text style={styles.sectionLabel}>TOTALES DEL TURNO</Text>
            <View style={styles.grid}>
              <TotalCard
                icon="cash"
                label="Efectivo"
                value={formatCurrency(sesion.total_ventas_efectivo)}
                color={colors.success}
              />
              <TotalCard
                icon="credit-card-outline"
                label="Tarjeta"
                value={formatCurrency(sesion.total_ventas_tarjeta)}
                color={colors.accent}
              />
              <TotalCard
                icon="bank-transfer"
                label="Transferencia"
                value={formatCurrency(sesion.total_ventas_transferencia)}
                color={colors.info}
              />
              <TotalCard
                icon="cash-plus"
                label="Ingresos"
                value={formatCurrency(sesion.total_ingresos)}
                color={colors.success}
              />
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <Button
                label="Registrar movimiento"
                icon="swap-horizontal"
                variant="outline"
                onPress={() =>
                  navigation.navigate(
                    'CajaMovimientoForm' as never,
                    { sesionId: sesion.id } as never,
                  )
                }
                fullWidth
              />
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label="Cerrar caja"
                icon="lock-outline"
                variant="danger"
                onPress={() =>
                  navigation.navigate(
                    'CerrarCaja' as never,
                    { sesionId: sesion.id } as never,
                  )
                }
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TotalCard(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  color: string;
}): React.ReactElement {
  return (
    <View style={styles.totalCard}>
      <View style={[styles.totalIcon, { backgroundColor: props.color + '15' }]}>
        <MaterialCommunityIcons
          name={props.icon}
          size={18}
          color={props.color}
        />
      </View>
      <Text style={styles.totalLabel}>{props.label}</Text>
      <Text style={styles.totalValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  emptyCard: { alignItems: 'center', padding: spacing.xxl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroCard: { marginBottom: spacing.xxl },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heroLabel: { ...typography.small, color: colors.textMuted },
  heroMonto: {
    ...typography.price,
    color: colors.textPrimary,
    marginTop: 4,
  },
  heroFecha: { ...typography.small, color: colors.textMuted },
  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  totalCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  totalIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: { ...typography.small, color: colors.textSecondary },
  totalValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
});