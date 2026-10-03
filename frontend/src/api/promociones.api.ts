import { http } from './client';
import type { Promocion, PromocionInput } from '@tipos/index';

interface Filtros {
  activo?: 0 | 1;
  vigentes?: boolean;
}

export const promocionesApi = {
  listar: (filtros: Filtros = {}): Promise<Promocion[]> => {
    const params = new URLSearchParams();
    if (filtros.activo !== undefined) params.append('activo', String(filtros.activo));
    if (filtros.vigentes) params.append('vigentes', '1');
    const qs = params.toString();
    return http.get<Promocion[]>(`/promociones${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: number): Promise<Promocion> =>
    http.get<Promocion>(`/promociones/${id}`),

  crear: (data: PromocionInput): Promise<Promocion> =>
    http.post<Promocion>('/promociones', data),

  actualizar: (id: number, data: Partial<PromocionInput>): Promise<Promocion> =>
    http.put<Promocion>(`/promociones/${id}`, data),

  eliminar: (id: number): Promise<null> =>
    http.delete<null>(`/promociones/${id}`),

  vigentesParaProducto: (productoId: number, categoriaId = 0): Promise<Promocion[]> =>
    http.get<Promocion[]>(
      `/promociones/vigentes?producto_id=${productoId}&categoria_id=${categoriaId}`,
    ),
};