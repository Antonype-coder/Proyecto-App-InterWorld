import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { authApi, setUnauthorizedHandler } from '@api/index';
import {
  STORAGE_TOKEN_KEY,
  STORAGE_USER_KEY,
} from '@utils/constants';
import type { Usuario } from '@tipos/index';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  isAdmin: () => boolean;
  updateUser: (user: Usuario) => void;
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

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar errores de red al cerrar sesión
    }
    await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_USER_KEY]);
    set({ user: null, token: null, error: null });
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
          // El interceptor 401 ya limpió el storage
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

// Registrar callback para cierre automático de sesión en 401
setUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, token: null });
});