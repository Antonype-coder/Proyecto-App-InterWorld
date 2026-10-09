import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

import { authApi, setUnauthorizedHandler } from '@api/index';
import {
  STORAGE_TOKEN_KEY,
  STORAGE_USER_KEY,
  STORAGE_ONBOARDING_KEY,
} from '@utils/constants';
import { useProductosStore } from '@store/productosStore';
import { useClientesStore } from '@store/clientesStore';
import { useCarritoStore } from '@store/carritoStore';
import type { RegisterNegocioRequest, Usuario } from '@tipos/index';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  registrarNegocio: (data: RegisterNegocioRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  isAdmin: () => boolean;
  updateUser: (user: Usuario) => void;
}

async function resetAllDataStores(): Promise<void> {
  try {
    // Productos
    useProductosStore.setState({
      productos: [],
      categorias: [],
      total: 0,
      error: null,
      loading: false,
    });

    // Clientes
    useClientesStore.setState({
      clientes: [],
      loading: false,
      error: null,
    });

    // Carrito
    useCarritoStore.getState().limpiar();
  } catch {
    // Ignorar
  }

  // Limpiar caché de AsyncStorage
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tenantKeys = allKeys.filter(
      (k) =>
        k.startsWith('@tiendaadmin:') ||
        k.startsWith('@interworld:productos') ||
        k.startsWith('@interworld:clientes'),
    );
    if (tenantKeys.length > 0) {
      await AsyncStorage.multiRemove(tenantKeys);
    }
  } catch {
    // Ignorar
  }
}

async function reloadApp(): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch {
    // Ignorar en dev
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.login({ email, password });

      const prevId = get().user?.id ?? null;
      const nextId = res.user?.id ?? null;
      if (prevId !== nextId) {
        await resetAllDataStores();
      }

      await AsyncStorage.multiSet([
        [STORAGE_TOKEN_KEY, res.token],
        [STORAGE_USER_KEY, JSON.stringify(res.user)],
      ]);

      let usuarioCompleto: Usuario;
      try {
        usuarioCompleto = await authApi.me();
      } catch {
        usuarioCompleto = { ...res.user, activo: 1 };
      }

      set({
        user: usuarioCompleto,
        token: res.token,
        loading: false,
        initialized: true,
      });
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'Error al iniciar sesión';
      set({ loading: false, error: mensaje });
      throw e;
    }
  },

  registrarNegocio: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.registrarNegocio(data);

      await resetAllDataStores();

      await AsyncStorage.multiSet([
        [STORAGE_TOKEN_KEY, res.token],
        [STORAGE_USER_KEY, JSON.stringify(res.user)],
        [STORAGE_ONBOARDING_KEY, '1'],
      ]);

      let usuarioCompleto: Usuario;
      try {
        usuarioCompleto = await authApi.me();
      } catch {
        usuarioCompleto = { ...res.user, activo: 1 };
      }

      set({
        user: usuarioCompleto,
        token: res.token,
        loading: false,
        initialized: true,
      });
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'Error al crear la cuenta';
      set({ loading: false, error: mensaje });
      throw e;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar
    }

    await resetAllDataStores();

    await AsyncStorage.multiRemove([
      STORAGE_TOKEN_KEY,
      STORAGE_USER_KEY,
      STORAGE_ONBOARDING_KEY,
    ]);

    set({ user: null, token: null, error: null });

    await reloadApp();
  },

  loadFromStorage: async () => {
    try {
      const [[, token], [, userJson]] = await AsyncStorage.multiGet([
        STORAGE_TOKEN_KEY,
        STORAGE_USER_KEY,
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as Usuario;
        set({ token, user, initialized: true });

        try {
          const refreshed = await authApi.me();
          set({ user: refreshed });
          await AsyncStorage.setItem(
            STORAGE_USER_KEY,
            JSON.stringify(refreshed),
          );
        } catch {
          // Ignorar
        }
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  isAdmin: () => get().user?.rol === 'admin',

  updateUser: (user) => {
    set({ user });
    AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  },
}));

setUnauthorizedHandler(async () => {
  await resetAllDataStores();
  useAuthStore.setState({ user: null, token: null });
  await reloadApp();
});