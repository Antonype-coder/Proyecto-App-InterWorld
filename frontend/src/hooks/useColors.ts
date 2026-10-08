import { useTheme } from './useTheme';
import type { AppColors } from '@theme/index';

/**
 * Devuelve la paleta de colores del tema activo.
 * Cuando el usuario cambia entre claro/oscuro/sistema, todos los
 * componentes que usan este hook se repintan automáticamente.
 */
export function useColors(): AppColors {
  const { theme } = useTheme();
  return theme as AppColors;
}