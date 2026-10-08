import { useEffect, useRef } from 'react';

/**
 * Ejecuta `callback` cada `intervalMs` mientras `enabled` sea true.
 * Se limpia automáticamente al desmontar o al deshabilitar.
 * El callback siempre lee la última versión (no queda "pegado" al closure).
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled: boolean = true,
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}