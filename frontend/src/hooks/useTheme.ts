import { useColorScheme } from 'react-native';
import { themes } from '@theme/index';
import { useUIStore, type ThemePreference } from '@store/uiStore';

export type EffectiveThemeMode = 'light' | 'dark';

export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useUIStore((s) => s.themeMode);
  const setThemeMode = useUIStore((s) => s.setThemeMode);

  const effective: EffectiveThemeMode =
    themeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  const theme = themes[effective];

  return {
    theme,
    mode: effective,
    preference: themeMode as ThemePreference,
    isDark: effective === 'dark',
    setThemeMode,
    toggle: () => setThemeMode(effective === 'dark' ? 'light' : 'dark'),
  };
}