import { http } from './client';
import type { LealtadInfo, PuntoHistorial, ClienteRanking } from '@tipos/index';

export const lealtadApi = {
  infoCliente: (id: number): Promise<LealtadInfo> =>
    http.get<LealtadInfo>(`/lealtad/cliente/${id}`),

  historial: (id: number): Promise<PuntoHistorial[]> =>
    http.get<PuntoHistorial[]>(`/lealtad/cliente/${id}/historial`),

  ranking: (limit = 50): Promise<ClienteRanking[]> =>
    http.get<ClienteRanking[]>(`/lealtad/ranking?limit=${limit}`),

  canjear: (id: number, puntos: number): Promise<{
    puntos_canjeados: number;
    valor_descuento: number;
    puntos_restantes: number;
  }> => http.post(`/lealtad/cliente/${id}/canjear`, { puntos }),

  ajustar: (id: number, puntos: number, motivo: string): Promise<{ puntos_actuales: number }> =>
    http.post(`/lealtad/cliente/${id}/ajustar`, { puntos, motivo }),
};