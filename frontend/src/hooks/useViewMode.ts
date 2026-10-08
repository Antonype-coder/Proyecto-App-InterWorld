import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartViewMode = 'compact' | 'comfortable' | 'detailed';

const STORAGE_KEY = '@interworld:cart-view-mode';
const DEFAULT: CartViewMode = 'comfortable';

export function useViewMode(): {
  mode: CartViewMode;
  setMode: (mode: CartViewMode) => void;
  hydrated: boolean;
} {
  const [mode, setModeState] = useState<CartViewMode>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (
          !cancelled &&
          (stored === 'compact' ||
            stored === 'comfortable' ||
            stored === 'detailed')
        ) {
          setModeState(stored);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (next: CartViewMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  return { mode, setMode, hydrated };
}