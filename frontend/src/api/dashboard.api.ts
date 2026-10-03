// src/api/dashboard.api.ts
import { http } from './client';
import type { ReporteResumen, DashboardAvanzado, DashboardPeriodo } from '@tipos/index';

export const dashboardApi = {
  resumen: (): Promise<ReporteResumen> =>
    http.get<ReporteResumen>('/dashboard/resumen'),

  avanzado: (periodo: DashboardPeriodo = 'mes'): Promise<DashboardAvanzado> =>
    http.get<DashboardAvanzado>(`/dashboard/avanzado?periodo=${periodo}`),
};