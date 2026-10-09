import { API_URL } from './constants';

export function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|file:|content:|blob:|data:)/i.test(path)) return path;

  // Quita "/api" del final de la URL base para apuntar a la raíz del backend
  // Ej: http://192.168.2.12:8000/tiendaapi/api  →  http://192.168.2.12:8000/tiendaapi
  const base = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

  return `${base}/${path.replace(/^\/+/, '')}`;
}