import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número como moneda (COP por defecto).
 */
export function formatCurrency(value: string | number, symbol = '$'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return `${symbol}0`;

  const formatted = num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
}

/**
 * Formatea un número con separadores de miles.
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('es-CO');
}

/**
 * Formatea una fecha ISO en formato corto: "12 ene 2026".
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const date = parseISO(iso);
    return format(date, "d MMM yyyy", { locale: es });
  } catch {
    return '—';
  }
}

/**
 * Formatea una fecha ISO con hora: "12 ene 2026 · 14:30".
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const date = parseISO(iso);
    return format(date, "d MMM yyyy · HH:mm", { locale: es });
  } catch {
    return '—';
  }
}

/**
 * Devuelve "Hoy", "Ayer" o la fecha corta.
 */
export function formatRelativeDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const date = parseISO(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffMs = today.getTime() - target.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return formatDate(iso);
  } catch {
    return '—';
  }
}

/**
 * Devuelve las iniciales de un nombre: "Juan Pérez" → "JP".
 */
export function getInitials(nombre: string | null | undefined): string {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Trunca un texto a N caracteres agregando "...".
 */
export function truncate(text: string, length = 40): string {
  if (text.length <= length) return text;
  return text.substring(0, length - 1) + '...';
}

/**
 * Convierte una fecha al formato YYYY-MM-DD (para query params).
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Devuelve el color según el nivel de stock.
 */
export function getStockColor(stock: number, minimo: number): string {
  if (stock <= 0) return '#DC2626';
  if (stock <= minimo) return '#D97706';
  return '#059669';
}