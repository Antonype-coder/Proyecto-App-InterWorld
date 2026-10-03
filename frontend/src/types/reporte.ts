import type { VentaResumen } from './venta';

export interface ReporteResumen {
  ventas_hoy: {
    cantidad: number;
    monto: string;
  };
  productos_activos: number;
  alertas_stock: number;
  cartera_total: string;
  ultimas_ventas: VentaResumen[];
  notificaciones_no_leidas?: number;
}

export interface VentaPorDia {
  dia: string;
  total_ventas: number;
  monto_total: string;
}

export interface ProductoMasVendido {
  id: number;
  nombre: string;
  codigo_barras: string;
  unidades_vendidas: string;
  monto_total: string;
}

export interface CarteraItem {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  cupo_credito: string;
  saldo_deuda: string;
  cupo_disponible: string;
}

export interface ReporteCartera {
  total_cartera: string;
  clientes: CarteraItem[];
}

export interface ProductoStockBajo {
  id: number;
  codigo_barras: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  categoria_nombre: string | null;
}