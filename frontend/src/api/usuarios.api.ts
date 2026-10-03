import { http } from './client';
import type { Usuario, UsuarioInput } from '@tipos/index';

interface UsuariosFiltros {
  activo?: 0 | 1;
  rol?: 'admin' | 'vendedor';
}

export const usuariosApi = {
  listar: (filtros: UsuariosFiltros = {}): Promise<Usuario[]> => {
    const params = new URLSearchParams();
    if (filtros.activo !== undefined) params.append('activo', String(filtros.activo));
    if (filtros.rol) params.append('rol', filtros.rol);
    const qs = params.toString();
    return http.get<Usuario[]>(`/usuarios${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: number): Promise<Usuario> =>
    http.get<Usuario>(`/usuarios/${id}`),

  crear: (data: UsuarioInput): Promise<Usuario> =>
    http.post<Usuario>('/usuarios', data),

  actualizar: (id: number, data: Partial<UsuarioInput>): Promise<Usuario> =>
    http.put<Usuario>(`/usuarios/${id}`, data),

  eliminar: (id: number): Promise<null> =>
    http.delete<null>(`/usuarios/${id}`),
};