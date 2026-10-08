import { useEffect } from 'react';
import { Platform } from 'react-native';

interface ShortcutHandlers {
  onCustomer?: () => void;
  onDiscount?: () => void;
  onClear?: () => void;
  onCheckout?: () => void;
  onSearch?: () => void;
}

/**
 * Atajos de teclado para el POS (solo web / desktop).
 * - F2: Cliente
 * - F4: Descuento
 * - F8: Cobrar
 * - Esc: Limpiar carrito
 * - Ctrl+K / Cmd+K: Focus búsqueda
 */
export function usePOSShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    if (typeof window === 'undefined') return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignorar cuando el usuario está escribiendo en un input
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'F2') {
        e.preventDefault();
        handlers.onCustomer?.();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        handlers.onDiscount?.();
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        handlers.onCheckout?.();
        return;
      }
      if (e.key === 'Escape' && !isTyping) {
        handlers.onClear?.();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}