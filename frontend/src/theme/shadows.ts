import { ViewStyle, Platform } from 'react-native';
import { colors } from './colors';

const buildShadows = (shadowOpacity: number, elevationBase: number) => ({
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  xs: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: shadowOpacity * 0.04,
      shadowRadius: 2,
    },
    android: { elevation: elevationBase },
    default: {},
  }) as ViewStyle,

  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: shadowOpacity * 0.06,
      shadowRadius: 4,
    },
    android: { elevation: elevationBase + 1 },
    default: {},
  }) as ViewStyle,

  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: shadowOpacity * 0.08,
      shadowRadius: 8,
    },
    android: { elevation: elevationBase + 3 },
    default: {},
  }) as ViewStyle,

  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: shadowOpacity * 0.1,
      shadowRadius: 16,
    },
    android: { elevation: elevationBase + 7 },
    default: {},
  }) as ViewStyle,

  xl: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: shadowOpacity * 0.14,
      shadowRadius: 32,
    },
    android: { elevation: elevationBase + 15 },
    default: {},
  }) as ViewStyle,
});

export const shadows = buildShadows(1, 1);

/**
 * En dark, las sombras se reducen porque la jerarquía la da el color
 * de superficie, no la profundidad.
 */
export const darkShadows = buildShadows(0.6, 0);

export type AppShadows = typeof shadows;