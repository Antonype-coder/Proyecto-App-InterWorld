import { http } from './client';
import type { AuditoriaLog } from '@tipos/index';

interface AuditoriaFiltros {
  usuario_id?: number;
  entidad?: string;
  accion?: string;
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
}

export const auditoriaApi = {
  listar: (filtros: AuditoriaFiltros = {}): Promise<AuditoriaLog[]> => {
    const params = new URLSearchParams();
    if (filtros.usuario_id) params.append('usuario_id', String(filtros.usuario_id));
    if (filtros.entidad) params.append('entidad', filtros.entidad);
    if (filtros.accion) params.append('accion', filtros.accion);
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.limit) params.append('limit', String(filtros.limit));
    if (filtros.offset) params.append('offset', String(filtros.offset));
    const qs = params.toString();
    return http.get<AuditoriaLog[]>(`/auditoria${qs ? `?${qs}` : ''}`);
  },
};