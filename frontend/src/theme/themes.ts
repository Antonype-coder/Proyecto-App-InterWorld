import { colors as lightColors } from './colors';

// Tema oscuro (por si más adelante lo activamos)
export const darkColors = {
  ...lightColors,
  bg:            '#0F172A',
  bgSubtle:      '#1E293B',
  bgMuted:       '#334155',
  surface:       '#1E293B',
  surfaceHover:  '#273449',
  surfacePressed: '#334155',
  border:        '#334155',
  borderStrong:  '#475569',
  textPrimary:   '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted:     '#94A3B8',
  textDisabled:  '#475569',
  textInverse:   '#0F172A',
  primary:       '#F1F5F9',
  primaryHover:  '#E2E8F0',
  primaryPressed: '#CBD5E1',
  primarySubtle: '#1E293B',
} as const;

export const themes = {
  light: lightColors,
  dark:  darkColors,
} as const;

export type ThemeMode = keyof typeof themes;