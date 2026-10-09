import { http } from './client';
import type { Producto, ProductoInput } from '@tipos/index';

export interface ProductoEstadisticas {
  unidades_vendidas: number;
  transacciones: number;
  bruto: number;
  descuento: number;
  neto: number;
  costo_total: number;
  ganancia_real: number;
  ganancia_sin_promo: number;
  perdido_por_promo: number;
  margen_pct: number;
  precio_promedio_real: number;
  pierde_con_promo: boolean;
  primera_venta: string | null;
  ultima_venta: string | null;
}

export interface EliminarPermanenteResponse {
  accion: 'eliminado' | 'desactivado';
  id?: number;
}

export const productosApi = {
  listar: (params: {
    busqueda?: string;
    categoria_id?: number;
    activo?: 0 | 1;
    stock_bajo?: boolean;
    limit?: number;
    offset?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.busqueda) qs.append('busqueda', params.busqueda);
    if (params.categoria_id)
      qs.append('categoria_id', String(params.categoria_id));
    if (params.activo !== undefined) qs.append('activo', String(params.activo));
    if (params.stock_bajo) qs.append('stock_bajo', '1');
    if (params.limit !== undefined) qs.append('limit', String(params.limit));
    if (params.offset !== undefined) qs.append('offset', String(params.offset));

    const query = qs.toString();
    return http.get<{
      items: Producto[];
      total: number;
      limit: number;
      offset: number;
    }>(`/productos${query ? `?${query}` : ''}`);
  },

  obtener: (id: number): Promise<Producto> =>
    http.get<Producto>(`/productos/${id}`),

  buscarPorCodigo: (codigo: string): Promise<Producto> =>
    http.get<Producto>(`/productos/barcode/${encodeURIComponent(codigo)}`),

  crear: (data: ProductoInput): Promise<Producto> =>
    http.post<Producto>('/productos', data),

  actualizar: (id: number, data: Partial<ProductoInput>): Promise<Producto> =>
    http.put<Producto>(`/productos/${id}`, data),

  eliminar: (id: number): Promise<null> =>
    http.delete<null>(`/productos/${id}`),

  eliminarPermanente: (id: number): Promise<EliminarPermanenteResponse> =>
    http.delete<EliminarPermanenteResponse>(`/productos/${id}/permanente`),

  stockBajo: (): Promise<Producto[]> =>
    http.get<Producto[]>('/productos/stock-bajo'),

  estadisticas: (id: number): Promise<ProductoEstadisticas> =>
    http.get<ProductoEstadisticas>(`/productos/${id}/estadisticas`),
};