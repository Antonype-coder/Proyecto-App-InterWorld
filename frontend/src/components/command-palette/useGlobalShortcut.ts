import { useEffect } from 'react';
import { Platform } from 'react-native';

interface Options {
  /** Ej: ['meta', 'k'] o ['ctrl', 'k'] */
  keys: string[];
  handler: () => void;
  enabled?: boolean;
}

/**
 * Atajo de teclado global. En web/desktop registra el listener.
 * En móvil es no-op porque no aplica.
 */
export function useGlobalShortcut({
  keys,
  handler,
  enabled = true,
}: Options): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return undefined;
    if (typeof window === 'undefined') return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      const match = keys.every((k) => {
        if (k === 'meta') return e.metaKey;
        if (k === 'ctrl') return e.ctrlKey;
        if (k === 'shift') return e.shiftKey;
        if (k === 'alt') return e.altKey;
        return e.key.toLowerCase() === k.toLowerCase();
      });
      if (match) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keys, handler, enabled]);
}