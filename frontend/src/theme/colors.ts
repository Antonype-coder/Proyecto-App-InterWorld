export const colors = {
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
  accent:       '#4F46E5',
  accentHover:  '#4338CA',
  accentSubtle: '#EEF2FF',
  accentText:   '#3730A3',

  // Éxito
  success:       '#059669',
  successSubtle: '#ECFDF5',
  successText:   '#065F46',

  // Advertencia
  warning:       '#D97706',
  warningSubtle: '#FFFBEB',
  warningText:   '#92400E',

  // Peligro
  danger:       '#DC2626',
  dangerSubtle: '#FEF2F2',
  dangerText:   '#991B1B',

  // Info
  info:       '#0284C7',
  infoSubtle: '#F0F9FF',
  infoText:   '#075985',

  // Overlay
  overlay:      'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Sombras
  shadowColor: '#000000',
} as const;

export type AppColors = typeof colors;