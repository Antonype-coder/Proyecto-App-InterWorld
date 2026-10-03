import { create } from 'zustand';
import type { CarritoItem, Producto, TipoPago } from '@tipos/index';

interface CarritoState {
  items: CarritoItem[];
  tipoPago: TipoPago;
  clienteId: number | null;
  descuento: number;

  agregar: (producto: Producto, cantidad?: number) => void;
  quitar: (productoId: number) => void;
  setCantidad: (productoId: number, cantidad: number) => void;
  limpiar: () => void;
  setTipoPago: (tipo: TipoPago) => void;
  setClienteId: (id: number | null) => void;
  setDescuento: (valor: number) => void;

  subtotal: () => number;
  total: () => number;
  cantidadTotal: () => number;
}

export const useCarritoStore = create<CarritoState>((set, get) => ({
  items: [],
  tipoPago: 'contado',
  clienteId: null,
  descuento: 0,

  agregar: (producto, cantidad = 1) => {
    set((state) => {
      const existente = state.items.find(
        (i) => i.producto.id === producto.id,
      );

      if (existente) {
        const nuevaCantidad = Math.min(
          existente.cantidad + cantidad,
          producto.stock,
        );
        return {
          items: state.items.map((i) =>
            i.producto.id === producto.id
              ? { ...i, cantidad: nuevaCantidad }
              : i,
          ),
        };
      }

      if (producto.stock <= 0) return state;

      return {
        items: [
          ...state.items,
          { producto, cantidad: Math.min(cantidad, producto.stock) },
        ],
      };
    });
  },

  quitar: (productoId) => {
    set((state) => ({
      items: state.items.filter((i) => i.producto.id !== productoId),
    }));
  },

  setCantidad: (productoId, cantidad) => {
    set((state) => {
      if (cantidad <= 0) {
        return {
          items: state.items.filter((i) => i.producto.id !== productoId),
        };
      }

      return {
        items: state.items.map((i) => {
          if (i.producto.id !== productoId) return i;
          const nuevaCantidad = Math.min(cantidad, i.producto.stock);
          return { ...i, cantidad: nuevaCantidad };
        }),
      };
    });
  },

  limpiar: () =>
    set({
      items: [],
      tipoPago: 'contado',
      clienteId: null,
      descuento: 0,
    }),

  setTipoPago: (tipo) =>
    set((state) => ({
      tipoPago: tipo,
      clienteId: tipo === 'contado' ? null : state.clienteId,
    })),

  setClienteId: (id) => set({ clienteId: id }),

  setDescuento: (valor) => set({ descuento: Math.max(0, valor) }),

  subtotal: () =>
    get().items.reduce(
      (sum, item) => sum + parseFloat(item.producto.precio_venta) * item.cantidad,
      0,
    ),

  total: () => {
    const subtotal = get().subtotal();
    const descuento = get().descuento;
    return Math.max(0, subtotal - descuento);
  },

  cantidadTotal: () =>
    get().items.reduce((sum, item) => sum + item.cantidad, 0),
}));