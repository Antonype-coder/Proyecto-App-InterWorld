import { http } from './client';
import type { Devolucion, DevolucionResumen, DevolucionInput } from '@tipos/index';

interface Filtros {
  estado?: 'completada' | 'anulada';
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
}

export const devolucionesApi = {
  listar: (filtros: Filtros = {}): Promise<DevolucionResumen[]> => {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.limit) params.append('limit', String(filtros.limit));
    if (filtros.offset) params.append('offset', String(filtros.offset));
    const qs = params.toString();
    return http.get<DevolucionResumen[]>(`/devoluciones${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: number): Promise<Devolucion> =>
    http.get<Devolucion>(`/devoluciones/${id}`),

  crear: (data: DevolucionInput): Promise<Devolucion> =>
    http.post<Devolucion>('/devoluciones', data),
};