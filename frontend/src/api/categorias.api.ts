import { http } from './client';
import type { Categoria, CategoriaInput } from '@tipos/index';

export const categoriasApi = {
  listar: (activo?: 0 | 1): Promise<Categoria[]> => {
    const qs = activo !== undefined ? `?activo=${activo}` : '';
    return http.get<Categoria[]>(`/categorias${qs}`);
  },

  obtener: (id: number): Promise<Categoria> =>
    http.get<Categoria>(`/categorias/${id}`),

  crear: (data: CategoriaInput): Promise<Categoria> =>
    http.post<Categoria>('/categorias', data),

  actualizar: (id: number, data: Partial<CategoriaInput>): Promise<Categoria> =>
    http.put<Categoria>(`/categorias/${id}`, data),

  eliminar: (id: number): Promise<null> =>
    http.delete<null>(`/categorias/${id}`),
};