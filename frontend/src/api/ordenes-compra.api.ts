import { http } from './client';
import type {
  OrdenCompra,
  OrdenCompraResumen,
  OrdenCompraInput,
  EstadoOC,
  RecepcionItem,
} from '@tipos/index';

interface Filtros {
  estado?: EstadoOC;
  proveedor_id?: number;
  limit?: number;
  offset?: number;
}

export const ordenesCompraApi = {
  listar: (filtros: Filtros = {}): Promise<OrdenCompraResumen[]> => {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.proveedor_id) params.append('proveedor_id', String(filtros.proveedor_id));
    if (filtros.limit) params.append('limit', String(filtros.limit));
    if (filtros.offset) params.append('offset', String(filtros.offset));
    const qs = params.toString();
    return http.get<OrdenCompraResumen[]>(`/ordenes-compra${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: number): Promise<OrdenCompra> =>
    http.get<OrdenCompra>(`/ordenes-compra/${id}`),

  crear: (data: OrdenCompraInput): Promise<OrdenCompra> =>
    http.post<OrdenCompra>('/ordenes-compra', data),

  cambiarEstado: (id: number, estado: EstadoOC): Promise<OrdenCompra> =>
    http.post<OrdenCompra>(`/ordenes-compra/${id}/estado`, { estado }),

  recibir: (id: number, recepciones: RecepcionItem[]): Promise<OrdenCompra> =>
    http.post<OrdenCompra>(`/ordenes-compra/${id}/recibir`, { recepciones }),
};