import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { useTheme } from '@hooks/useTheme';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import AppHeader from '@components/layout/AppHeader';
import { ROL_LABEL } from '@utils/constants';
import { StaggeredSection, FadeInItem, ShineEffect } from '@components/animations';
import type { Rol } from '@tipos/index';

export default function MasHomeScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useUIStore((s) => s.showToast);
  const { preference } = useTheme();

  const isAdmin = user?.rol === 'admin';
  const rol: Rol = user?.rol ?? 'vendedor';

  const handleLogout = async (): Promise<void> => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    showToast('Sesión cerrada correctamente.', 'success');
  };

  const go = (route: string, params?: Record<string, unknown>): void => {
    void Haptics.selectionAsync();
    navigation.navigate(route as never, params as never);
  };

  const themeLabel =
    preference === 'system'
      ? 'Sistema'
      : preference === 'dark'
        ? 'Oscuro'
        : 'Claro';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <AppHeader showSearch={false} showNotifications={false} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ Tarjeta de usuario ============ */}
        <StaggeredSection delay={0}>
          <View style={styles.userCardWrapper}>
            <ShineEffect borderRadius={radius.lg} delay={500}>
              <View
                style={[
                  styles.userCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Avatar nombre={user?.nombre ?? 'Usuario'} size="lg" />
                <View style={styles.userInfo}>
                  <Text
                    style={[styles.userName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {user?.nombre ?? 'Usuario'}
                  </Text>
                  <Text
                    style={[styles.userEmail, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {user?.email ?? ''}
                  </Text>
                  <View style={styles.userRole}>
                    <Badge
                      label={ROL_LABEL[rol]}
                      variant={isAdmin ? 'accent' : 'neutral'}
                      size="sm"
                    />
                  </View>
                </View>
                <ChevronButton onPress={() => go('Perfil')} />
              </View>
            </ShineEffect>
          </View>
        </StaggeredSection>

        {/* ============ Mi cuenta ============ */}
        <StaggeredSection delay={120}>
          <Section title="MI CUENTA" colors={colors}>
            <MenuGroup colors={colors}>
              <MenuRow
                icon="account-circle-outline"
                label="Perfil"
                description="Datos personales y de contacto"
                onPress={() => go('Perfil')}
                colors={colors}
              />
              <MenuRow
                icon="account-edit-outline"
                label="Editar perfil"
                onPress={() => go('EditarPerfil')}
                colors={colors}
              />
              <MenuRow
                icon="lock-outline"
                label="Cambiar contraseña"
                onPress={() => go('CambiarPassword')}
                colors={colors}
                last
              />
            </MenuGroup>
          </Section>
        </StaggeredSection>

        {/* ============ Operación ============ */}
        <StaggeredSection delay={240}>
          <Section title="OPERACIÓN" colors={colors}>
            <MenuGroup colors={colors}>
              <MenuRow icon="cash-register" label="Caja" description="Apertura, cierre y movimientos" onPress={() => go('Caja')} colors={colors} />
              <MenuRow icon="swap-horizontal" label="Inventario" description="Entradas, salidas y ajustes" onPress={() => go('Inventario')} colors={colors} />
              <MenuRow icon="account-group-outline" label="Clientes" description="Cartera y estado de cuenta" onPress={() => go('Clientes')} colors={colors} />
              <MenuRow icon="package-variant-closed" label="Proveedores" onPress={() => go('Proveedores')} colors={colors} />
              <MenuRow icon="tag-outline" label="Categorías" onPress={() => go('Categorias')} colors={colors} />
              <MenuRow icon="ticket-percent-outline" label="Promociones" onPress={() => go('Promociones')} colors={colors} />
              <MenuRow icon="clipboard-list-outline" label="Órdenes de compra" onPress={() => go('OrdenesCompra')} colors={colors} />
              <MenuRow icon="backup-restore" label="Devoluciones" onPress={() => go('Devoluciones')} colors={colors} last />
            </MenuGroup>
          </Section>
        </StaggeredSection>

        {/* ============ Administración ============ */}
        {isAdmin ? (
          <StaggeredSection delay={360}>
            <Section title="ADMINISTRACIÓN" colors={colors}>
              <MenuGroup colors={colors}>
                <MenuRow icon="chart-line" label="Reportes" description="Ventas, utilidades y cartera" onPress={() => go('Reportes')} colors={colors} />
                <MenuRow icon="star-circle-outline" label="Ranking de lealtad" onPress={() => go('LealtadRanking')} colors={colors} />
                <MenuRow icon="account-multiple-outline" label="Usuarios" description="Equipo y permisos" onPress={() => go('Usuarios')} colors={colors} />
                <MenuRow icon="history" label="Auditoría" description="Registro de actividad" onPress={() => go('Auditoria')} colors={colors} last />
              </MenuGroup>
            </Section>
          </StaggeredSection>
        ) : null}

        {/* ============ Preferencias ============ */}
        <StaggeredSection delay={480}>
          <Section title="PREFERENCIAS" colors={colors}>
            <MenuGroup colors={colors}>
              <MenuRow icon="theme-light-dark" label="Apariencia" description={themeLabel} onPress={() => go('Apariencia')} colors={colors} />
              <MenuRow icon="bell-outline" label="Notificaciones" description="Alertas y recordatorios" onPress={() => go('Notificaciones')} colors={colors} />
              <MenuRow icon="cog-outline" label="Configuración" description="Datos del negocio, impuestos y respaldo" onPress={() => go('Configuracion')} colors={colors} last />
            </MenuGroup>
          </Section>
        </StaggeredSection>

        {/* ============ Ayuda ============ */}
        <StaggeredSection delay={600}>
          <Section title="AYUDA" colors={colors}>
            <MenuGroup colors={colors}>
              <MenuRow icon="help-circle-outline" label="Centro de ayuda" onPress={() => go('CentroAyuda')} colors={colors} />
              <MenuRow icon="information-outline" label="Acerca de" description="Versión 2.0.0" onPress={() => go('AcercaDe')} colors={colors} last />
            </MenuGroup>
          </Section>
        </StaggeredSection>

        {/* ============ Cerrar sesión ============ */}
        <StaggeredSection delay={720}>
          <View style={styles.logoutWrap}>
            <Button
              label="Cerrar sesión"
              variant="danger"
              icon="logout"
              onPress={handleLogout}
              fullWidth
            />
          </View>

          <Text style={[styles.footer, { color: colors.textMuted }]}>
            Interworld · v2.0.0
          </Text>
        </StaggeredSection>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   Subcomponentes con animaciones
   ============================================================ */

type Colors = ReturnType<typeof useColors>;

function Section(props: {
  title: string;
  children: React.ReactNode;
  colors: Colors;
}): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: props.colors.textMuted }]}>
        {props.title}
      </Text>
      {props.children}
    </View>
  );
}

function MenuGroup(props: {
  children: React.ReactNode;
  colors: Colors;
}): React.ReactElement {
  return (
    <View
      style={[
        styles.menuGroup,
        {
          backgroundColor: props.colors.surface,
          borderColor: props.colors.border,
        },
      ]}
    >
      {props.children}
    </View>
  );
}

function MenuRow(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  colors: Colors;
  last?: boolean;
}): React.ReactElement {
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={props.onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.menuRow,
          { borderBottomColor: props.colors.border },
          props.last ? styles.menuRowLast : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={props.label}
      >
        <View
          style={[
            styles.menuIcon,
            { backgroundColor: props.colors.bgSubtle },
          ]}
        >
          <MaterialCommunityIcons
            name={props.icon}
            size={20}
            color={props.colors.textSecondary}
          />
        </View>
        <View style={styles.menuContent}>
          <Text
            style={[styles.menuLabel, { color: props.colors.textPrimary }]}
          >
            {props.label}
          </Text>
          {props.description ? (
            <Text
              style={[
                styles.menuDescription,
                { color: props.colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {props.description}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={props.colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
}

function ChevronButton({
  onPress,
}: {
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.85,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        hitSlop={8}
        style={styles.userEdit}
        accessibilityRole="button"
        accessibilityLabel="Ver perfil"
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   Estilos
   ============================================================ */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: spacing.giant },

  userCardWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { ...typography.h3 },
  userEmail: { ...typography.caption, marginTop: 2 },
  userRole: { marginTop: spacing.sm },
  userEdit: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.overline,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  menuGroup: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
    minHeight: 56,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: { flex: 1, minWidth: 0 },
  menuLabel: { ...typography.body },
  menuDescription: { ...typography.small, marginTop: 2 },

  logoutWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  footer: {
    ...typography.small,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});