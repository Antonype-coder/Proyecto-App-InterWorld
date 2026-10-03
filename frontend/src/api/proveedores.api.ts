import { http } from './client';
import type { Proveedor, ProveedorInput } from '@tipos/index';

export const proveedoresApi = {
  listar: (activo?: 0 | 1): Promise<Proveedor[]> => {
    const qs = activo !== undefined ? `?activo=${activo}` : '';
    return http.get<Proveedor[]>(`/proveedores${qs}`);
  },

  obtener: (id: number): Promise<Proveedor> =>
    http.get<Proveedor>(`/proveedores/${id}`),

  crear: (data: ProveedorInput): Promise<Proveedor> =>
    http.post<Proveedor>('/proveedores', data),

  actualizar: (id: number, data: Partial<ProveedorInput>): Promise<Proveedor> =>
    http.put<Proveedor>(`/proveedores/${id}`, data),

  eliminar: (id: number): Promise<null> =>
    http.delete<null>(`/proveedores/${id}`),
};