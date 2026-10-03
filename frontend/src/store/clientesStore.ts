import { create } from 'zustand';
import { clientesApi } from '@api/index';
import type { Cliente } from '@tipos/index';

interface ClientesState {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;

  cargar: (opts?: { busqueda?: string; activo?: 0 | 1 }) => Promise<void>;
  buscarPorId: (id: number) => Cliente | undefined;
}

export const useClientesStore = create<ClientesState>((set, get) => ({
  clientes: [],
  loading: false,
  error: null,

  cargar: async (opts = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await clientesApi.listar({
        busqueda: opts.busqueda,
        activo: opts.activo ?? 1,
      });
      set({ clientes: data, loading: false });
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'Error al cargar clientes';
      set({ loading: false, error: mensaje });
      throw e;
    }
  },

  buscarPorId: (id) => get().clientes.find((c) => c.id === id),
}));