import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useFocusReload(reload: () => Promise<void> | void) {
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.resolve(reload()).finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [reload]),
  );

  return { loading };
}