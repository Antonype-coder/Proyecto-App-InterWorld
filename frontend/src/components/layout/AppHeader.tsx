import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { useTheme } from '@hooks/useTheme';
import { useColors } from '@hooks/useColors';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Sheet from '@components/ui/Sheet';
import Divider from '@components/ui/Divider';
import BusinessLogo from '@components/domain/BusinessLogo';
import { useTranslation } from '@/i18n';
import { ROL_LABEL } from '@utils/constants';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showCommands?: boolean;
  unreadCount?: number;
}

export default function AppHeader({
  title,
  subtitle,
  showSearch = true,
  showNotifications = true,
  showCommands = true,
  unreadCount = 0,
}: AppHeaderProps): React.ReactElement {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useUIStore((s) => s.showToast);
  const openPalette = useUIStore((s) => s.openPalette);
  const { t } = useTranslation();
  const { preference, setThemeMode } = useTheme();
  const colors = useColors();

  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.nombre?.split(' ')[0] ?? 'Usuario';
  const headerTitle = title ?? `Hola, ${displayName}`;

  const handleLogout = async (): Promise<void> => {
    setMenuOpen(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    showToast(t('auth.logoutSuccess'), 'success');
  };

  const handleOpenCommands = (): void => {
    void Haptics.selectionAsync();
    openPalette();
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.left}>
          <BusinessLogo size={32} style={styles.logo} />
          <View style={styles.titleBlock}>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {headerTitle}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          {showCommands ? (
            <Pressable
              onPress={handleOpenCommands}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed ? styles.iconBtnPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Abrir comandos"
            >
              <MaterialCommunityIcons
                name="lightning-bolt-outline"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
          ) : null}

          {showSearch ? (
            <Pressable
              onPress={() => navigation.navigate('BusquedaGlobal')}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed ? styles.iconBtnPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('header.search')}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
          ) : null}

          {showNotifications ? (
            <Pressable
              onPress={() =>
                navigation.navigate('Mas', { screen: 'Notificaciones' })
              }
              style={({ pressed }) => [
                styles.iconBtn,
                pressed ? styles.iconBtnPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('header.notifications')}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={colors.textPrimary}
              />
              {unreadCount > 0 ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.danger },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {unreadCount > 9 ? '9+' : String(unreadCount)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [
              styles.avatarBtn,
              pressed ? styles.iconBtnPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('header.profile')}
          >
            <Avatar nombre={user?.nombre ?? 'Usuario'} size="sm" />
          </Pressable>
        </View>
      </View>

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={styles.menuHeader}>
          <Avatar nombre={user?.nombre ?? 'Usuario'} size="lg" />
          <View style={styles.menuHeaderInfo}>
            <Text
              style={[styles.menuName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {user?.nombre ?? 'Usuario'}
            </Text>
            <Text
              style={[styles.menuEmail, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {user?.email ?? ''}
            </Text>
            {user?.rol ? (
              <View style={styles.menuRole}>
                <Badge
                  label={ROL_LABEL[user.rol] ?? user.rol}
                  variant={user.rol === 'admin' ? 'accent' : 'neutral'}
                  size="sm"
                />
              </View>
            ) : null}
          </View>
        </View>

        <Divider spacingVertical={spacing.lg} />

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          {t('header.theme')}
        </Text>
        <View style={styles.themeRow}>
          <ThemeOption
            icon="white-balance-sunny"
            label={t('header.themeLight')}
            active={preference === 'light'}
            onPress={() => setThemeMode('light')}
          />
          <ThemeOption
            icon="weather-night"
            label={t('header.themeDark')}
            active={preference === 'dark'}
            onPress={() => setThemeMode('dark')}
          />
          <ThemeOption
            icon="theme-light-dark"
            label={t('header.themeSystem')}
            active={preference === 'system'}
            onPress={() => setThemeMode('system')}
          />
        </View>

        <Divider spacingVertical={spacing.lg} />

        <MenuItem
          icon="account-circle-outline"
          label={t('header.profile')}
          onPress={() => {
            setMenuOpen(false);
            navigation.navigate('Mas', { screen: 'Perfil' });
          }}
        />
        <MenuItem
          icon="cog-outline"
          label={t('header.settings')}
          onPress={() => {
            setMenuOpen(false);
            navigation.navigate('Mas', { screen: 'Configuracion' });
          }}
        />
        <MenuItem
          icon="help-circle-outline"
          label={t('header.help')}
          onPress={() => {
            setMenuOpen(false);
            navigation.navigate('Mas', { screen: 'CentroAyuda' });
          }}
        />

        <View style={{ marginTop: spacing.lg }}>
          <Button
            label={t('auth.logout')}
            variant="danger"
            icon="logout"
            onPress={handleLogout}
            fullWidth
          />
        </View>
      </Sheet>
    </>
  );
}

function ThemeOption(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.themeOption,
        {
          backgroundColor: props.active ? colors.primary : colors.surface,
          borderColor: props.active ? colors.primary : colors.border,
        },
        pressed ? styles.iconBtnPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: props.active }}
      accessibilityLabel={props.label}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={18}
        color={props.active ? colors.textInverse : colors.textSecondary}
      />
      <Text
        style={[
          styles.themeLabel,
          {
            color: props.active ? colors.textInverse : colors.textSecondary,
          },
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function MenuItem(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed ? styles.menuItemPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={props.label}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={20}
        color={colors.textSecondary}
      />
      <Text style={[styles.menuItemLabel, { color: colors.textPrimary }]}>
        {props.label}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  logo: { marginRight: spacing.md },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { ...typography.h2 },
  subtitle: { ...typography.small, marginTop: 2 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
    fontFamily: typography.button.fontFamily,
  },
  avatarBtn: {
    marginLeft: spacing.xs,
    borderRadius: radius.pill,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuHeaderInfo: { flex: 1, minWidth: 0 },
  menuName: { ...typography.h3 },
  menuEmail: { ...typography.caption, marginTop: 2 },
  menuRole: { marginTop: spacing.sm },
  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.sm,
  },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  themeLabel: { ...typography.buttonSmall },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuItemPressed: { opacity: 0.6 },
  menuItemLabel: {
    ...typography.body,
    flex: 1,
  },
});