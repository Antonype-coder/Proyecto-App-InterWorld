import { Platform } from 'react-native';

// ============================================================================
// Env helpers
// ============================================================================
const env = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

const envInt = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

// ============================================================================
// API
// ============================================================================
const fallbackApiUrl = Platform.select({
  android: 'http://10.0.2.2/tiendaapi/api',
  ios: 'http://192.168.2.4/tiendaapi/api',
  default: 'http://192.168.2.4/tiendaapi/api',
}) as string;

export const API_URL = env('EXPO_PUBLIC_API_URL', fallbackApiUrl);

// ============================================================================
// Storage keys
// ============================================================================
export const STORAGE_TOKEN_KEY = '@interworld:token';
export const STORAGE_USER_KEY = '@interworld:user';
export const STORAGE_ONBOARDING_KEY = '@interworld:onboarding_pending';
export const STORAGE_THEME_KEY = '@interworld:theme';
export const STORAGE_LANGUAGE_KEY = '@interworld:language';

// ============================================================================
// App
// ============================================================================
export const APP_NAME = env('EXPO_PUBLIC_APP_NAME', 'InterWorld');
export const APP_VERSION = env('EXPO_PUBLIC_APP_VERSION', '2.0.0');

// ============================================================================
// Negocio / POS
// ============================================================================
export const MONEDA_DEFAULT = env('EXPO_PUBLIC_MONEDA_DEFAULT', 'COP');
export const SIMBOLO_MONEDA_DEFAULT = env(
  'EXPO_PUBLIC_SIMBOLO_MONEDA_DEFAULT',
  '$',
);
export const IMPUESTO_DEFAULT = envInt('EXPO_PUBLIC_IMPUESTO_DEFAULT', 0);
export const MAX_FOTOS_PRODUCTO = envInt('EXPO_PUBLIC_MAX_FOTOS_PRODUCTO', 8);
export const ITEMS_POR_PAGINA = envInt('EXPO_PUBLIC_ITEMS_POR_PAGINA', 20);
export const MAX_INTENTOS_LOGIN = envInt('EXPO_PUBLIC_MAX_INTENTOS_LOGIN', 5);

// ============================================================================
// Labels
// ============================================================================
export const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
};

export const METODO_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  mixto: 'Mixto',
};

export const TIPO_PAGO_LABEL: Record<string, string> = {
  contado: 'Contado',
  credito: 'Crédito',
};

export const ESTADO_VENTA_LABEL: Record<string, string> = {
  completada: 'Completada',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  devuelta: 'Devuelta',
};