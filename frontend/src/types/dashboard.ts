// src/types/dashboard.ts
import type { VentaResumen } from './venta';

export type DashboardPeriodo = 'hoy' | 'ayer' | 'semana' | 'mes' | 'anio';

export interface KpiResumen {
  cantidad: number;
  monto: string;
}

export interface KpiCambio {
  porcentaje: number;
  direccion: 'up' | 'down' | 'flat';
  absoluto: string;
}

export interface VentasPeriodo {
  actual: KpiResumen;
  anterior: KpiResumen;
  cambio: KpiCambio;
}

export interface TicketPromedio {
  valor: string;
}

export interface CarteraTotal {
  total: string;
  clientes: number;
}

export interface VentaPorDiaDetalle {
  dia: string;
  total_ventas: number;
  monto_total: string;
}

export interface VentaPorHora {
  hora: number;
  label: string;
  total_ventas: number;
  monto: string;
}

export interface MetodoPagoDist {
  tipo: string;
  label: string;
  cantidad: number;
  monto: string;
}

export interface TopProducto {
  id: number;
  nombre: string;
  codigo_barras: string;
  unidades_vendidas: string;
  monto_total: string;
}

export interface CajaAbierta {
  id: number;
  usuario_id: number;
  monto_apertura: string;
  abierta_at: string;
  total_turno: string;
  efectivo: string;
  tarjeta: string;
  transferencia: string;
}

export interface DashboardAvanzado {
  periodo: {
    nombre: DashboardPeriodo;
    desde: string;
    hasta: string;
  };
  kpis: {
    ventas_hoy: KpiResumen;
    ventas_periodo: VentasPeriodo;
    ticket_promedio: TicketPromedio;
    productos_activos: number;
    alertas_stock: number;
    cartera_total: CarteraTotal;
    clientes_nuevos: number;
  };
  ventas_por_dia: VentaPorDiaDetalle[];
  ventas_por_hora: VentaPorHora[];
  metodos_pago: MetodoPagoDist[];
  top_productos: TopProducto[];
  caja_abierta: CajaAbierta | null;
  ultimas_ventas: VentaResumen[];
  notificaciones_no_leidas?: number;
}