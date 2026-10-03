import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

/**
 * Hook simple de conectividad. Sin dependencia externa.
 * Por defecto asume online; se puede conectar luego con @react-native-community/netinfo.
 */
export function useNetworkStatus(): boolean | null {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const update = (connected?: boolean, reachable?: boolean): void => {
      if (active) setIsOnline(connected === true && reachable !== false);
    };

    void Network.getNetworkStateAsync().then(
      (state) => update(state.isConnected, state.isInternetReachable),
      () => update(true),
    );

    const subscription = Network.addNetworkStateListener((state) => {
      update(state.isConnected, state.isInternetReachable);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return isOnline;
}