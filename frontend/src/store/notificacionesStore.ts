import { create } from 'zustand';
import { notificacionesApi } from '@api/index';
import type { Notificacion } from '@tipos/index';

interface NotificacionesState {
  items: Notificacion[];
  noLeidas: number;
  loading: boolean;

  cargar: () => Promise<void>;
  marcarLeida: (id: number) => Promise<void>;
  marcarTodas: () => Promise<void>;
  decrementarNoLeidas: () => void;
  reset: () => void;
}

export const useNotificacionesStore = create<NotificacionesState>((set, get) => ({
  items: [],
  noLeidas: 0,
  loading: false,

  cargar: async () => {
    set({ loading: true });
    try {
      const res = await notificacionesApi.listar();
      set({
        items: res.items,
        noLeidas: res.no_leidas,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  marcarLeida: async (id) => {
    await notificacionesApi.marcarLeida(id);
    set((state) => {
      const items = state.items.map((n) =>
        n.id === id ? { ...n, leida: 1 } : n,
      );
      const noLeidas = items.filter((n) => n.leida === 0).length;
      return { items, noLeidas };
    });
  },

  marcarTodas: async () => {
    await notificacionesApi.marcarTodas();
    set((state) => ({
      items: state.items.map((n) => ({ ...n, leida: 1 })),
      noLeidas: 0,
    }));
  },

  decrementarNoLeidas: () =>
    set((state) => ({ noLeidas: Math.max(0, state.noLeidas - 1) })),

  reset: () => set({ items: [], noLeidas: 0 }),
}));