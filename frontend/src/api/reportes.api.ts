import { http } from './client';
import type {
  ReporteResumen,
  VentaPorDia,
  ProductoMasVendido,
  ReporteCartera,
  ProductoStockBajo,
} from '@tipos/index';

export const reportesApi = {
  resumen: (): Promise<ReporteResumen> =>
    http.get<ReporteResumen>('/reportes/resumen'),

  ventasPorDia: (desde?: string, hasta?: string): Promise<VentaPorDia[]> => {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const qs = params.toString();
    return http.get<VentaPorDia[]>(`/reportes/ventas-por-dia${qs ? `?${qs}` : ''}`);
  },

  productosMasVendidos: (limit = 10): Promise<ProductoMasVendido[]> =>
    http.get<ProductoMasVendido[]>(
      `/reportes/productos-mas-vendidos?limit=${limit}`,
    ),

  stockBajo: (): Promise<ProductoStockBajo[]> =>
    http.get<ProductoStockBajo[]>('/reportes/stock-bajo'),

  cartera: (): Promise<ReporteCartera> =>
    http.get<ReporteCartera>('/reportes/cartera'),
};