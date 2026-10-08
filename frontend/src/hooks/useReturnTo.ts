import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export interface ReturnTo {
  tab: string;
  screen: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
}

const TAB_NAMES = ['Inicio', 'Productos', 'Vender', 'Ventas', 'Mas'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTabNavigator(navigation: any): any {
  let current = navigation;
  let last = navigation;
  for (let i = 0; i < 10 && current; i++) {
    const state = current.getState?.();
    const routeNames: string[] = state?.routeNames ?? [];
    if (TAB_NAMES.every((n) => routeNames.includes(n))) return current;
    last = current;
    current = current.getParent?.();
  }
  return last;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findReturnToInCurrentTab(tabState: any): ReturnTo | undefined {
  const currentTabRoute = tabState?.routes?.[tabState.index];
  if (!currentTabRoute?.state) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (state: any): ReturnTo | undefined => {
    if (!state?.routes) return undefined;
    for (let i = state.routes.length - 1; i >= 0; i--) {
      const route = state.routes[i];
      if (route.params?.returnTo) return route.params.returnTo;
      if (route.state) {
        const nested = walk(route.state);
        if (nested) return nested;
      }
    }
    return undefined;
  };

  return walk(currentTabRoute.state);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function screenExistsInTab(tabNav: any, tabName: string, screenName: string): boolean {
  if (!screenName) return false;
  const state = tabNav.getState();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabRoute = state?.routes?.find((r: any) => r.name === tabName);
  const routeNames: string[] = tabRoute?.state?.routeNames ?? [];
  if (routeNames.length === 0) return true;
  return routeNames.includes(screenName);
}

export function useReturnTo() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  return useCallback(
    (
      tab: string,
      screen: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params?: Record<string, any>,
    ) => {
      const tabNav = findTabNavigator(navigation);
      const tabState = tabNav.getState();
      const currentTabRoute = tabState.routes[tabState.index];
      const nestedIndex = currentTabRoute?.state?.index ?? 0;
      const nestedRoute = currentTabRoute?.state?.routes?.[nestedIndex];
      const isRootOfTab =
        !nestedRoute || nestedRoute.name === currentTabRoute.name;

      const returnTo: ReturnTo = isRootOfTab
        ? { tab: currentTabRoute.name, screen: '', params: undefined }
        : {
            tab: currentTabRoute.name,
            screen: nestedRoute.name,
            params: nestedRoute.params,
          };

      tabNav.navigate(tab, {
        screen,
        params: { ...(params ?? {}), returnTo },
      });
    },
    [navigation],
  );
}

export function useSmartBack() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  return useCallback(() => {
    const tabNav = findTabNavigator(navigation);
    const tabState = tabNav.getState();
    const returnTo = findReturnToInCurrentTab(tabState);

    if (returnTo?.tab) {
      try {
        navigation.popToTop();
      } catch {
        // ignore
      }

      const canUseScreen =
        !!returnTo.screen &&
        screenExistsInTab(tabNav, returnTo.tab, returnTo.screen);

      if (canUseScreen) {
        tabNav.navigate(returnTo.tab, {
          screen: returnTo.screen,
          params: returnTo.params,
        });
      } else {
        tabNav.navigate(returnTo.tab);
      }
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);
}