import { http } from './client';
import type { Producto, ProductoInput, PaginatedResponse } from '@tipos/index';

interface ProductosFiltros {
  busqueda?: string;
  categoria_id?: number;
  activo?: 0 | 1;
  stock_bajo?: 0 | 1;
  limit?: number;
  offset?: number;
}

export const productosApi = {
  listar: (filtros: ProductosFiltros = {}): Promise<PaginatedResponse<Producto>> => {
    const params = new URLSearchParams();
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.categoria_id) params.append('categoria_id', String(filtros.categoria_id));
    if (filtros.activo !== undefined) params.append('activo', String(filtros.activo));
    if (filtros.stock_bajo) params.append('stock_bajo', String(filtros.stock_bajo));
    if (filtros.limit) params.append('limit', String(filtros.limit));
    if (filtros.offset) params.append('offset', String(filtros.offset));
    const qs = params.toString();
    return http.get<PaginatedResponse<Producto>>(`/productos${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: number): Promise<Producto> =>
    http.get<Producto>(`/productos/${id}`),

  buscarPorCodigo: (codigo: string): Promise<Producto> =>
    http.get<Producto>(`/productos/barcode/${encodeURIComponent(codigo)}`),

  stockBajo: (): Promise<Producto[]> =>
    http.get<Producto[]>('/productos/stock-bajo'),

  crear: (data: ProductoInput): Promise<Producto> =>
    http.post<Producto>('/productos', data),

  actualizar: (id: number, data: Partial<ProductoInput>): Promise<Producto> =>
    http.put<Producto>(`/productos/${id}`, data),

  eliminar: (id: number): Promise<null> =>
    http.delete<null>(`/productos/${id}`),
};