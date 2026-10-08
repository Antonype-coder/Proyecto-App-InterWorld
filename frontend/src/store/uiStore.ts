import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ToastVariant } from '@tipos/index';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ToastData {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

interface UIState {
  themeMode: ThemePreference;
  hydrated: boolean;
  toast: ToastData;
  paletteOpen: boolean;

  setThemeMode: (mode: ThemePreference) => void;
  hydrate: () => Promise<void>;
  showToast: (message: string, variant?: ToastVariant) => void;
  hideToast: () => void;
  openPalette: () => void;
  closePalette: () => void;
}

const THEME_STORAGE_KEY = '@interworld:theme-mode';

export const useUIStore = create<UIState>((set) => ({
  themeMode: 'system',
  hydrated: false,
  toast: { visible: false, message: '', variant: 'info' },
  paletteOpen: false,

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    void AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ themeMode: stored });
      }
    } finally {
      set({ hydrated: true });
    }
  },

  showToast: (message, variant = 'info') =>
    set({ toast: { visible: true, message, variant } }),

  hideToast: () =>
    set((state) => ({ toast: { ...state.toast, visible: false } })),

  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
}));