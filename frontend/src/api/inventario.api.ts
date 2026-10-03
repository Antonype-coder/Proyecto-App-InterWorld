import { http } from './client';
import type {
  MovimientoInventario,
  MovimientoInput,
  TipoMovimiento,
} from '@tipos/index';

interface MovimientosFiltros {
  producto_id?: number;
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
  limit?: number;
  offset?: number;
}

export const inventarioApi = {
  registrarMovimiento: (
    data: MovimientoInput,
  ): Promise<{
    movimiento: MovimientoInventario;
    stock_anterior: number;
    stock_nuevo: number;
  }> => http.post('/inventario/movimientos', data),

  listarMovimientos: (
    filtros: MovimientosFiltros = {},
  ): Promise<MovimientoInventario[]> => {
    const params = new URLSearchParams();
    if (filtros.producto_id) params.append('producto_id', String(filtros.producto_id));
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.limit) params.append('limit', String(filtros.limit));
    if (filtros.offset) params.append('offset', String(filtros.offset));
    const qs = params.toString();
    return http.get<MovimientoInventario[]>(
      `/inventario/movimientos${qs ? `?${qs}` : ''}`,
    );
  },
};