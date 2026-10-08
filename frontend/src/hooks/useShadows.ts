import { useTheme } from './useTheme';
import { shadows, darkShadows } from '@theme/shadows';

/**
 * Devuelve las sombras adecuadas según el tema activo.
 * En dark usa sombras más sutiles (o casi nulas) porque la jerarquía
 * la da el color de superficie, no la profundidad.
 */
export function useShadows() {
  const { isDark } = useTheme();
  return isDark ? darkShadows : shadows;
}