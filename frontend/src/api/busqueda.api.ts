import { http } from './client';

export interface BusquedaResultado {
  productos: Array<{
    id: number;
    codigo_barras: string;
    nombre: string;
    precio_venta: string;
    stock: number;
    imagen: string | null;
  }>;
  clientes: Array<{
    id: number;
    nombre: string;
    documento: string | null;
    telefono: string | null;
    saldo_deuda: string;
    cupo_credito: string;
  }>;
  ventas: Array<{
    id: number;
    numero: string;
    total: string;
    estado: string;
    tipo_pago: string;
    created_at: string;
    cliente_nombre: string | null;
  }>;
  proveedores: Array<{
    id: number;
    nombre: string;
    contacto: string | null;
    telefono: string | null;
  }>;
}

export const busquedaApi = {
  buscar: (q: string): Promise<BusquedaResultado> =>
    http.get<BusquedaResultado>(`/buscar?q=${encodeURIComponent(q)}`),
};