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

/**
 * ¿El usuario está saliendo de su tab actual (cruzando tabs)?
 * Devuelve el tab destino o null si es la misma tab.
 */
function getReturnToIfCrossTab(
  currentTabName: string,
  targetTabName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nestedRoute: any,
): ReturnTo | null {
  // Si vamos a la MISMA tab, no hay returnTo que valga.
  if (currentTabName === targetTabName) return null;

  const isRootOfTab = !nestedRoute || nestedRoute.name === currentTabName;

  if (isRootOfTab) {
    return { tab: currentTabName, screen: '', params: undefined };
  }

  return {
    tab: currentTabName,
    screen: nestedRoute.name,
    params: nestedRoute.params,
  };
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

      // Solo guardamos returnTo cuando cruzamos tabs.
      // Si estamos en la misma tab, no hace falta: el back normal funciona.
      const returnTo = getReturnToIfCrossTab(
        currentTabRoute.name,
        tab,
        nestedRoute,
      );

      if (returnTo === null) {
        // Misma tab: navegar sin returnTo.
        tabNav.navigate(tab, { screen, params });
        return;
      }

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

    const currentTabRoute = tabState?.routes?.[tabState.index];
    const nestedIndex = currentTabRoute?.state?.index ?? 0;
    const hasNestedHistory = nestedIndex > 0;

    // 🔥 REGLA DE ORO:
    // Si hay historial DENTRO de la tab actual, usa goBack().
    // Solo usa returnTo cuando estamos en la raíz de la tab.
    if (hasNestedHistory && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // Estamos en la raíz de la tab → revisar returnTo para volver a la tab origen.
    const returnTo = findReturnToInCurrentTab(tabState);

    if (returnTo?.tab) {
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

    // Sin returnTo: intentar goBack normal.
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);
}