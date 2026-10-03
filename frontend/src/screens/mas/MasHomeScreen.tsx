import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';

export default function MasHomeScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [cerrando, setCerrando] = useState(false);

  const esAdmin = user?.rol === 'admin';

  const confirmarLogout = (): void => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setCerrando(true);
          try {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            await logout();
          } finally {
            setCerrando(false);
          }
        },
      },
    ]);
  };

  const ir = (screen: string, params?: Record<string, unknown>): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen as never, params as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi cuenta</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero perfil */}
        <View style={styles.heroSection}>
          <Avatar nombre={user?.nombre ?? 'Usuario'} size="xl" />
          <Text style={styles.heroNombre} numberOfLines={1}>
            {user?.nombre ?? 'Usuario'}
          </Text>
          <Text style={styles.heroEmail} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
          <View style={styles.heroBadge}>
            <Badge
              label={esAdmin ? 'Administrador' : 'Vendedor'}
              variant={esAdmin ? 'accent' : 'neutral'}
            />
          </View>
        </View>

        {/* Mi cuenta */}
        <Section title="MI CUENTA">
          <RowItem
            icon="account-outline"
            label="Editar perfil"
            sub="Cambiar nombre y correo"
            onPress={() => ir('Perfil')}
          />
          <RowItem
            icon="bell-outline"
            label="Notificaciones"
            sub="Ver todas las alertas"
            onPress={() => ir('Notificaciones')}
            isLast
          />
        </Section>

        {/* Operaciones */}
        <Section title="OPERACIONES">
          {esAdmin ? (
  <RowItem
    icon="crown-outline"
    label="Programa de lealtad"
    sub="Ranking y puntos de clientes"
    onPress={() => ir('LealtadRanking')}
  />
) : null}

          {esAdmin ? (
  <RowItem
    icon="clipboard-text-outline"
    label="Órdenes de compra"
    sub="Pedidos a proveedores"
    onPress={() => ir('OrdenesCompra')}
  />
) : null}
          {esAdmin ? (
  <RowItem
    icon="tag-outline"
    label="Promociones"
    sub="Descuentos y ofertas"
    onPress={() => ir('Promociones')}
  />
) : null}
          <RowItem
            icon="account-group-outline"
            label="Clientes"
            sub="Gestión y estado de cuenta"
            onPress={() => ir('Clientes')}
          />
          <RowItem
            icon="shape-outline"
            label="Categorías"
            sub="Administrar categorías de productos"
            onPress={() => ir('Categorias')}
          />
          <RowItem
            icon="truck-outline"
            label="Proveedores"
            sub="Gestionar proveedores y contactos"
            onPress={() => ir('Proveedores')}
          />
          <RowItem
            icon="package-variant-closed"
            label="Inventario"
            sub="Movimientos y stock"
            onPress={() => ir('Inventario')}
          />
          <RowItem
            icon="cash-register"
            label="Caja"
            sub="Abrir, cerrar y movimientos"
            onPress={() => ir('Caja')}
          />
          <RowItem
  icon="keyboard-return"
  label="Devoluciones"
  sub="Historial y nuevas devoluciones"
  onPress={() => ir('Devoluciones')}
/>
          {esAdmin ? (
            <>
              <RowItem
                icon="account-cog-outline"
                label="Usuarios"
                sub="Administrar usuarios"
                onPress={() => ir('Usuarios')}
              />
              <RowItem
                icon="chart-line"
                label="Reportes"
                sub="Análisis del negocio"
                onPress={() => ir('Reportes')}
              />
              <RowItem
                icon="cog-outline"
                label="Configuración"
                sub="Datos del negocio e impuestos"
                onPress={() => ir('Configuracion')}
                isLast
              />
            </>
          ) : (
            <RowItem
              icon="image-edit-outline"
              label="Logo del negocio"
              sub="Agregar, cambiar o quitar el logo"
              onPress={() => ir('Configuracion')}
              isLast
            />
          )}
        </Section>

<Section title="AYUDA">
  <RowItem
    icon="lifebuoy"
    label="Centro de ayuda"
    sub="Preguntas frecuentes"
    onPress={() => ir('CentroAyuda')}
  />
  <RowItem
    icon="information-outline"
    label="Acerca de"
    sub={`Interworld v2.0.0`}
    onPress={() => ir('AcercaDe')}
    isLast
  />
</Section>

        {/* Sesión */}
        <Section title="SESIÓN">
          <RowItem
            icon="logout-variant"
            label={cerrando ? 'Cerrando sesión...' : 'Cerrar sesión'}
            sub="Salir de tu cuenta"
            onPress={confirmarLogout}
            variant="danger"
            disabled={cerrando}
            isLast
          />
        </Section>

        <Text style={styles.version}>Interworld v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section(props: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      <View style={styles.sectionCard}>{props.children}</View>
    </View>
  );
}

function RowItem(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  isLast?: boolean;
}): React.ReactElement {
  const isDanger = props.variant === 'danger';

  return (
    <Pressable
      onPress={props.disabled ? undefined : props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.row,
        props.isLast ? styles.rowLast : null,
        pressed && !props.disabled ? styles.rowPressed : null,
        props.disabled ? { opacity: 0.5 } : null,
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          isDanger ? { backgroundColor: colors.dangerSubtle } : null,
        ]}
      >
        <MaterialCommunityIcons
          name={props.icon}
          size={18}
          color={isDanger ? colors.danger : colors.textSecondary}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text
          style={[
            styles.rowLabel,
            isDanger ? { color: colors.danger } : null,
          ]}
        >
          {props.label}
        </Text>
        {props.sub ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {props.sub}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={isDanger ? colors.danger : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  scroll: { paddingHorizontal: spacing.lg },
  heroSection: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroNombre: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  heroEmail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  heroBadge: { marginTop: spacing.md },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.surfacePressed },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: { ...typography.bodyBold, color: colors.textPrimary },
  rowSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  version: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});