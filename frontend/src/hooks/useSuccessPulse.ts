import { useCallback, useRef, useState } from 'react';

interface UseSuccessPulseOptions {
  /** Cuánto dura visible en ms (default 900). */
  duration?: number;
}

/**
 * Hook para mostrar un overlay de éxito que pulsa y desaparece.
 *
 * Uso:
 *   const [visible, trigger] = useSuccessPulse();
 *   <SuccessPulse visible={visible} />
 *   trigger(); // se activa el pulse
 */
export function useSuccessPulse({
  duration = 900,
}: UseSuccessPulseOptions = {}): [boolean, () => void] {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), duration);
  }, [duration]);

  return [visible, trigger];
}