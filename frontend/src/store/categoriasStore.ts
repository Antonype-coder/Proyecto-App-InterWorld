import { create } from 'zustand';
import { categoriasApi } from '@api/index';
import type { Categoria } from '@tipos/index';

interface CategoriasState {
  items: Categoria[];
  loading: boolean;
  error: string | null;

  cargar: (activo?: 0 | 1) => Promise<void>;
  reset: () => void;
}

export const useCategoriasStore = create<CategoriasState>((set) => ({
  items: [],
  loading: false,
  error: null,

  cargar: async (activo) => {
    set({ loading: true, error: null });
    try {
      const data = await categoriasApi.listar(activo);
      set({ items: data, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar categorías';
      set({ loading: false, error: msg });
      throw e;
    }
  },

  reset: () => set({ items: [], loading: false, error: null }),
}));