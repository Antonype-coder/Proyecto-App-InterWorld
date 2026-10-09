import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Ejecuta un loader al enfocar la pantalla.
 * - La PRIMERA vez: llama `onFirstLoad` (para mostrar skeletons).
 * - Las siguientes: llama solo `onRefresh` (refresca en background).
 */
export function useFocusedLoad(
  loader: () => void | Promise<void>,
  onFirstLoad?: () => void,
) {
  const isFirst = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirst.current) {
        onFirstLoad?.();
        isFirst.current = false;
      }
      void loader();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loader]),
  );
}