import { http } from './client';
import type {
  Venta,
  VentaInput,
  VentaResumen,
  PaginatedResponse,
  EstadoVenta,
  TipoPago,
} from '@tipos/index';

interface VentasFiltros {
  estado?: EstadoVenta;
  tipo_pago?: TipoPago;
  cliente_id?: number;
  desde?: string;
  hasta?: string;
  busqueda?: string;
  limit?: number;
  offset?: number;
}

export const ventasApi = {
  listar: (filtros: VentasFiltros = {}): Promise<PaginatedResponse<VentaResumen>> => {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.tipo_pago) params.append('tipo_pago', filtros.tipo_pago);
    if (filtros.cliente_id) params.append('cliente_id', String(filtros.cliente_id));
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.limit) params.append('limit', String(filtros.limit));
    if (filtros.offset) params.append('offset', String(filtros.offset));
    const qs = params.toString();
    return http.get<PaginatedResponse<VentaResumen>>(
      `/ventas${qs ? `?${qs}` : ''}`,
    );
  },

  obtener: (id: number): Promise<Venta> =>
    http.get<Venta>(`/ventas/${id}`),

  crear: (data: VentaInput): Promise<Venta> =>
    http.post<Venta>('/ventas', data),

  anular: (id: number, motivo: string): Promise<Venta> =>
    http.post<Venta>(`/ventas/${id}/anular`, { motivo }),
};