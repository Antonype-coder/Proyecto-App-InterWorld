import { create } from 'zustand';
import { configuracionApi } from '@api/index';
import type { ConfiguracionData } from '@tipos/index';

interface ConfiguracionState {
  data: ConfiguracionData | null;
  loading: boolean;
  error: string | null;

  cargar: () => Promise<void>;
  actualizar: (values: Record<string, unknown>) => Promise<void>;
  actualizarLogo: (logoUrl: string) => Promise<void>;
  eliminarLogo: () => Promise<void>;
  get: <T = unknown>(grupo: string, clave: string, fallback?: T) => T | undefined;
}

export const useConfiguracionStore = create<ConfiguracionState>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  cargar: async () => {
    set({ loading: true, error: null });
    try {
      const data = await configuracionApi.obtener();
      set({ data, loading: false });
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'Error al cargar configuración';
      set({ loading: false, error: mensaje });
    }
  },

  actualizar: async (values) => {
    const data = await configuracionApi.actualizar(values);
    set({ data });
  },

  actualizarLogo: async (logoUrl) => {
    const data = await configuracionApi.actualizarLogo(logoUrl);
    set({ data });
  },

  eliminarLogo: async () => {
    const data = await configuracionApi.eliminarLogo();
    set({ data });
  },

  get: (grupo, clave, fallback) => {
    const data = get().data;
    if (!data) return fallback;
    return (data[grupo]?.[clave] as never) ?? fallback;
  },
}));