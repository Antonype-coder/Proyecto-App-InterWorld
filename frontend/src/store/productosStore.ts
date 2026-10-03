import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productosApi, categoriasApi } from '@api/index';
import type { Producto, Categoria } from '@tipos/index';
import { useAuthStore } from '@store/authStore';

const PRODUCTOS_CACHE_KEY = '@tiendaadmin:productos-cache:v1';

function cacheKey(): string {
  return `${PRODUCTOS_CACHE_KEY}:${useAuthStore.getState().user?.id ?? 'anonymous'}`;
}

function filtrarCache(
  productos: Producto[],
  opts: { busqueda?: string; categoria_id?: number; activo?: 0 | 1; stock_bajo?: 0 | 1; limit?: number; offset?: number },
): Producto[] {
  const query = opts.busqueda?.trim().toLocaleLowerCase();
  const filtered = productos.filter((producto) => {
    if (producto.activo !== (opts.activo ?? 1)) return false;
    if (opts.categoria_id && producto.categoria_id !== opts.categoria_id) return false;
    if (opts.stock_bajo && producto.stock > producto.stock_minimo) return false;
    if (
      query &&
      !producto.nombre.toLocaleLowerCase().includes(query) &&
      !producto.codigo_barras.toLocaleLowerCase().includes(query)
    ) return false;
    return true;
  });
  const offset = opts.offset ?? 0;
  return filtered.slice(offset, offset + (opts.limit ?? 200));
}

interface ProductosState {
  productos: Producto[];
  categorias: Categoria[];
  loading: boolean;
  error: string | null;
  total: number;

  cargar: (opts?: {
    busqueda?: string;
    categoria_id?: number;
    activo?: 0 | 1;
    limit?: number;
    offset?: number;
  }) => Promise<void>;

  cargarCategorias: () => Promise<void>;
  refrescar: () => Promise<void>;
  buscarPorCodigo: (codigo: string) => Promise<Producto | null>;
  reset: () => void;
}

export const useProductosStore = create<ProductosState>((set, get) => ({
  productos: [],
  categorias: [],
  loading: false,
  error: null,
  total: 0,

  cargar: async (opts = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await productosApi.listar({
        busqueda: opts.busqueda,
        categoria_id: opts.categoria_id,
        activo: opts.activo ?? 1,
        limit: opts.limit ?? 200,
        offset: opts.offset ?? 0,
      });
      set({
        productos: res.items,
        total: res.total,
        loading: false,
      });

      try {
        const key = cacheKey();
        const stored = await AsyncStorage.getItem(key);
        let cached: Producto[] = [];
        try {
          cached = stored ? JSON.parse(stored) as Producto[] : [];
        } catch {
          cached = [];
        }
        const productsById = new Map(cached.map((product) => [product.id, product]));
        for (const product of res.items) productsById.set(product.id, product);
        await AsyncStorage.setItem(key, JSON.stringify([...productsById.values()]));
      } catch {
        // A cache write failure must not hide a successful API response.
      }
    } catch (e) {
      try {
        const stored = await AsyncStorage.getItem(cacheKey());
        if (stored) {
          const cached = JSON.parse(stored) as Producto[];
          const products = filtrarCache(cached, opts);
          if (products.length > 0) {
            set({ productos: products, total: products.length, loading: false, error: null });
            return;
          }
        }
      } catch {
        // Use the API error when the cache is unavailable or invalid.
      }

      const mensaje =
        e instanceof Error ? e.message : 'Error al cargar productos';
      set({ loading: false, error: mensaje });
      throw e;
    }
  },

  cargarCategorias: async () => {
    try {
      const categorias = await categoriasApi.listar(1);
      set({ categorias });
    } catch {
      // Silencioso
    }
  },

  refrescar: async () => {
    await get().cargar();
  },

  buscarPorCodigo: async (codigo) => {
    try {
      return await productosApi.buscarPorCodigo(codigo);
    } catch {
      return null;
    }
  },

  reset: () => set({ productos: [], categorias: [], total: 0, error: null }),
}));