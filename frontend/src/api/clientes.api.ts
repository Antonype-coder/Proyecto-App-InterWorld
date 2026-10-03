import { http } from './client';
import type {
  Cliente,
  ClienteInput,
  EstadoCuenta,
  PagoInput,
} from '@tipos/index';

interface ClientesFiltros {
  busqueda?: string;
  activo?: 0 | 1;
}

export const clientesApi = {
  listar: (filtros: ClientesFiltros = {}): Promise<Cliente[]> => {
    const params = new URLSearchParams();
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.activo !== undefined) params.append('activo', String(filtros.activo));
    const qs = params.toString();
    return http.get<Cliente[]>(`/clientes${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: number): Promise<Cliente> =>
    http.get<Cliente>(`/clientes/${id}`),

  crear: (data: ClienteInput): Promise<Cliente> =>
    http.post<Cliente>('/clientes', data),

  actualizar: (id: number, data: Partial<ClienteInput>): Promise<Cliente> =>
    http.put<Cliente>(`/clientes/${id}`, data),

  eliminar: (id: number): Promise<null> =>
    http.delete<null>(`/clientes/${id}`),

  estadoCuenta: (id: number): Promise<EstadoCuenta> =>
    http.get<EstadoCuenta>(`/clientes/${id}/estado-cuenta`),

  registrarPago: (
    id: number,
    data: PagoInput,
  ): Promise<{ pago_id: number; cliente: Cliente }> =>
    http.post<{ pago_id: number; cliente: Cliente }>(
      `/clientes/${id}/pagos`,
      data,
    ),
};