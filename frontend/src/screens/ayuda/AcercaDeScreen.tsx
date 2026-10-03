import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, radius, spacing, typography } from '@theme/index';
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Acerca de" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logo}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={40}
              color={colors.textPrimary}
            />
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.version}>Versión {APP_VERSION}</Text>
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descripcion}>
            Sistema de punto de venta, inventario y administración para
            pequeños y medianos comercios de Latinoamérica. Diseñado para ser
            rápido, completo y fácil de usar desde tu celular.
          </Text>
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Funcionalidades</Text>
          {FEATURES.map((f, idx) => (
            <View
              key={idx}
              style={[
                styles.featureRow,
                idx === FEATURES.length - 1 ? styles.featureRowLast : null,
              ]}
            >
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                  name={f.icon as never}
                  size={18}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Stack técnico</Text>
          <Text style={styles.techText}>
            <Text style={styles.techBold}>Backend:</Text> PHP 8.1+ · MySQL · JWT · Monolog
          </Text>
          <Text style={styles.techText}>
            <Text style={styles.techBold}>Frontend:</Text> React Native · Expo · TypeScript
          </Text>
          <Text style={styles.techText}>
            <Text style={styles.techBold}>Estado:</Text> Zustand · Axios · Zod
          </Text>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hecho con Amor para comerciantes
          </Text>
          <Text style={styles.footerSub}>
            © 2026 {APP_NAME}. Todos los derechos reservados.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: { ...typography.h1, color: colors.textPrimary },
  version: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  descripcion: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  featureRowLast: { borderBottomWidth: 0 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  techText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  techBold: { ...typography.bodyBold, color: colors.textPrimary },
  footer: { alignItems: 'center', marginTop: spacing.xl },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerSub: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});