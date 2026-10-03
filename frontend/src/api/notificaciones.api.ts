import { http } from './client';
import type { NotificacionesResponse } from '@tipos/index';

export const notificacionesApi = {
  listar: (): Promise<NotificacionesResponse> =>
    http.get<NotificacionesResponse>('/notificaciones'),

  marcarLeida: (id: number): Promise<null> =>
    http.patch<null>(`/notificaciones/${id}/leida`),

  marcarTodas: (): Promise<null> =>
    http.post<null>('/notificaciones/marcar-todas'),
};