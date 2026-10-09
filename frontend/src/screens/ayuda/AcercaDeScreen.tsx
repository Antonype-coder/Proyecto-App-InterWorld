import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppColors } from '@theme/colors';
import { APP_NAME, APP_VERSION } from '@utils/constants';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';

const FEATURES = [
  { icon: 'cart-outline', label: 'Punto de venta completo' },
  { icon: 'barcode-scan', label: 'Escáner de códigos de barras' },
  { icon: 'package-variant-closed', label: 'Gestión de inventario' },
  { icon: 'account-group-outline', label: 'Clientes con crédito' },
  { icon: 'cash-register', label: 'Caja con arqueo' },
  { icon: 'chart-line', label: 'Reportes avanzados' },
  { icon: 'file-pdf-box', label: 'Exportar a PDF y Excel' },
  { icon: 'crown-outline', label: 'Programa de lealtad' },
  { icon: 'shield-check-outline', label: 'Auditoría y seguridad' },
];

export default function AcercaDeScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <TopBar title="Acerca de" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.logo,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="storefront-outline"
              size={40}
              color={colors.textPrimary}
            />
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>
            {APP_NAME}
          </Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>
            Versión {APP_VERSION}
          </Text>
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Descripción
          </Text>
          <Text style={[styles.descripcion, { color: colors.textSecondary }]}>
            Sistema de punto de venta, inventario y administración para
            pequeños y medianos comercios de Latinoamérica. Diseñado para ser
            rápido, completo y fácil de usar desde tu celular.
          </Text>
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Funcionalidades
          </Text>
          {FEATURES.map((f, idx) => (
            <View
              key={idx}
              style={[
                styles.featureRow,
                { borderBottomColor: colors.border },
                idx === FEATURES.length - 1 ? styles.featureRowLast : null,
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: colors.accentSubtle },
                ]}
              >
                <MaterialCommunityIcons
                  name={f.icon as never}
                  size={18}
                  color={colors.accent}
                />
              </View>
              <Text style={[styles.featureLabel, { color: colors.textPrimary }]}>
                {f.label}
              </Text>
            </View>
          ))}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Stack técnico
          </Text>
          <Text style={[styles.techText, { color: colors.textSecondary }]}>
            <Text style={[styles.techBold, { color: colors.textPrimary }]}>Backend:</Text> PHP 8.1+ · MySQL · JWT · Monolog
          </Text>
          <Text style={[styles.techText, { color: colors.textSecondary }]}>
            <Text style={[styles.techBold, { color: colors.textPrimary }]}>Frontend:</Text> React Native · Expo · TypeScript
          </Text>
          <Text style={[styles.techText, { color: colors.textSecondary }]}>
            <Text style={[styles.techBold, { color: colors.textPrimary }]}>Estado:</Text> Zustand · Axios · Zod
          </Text>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Hecho con amor para comerciantes
          </Text>
          <Text style={[styles.footerSub, { color: colors.textMuted }]}>
            © 2026 {APP_NAME}. Todos los derechos reservados.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
    hero: { alignItems: 'center', marginBottom: spacing.xl },
    logo: {
      width: 96,
      height: 96,
      borderRadius: radius.xxl,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    appName: { ...typography.h1 },
    version: { ...typography.caption, marginTop: 4 },
    section: { marginBottom: spacing.md },
    sectionTitle: {
      ...typography.h3,
      marginBottom: spacing.md,
    },
    descripcion: {
      ...typography.body,
      lineHeight: 22,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      gap: spacing.md,
    },
    featureRowLast: { borderBottomWidth: 0 },
    featureIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureLabel: { ...typography.body, flex: 1 },
    techText: {
      ...typography.body,
      marginBottom: spacing.sm,
      lineHeight: 22,
    },
    techBold: { ...typography.bodyBold },
    footer: { alignItems: 'center', marginTop: spacing.xl },
    footerText: {
      ...typography.caption,
    },
    footerSub: {
      ...typography.tiny,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
  });