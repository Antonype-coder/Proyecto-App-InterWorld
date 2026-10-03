import { http } from './client';
import type { ConfiguracionData } from '@tipos/index';

export const configuracionApi = {
  obtener: (): Promise<ConfiguracionData> =>
    http.get<ConfiguracionData>('/configuracion'),

  actualizar: (data: Record<string, unknown>): Promise<ConfiguracionData> =>
    http.put<ConfiguracionData>('/configuracion', data),

  actualizarLogo: (logoUrl: string): Promise<ConfiguracionData> =>
    http.put<ConfiguracionData>('/configuracion/logo', { logo_url: logoUrl }),

  eliminarLogo: (): Promise<ConfiguracionData> =>
    http.delete<ConfiguracionData>('/configuracion/logo'),
};