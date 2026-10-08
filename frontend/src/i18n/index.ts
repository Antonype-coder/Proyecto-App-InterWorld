import { create } from 'zustand';
import { es } from './es';
import { en } from './en';

export type Locale = 'es' | 'en';

const dictionaries = { es, en } as const;

function lookup(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let acc: unknown = obj;
  for (const part of parts) {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      acc = (acc as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof acc === 'string' ? acc : undefined;
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  );
}

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = lookup(dictionaries[locale], key);
  const fallback = lookup(dictionaries.es, key);
  const value = primary ?? fallback ?? key;
  return interpolate(value, vars);
}

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: 'es',
  setLocale: (locale) => set({ locale }),
}));

export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  return {
    locale,
    setLocale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
  };
}

export { es, en };