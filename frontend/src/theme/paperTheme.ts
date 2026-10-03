import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';
import { radius } from './spacing';
import { fontFamily } from './typography';

const baseFonts = MD3LightTheme.fonts;

const interFonts = {
  displayLarge:   { ...baseFonts.displayLarge,   fontFamily: fontFamily.bold },
  displayMedium:  { ...baseFonts.displayMedium,  fontFamily: fontFamily.bold },
  displaySmall:   { ...baseFonts.displaySmall,   fontFamily: fontFamily.bold },
  headlineLarge:  { ...baseFonts.headlineLarge,  fontFamily: fontFamily.bold },
  headlineMedium: { ...baseFonts.headlineMedium, fontFamily: fontFamily.semibold },
  headlineSmall:  { ...baseFonts.headlineSmall,  fontFamily: fontFamily.semibold },
  titleLarge:     { ...baseFonts.titleLarge,     fontFamily: fontFamily.semibold },
  titleMedium:    { ...baseFonts.titleMedium,    fontFamily: fontFamily.medium },
  titleSmall:     { ...baseFonts.titleSmall,     fontFamily: fontFamily.medium },
  bodyLarge:      { ...baseFonts.bodyLarge,      fontFamily: fontFamily.regular },
  bodyMedium:     { ...baseFonts.bodyMedium,     fontFamily: fontFamily.regular },
  bodySmall:      { ...baseFonts.bodySmall,      fontFamily: fontFamily.regular },
  labelLarge:     { ...baseFonts.labelLarge,     fontFamily: fontFamily.medium },
  labelMedium:    { ...baseFonts.labelMedium,    fontFamily: fontFamily.medium },
  labelSmall:     { ...baseFonts.labelSmall,     fontFamily: fontFamily.medium },
};

export const paperTheme = {
  ...MD3LightTheme,
  fonts: interFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.textInverse,
    primaryContainer: colors.primarySubtle,
    onPrimaryContainer: colors.textPrimary,
    secondary: colors.accent,
    onSecondary: colors.textInverse,
    background: colors.bg,
    onBackground: colors.textPrimary,
    surface: colors.surface,
    onSurface: colors.textPrimary,
    surfaceVariant: colors.bgSubtle,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    outlineVariant: colors.border,
    error: colors.danger,
    onError: colors.textInverse,
    errorContainer: colors.dangerSubtle,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
    roundness: radius.md,
  },
};

export type AppTheme = typeof paperTheme;