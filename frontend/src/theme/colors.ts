export interface AppColors {
  // Fondos
  bg: string;
  bgSubtle: string;
  bgMuted: string;

  // Superficies
  surface: string;
  surfaceHover: string;
  surfacePressed: string;

  // Bordes
  border: string;
  borderStrong: string;
  borderFocus: string;

  // Texto
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;

  // Marca
  primary: string;
  primaryHover: string;
  primaryPressed: string;
  primarySubtle: string;

  // Acento
  accent: string;
  accentHover: string;
  accentSubtle: string;
  accentText: string;

  // Paleta de datos
  chartPrimary: string;
  chartWine: string;
  chartPlum: string;
  chartBerry: string;
  chartMauve: string;
  chartSmoke: string;
  chartCocoa: string;

  chartPrimarySubtle: string;
  chartWineSubtle: string;
  chartPlumSubtle: string;
  chartBerrySubtle: string;
  chartMauveSubtle: string;
  chartSmokeSubtle: string;
  chartCocoaSubtle: string;

  // Semánticos
  success: string;
  successSubtle: string;
  successText: string;

  warning: string;
  warningSubtle: string;
  warningText: string;

  danger: string;
  dangerSubtle: string;
  dangerText: string;

  info: string;
  infoSubtle: string;
  infoText: string;

  // Overlay
  overlay: string;
  overlayLight: string;

  // Sombras
  shadowColor: string;
}

export const colors: AppColors = {
  // Fondos
  bg:            '#F9FAFB',
  bgSubtle:      '#F3F4F6',
  bgMuted:       '#E5E7EB',

  // Superficies
  surface:        '#FFFFFF',
  surfaceHover:   '#FAFBFC',
  surfacePressed: '#F3F4F6',

  // Bordes
  border:       '#E5E7EB',
  borderStrong: '#D1D5DB',
  borderFocus:  '#9CA3AF',

  // Texto
  textPrimary:   '#111827',
  textSecondary: '#4B5563',
  textMuted:     '#9CA3AF',
  textDisabled:  '#D1D5DB',
  textInverse:   '#FFFFFF',

  // Marca
  primary:        '#111827',
  primaryHover:   '#1F2937',
  primaryPressed: '#030712',
  primarySubtle:  '#F3F4F6',

  // Acento
  accent:       '#111827',
  accentHover:  '#1F2937',
  accentSubtle: '#F3F4F6',
  accentText:   '#111827',

  // ============================================================
  // PALETA DE DATOS — "joyas oscuras"
  // Basada en: #2C2C2C grafito, #853953 vino, #612D53 ciruela
  // ============================================================

  chartPrimary: '#2C2C2C',
  chartWine:    '#853953',
  chartPlum:    '#612D53',
  chartBerry:   '#A14B6B',
  chartMauve:   '#8B4A7C',
  chartSmoke:   '#F3F4F4',
  chartCocoa:   '#4A3538',

  chartPrimarySubtle: '#F3F4F4',
  chartWineSubtle:    '#FBF0F3',
  chartPlumSubtle:    '#F5EDF3',
  chartBerrySubtle:   '#FAEEF1',
  chartMauveSubtle:   '#F5EEF3',
  chartSmokeSubtle:   '#F9FAFB',
  chartCocoaSubtle:   '#F2EEEF',

  // ============================================================
  // SEMÁNTICOS
  // ============================================================
  success:       '#059669',
  successSubtle: '#ECFDF5',
  successText:   '#065F46',

  warning:       '#D97706',
  warningSubtle: '#FFFBEB',
  warningText:   '#92400E',

  danger:       '#BE123C',
  dangerSubtle: '#FFF1F2',
  dangerText:   '#881337',

  info:       '#0284C7',
  infoSubtle: '#F0F9FF',
  infoText:   '#075985',

  // Overlay
  overlay:      'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Sombras
  shadowColor: '#000000',
};