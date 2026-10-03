import { create } from 'zustand';
import type { ToastVariant } from '@tipos/index';

interface ToastData {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

interface UIState {
  themeMode: 'light' | 'dark';
  toast: ToastData;

  setThemeMode: (mode: 'light' | 'dark') => void;
  showToast: (message: string, variant?: ToastVariant) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: 'light',
  toast: { visible: false, message: '', variant: 'info' },

  setThemeMode: (mode) => set({ themeMode: mode }),

  showToast: (message, variant = 'info') =>
    set({ toast: { visible: true, message, variant } }),

  hideToast: () =>
    set((state) => ({ toast: { ...state.toast, visible: false } })),
}));