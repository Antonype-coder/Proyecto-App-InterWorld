import { API_URL } from './constants';

export function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|file:|content:|blob:|data:)/i.test(path)) return path;

  const base = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}