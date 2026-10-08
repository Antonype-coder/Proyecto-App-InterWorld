import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductViewMode = 'grid' | 'list' | 'compact';

const STORAGE_KEY = '@interworld:product-view-mode';
const DEFAULT: ProductViewMode = 'grid';

export function useProductViewMode(): {
  mode: ProductViewMode;
  setMode: (mode: ProductViewMode) => void;
  hydrated: boolean;
} {
  const [mode, setModeState] = useState<ProductViewMode>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (
          !cancelled &&
          (stored === 'grid' || stored === 'list' || stored === 'compact')
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

  const setMode = (next: ProductViewMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  return { mode, setMode, hydrated };
}