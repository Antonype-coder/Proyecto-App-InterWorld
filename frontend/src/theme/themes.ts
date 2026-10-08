import { colors as lightColors } from './colors';
import type { AppColors } from './colors';

export const darkColors: AppColors = {
  bg:             '#0A0A0B',
  bgSubtle:       '#141416',
  bgMuted:        '#1C1C1F',

  surface:        '#141416',
  surfaceHover:   '#1A1A1D',
  surfacePressed: '#1C1C1F',

  border:         '#26262A',
  borderStrong:   '#33333A',
  borderFocus:    '#52525B',

  textPrimary:    '#FAFAFA',
  textSecondary:  '#A1A1A8',
  textMuted:      '#71717A',
  textDisabled:   '#52525B',
  textInverse:    '#0A0A0B',

  primary:        '#FAFAFA',
  primaryHover:   '#E4E4E7',
  primaryPressed: '#D4D4D8',
  primarySubtle:  '#1C1C1F',

  accent:         '#FAFAFA',
  accentHover:    '#E4E4E7',
  accentSubtle:   '#1C1C1F',
  accentText:     '#FAFAFA',

  // Charts en dark — versión luminosa
  chartPrimary: '#E4E4E7',
  chartWine:    '#D17389',
  chartPlum:    '#B588A8',
  chartBerry:   '#E08AA0',
  chartMauve:   '#C99BB8',
  chartSmoke:   '#F3F4F4',
  chartCocoa:   '#A8858C',

  chartPrimarySubtle: '#1C1C1F',
  chartWineSubtle:    '#3A1F28',
  chartPlumSubtle:    '#2C1A28',
  chartBerrySubtle:   '#3F2229',
  chartMauveSubtle:   '#2E1F2B',
  chartSmokeSubtle:   '#1A1A1D',
  chartCocoaSubtle:   '#2A2124',

  success:        '#34D399',
  successSubtle:  '#052E22',
  successText:    '#6EE7B7',

  warning:        '#FBBF24',
  warningSubtle:  '#3B2A08',
  warningText:    '#FCD34D',

  danger:         '#FB7185',
  dangerSubtle:   '#3F1010',
  dangerText:     '#FDA4AF',

  info:           '#38BDF8',
  infoSubtle:     '#0B2942',
  infoText:       '#7DD3FC',

  overlay:        'rgba(0, 0, 0, 0.75)',
  overlayLight:   'rgba(0, 0, 0, 0.5)',

  shadowColor:    '#000000',
};

export const themes = {
  light: lightColors,
  dark:  darkColors,
} as const;

export type ThemeMode = keyof typeof themes;