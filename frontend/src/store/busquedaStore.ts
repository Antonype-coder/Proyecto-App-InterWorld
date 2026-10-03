// src/store/busquedaStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { busquedaApi } from '@api/index';
import type { BusquedaResultado } from '@api/busqueda.api';

const HISTORIAL_KEY = '@tiendaadmin:historial_busquedas';

interface BusquedaState {
  resultados: BusquedaResultado | null;
  loading: boolean;
  error: string | null;
  historial: string[];

  buscar: (q: string) => Promise<void>;
  cargarHistorial: () => Promise<void>;
  guardarEnHistorial: (q: string) => Promise<void>;
  limpiarHistorial: () => Promise<void>;
  reset: () => void;
}

export const useBusquedaStore = create<BusquedaState>((set, get) => ({
  resultados: null,
  loading: false,
  error: null,
  historial: [],

  buscar: async (q) => {
    if (q.trim().length < 2) {
      set({ resultados: null, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const res = await busquedaApi.buscar(q);
      set({ resultados: res, loading: false });
      await get().guardarEnHistorial(q.trim());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al buscar';
      set({ loading: false, error: msg });
    }
  },

  cargarHistorial: async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORIAL_KEY);
      if (raw) {
        const historial = JSON.parse(raw) as string[];
        set({ historial: historial.slice(0, 10) });
      }
    } catch {
      // ignorar
    }
  },

  guardarEnHistorial: async (q) => {
    try {
      const actual = get().historial;
      const filtrado = actual.filter((item) => item.toLowerCase() !== q.toLowerCase());
      const nuevo = [q, ...filtrado].slice(0, 10);
      set({ historial: nuevo });
      await AsyncStorage.setItem(HISTORIAL_KEY, JSON.stringify(nuevo));
    } catch {
      // ignorar
    }
  },

  limpiarHistorial: async () => {
    set({ historial: [] });
    await AsyncStorage.removeItem(HISTORIAL_KEY);
  },

  reset: () => set({ resultados: null, loading: false, error: null }),
}));