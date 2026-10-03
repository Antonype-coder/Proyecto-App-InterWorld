import { http } from './client';
import type {
  CajaSesion,
  CajaMovimiento,
  AbrirCajaInput,
  CerrarCajaInput,
  MovimientoCajaInput,
} from '@tipos/index';

export const cajaApi = {
  estado: (): Promise<CajaSesion | null> =>
    http.get<CajaSesion | null>('/caja/estado'),

  abrir: (data: AbrirCajaInput): Promise<CajaSesion> =>
    http.post<CajaSesion>('/caja/abrir', data),

  cerrar: (id: number, data: CerrarCajaInput): Promise<CajaSesion> =>
    http.post<CajaSesion>(`/caja/${id}/cerrar`, data),

  registrarMovimiento: (
    id: number,
    data: MovimientoCajaInput,
  ): Promise<CajaMovimiento> =>
    http.post<CajaMovimiento>(`/caja/${id}/movimientos`, data),

  movimientos: (id: number): Promise<CajaMovimiento[]> =>
    http.get<CajaMovimiento[]>(`/caja/${id}/movimientos`),

  historial: (): Promise<CajaSesion[]> =>
    http.get<CajaSesion[]>('/caja/historial'),
};