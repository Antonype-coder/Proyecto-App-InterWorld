export interface CajaSesion {
  id: number;
  usuario_id: number;
  monto_apertura: string;
  monto_cierre_declarado: string | null;
  monto_cierre_sistema: string | null;
  diferencia: string | null;
  total_ventas_efectivo: string;
  total_ventas_tarjeta: string;
  total_ventas_transferencia: string;
  total_ingresos: string;
  total_egresos: string;
  estado: 'abierta' | 'cerrada';
  notas_apertura: string | null;
  notas_cierre: string | null;
  abierta_at: string;
  cerrada_at: string | null;
}

export interface CajaMovimiento {
  id: number;
  caja_sesion_id: number;
  usuario_id: number;
  tipo: 'ingreso' | 'egreso' | 'venta' | 'devolucion' | 'ajuste';
  monto: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  referencia_tipo: string | null;
  referencia_id: number | null;
  descripcion: string | null;
  created_at: string;
}

export interface AbrirCajaInput {
  monto_apertura: number;
  notas_apertura?: string;
}

export interface CerrarCajaInput {
  monto_cierre_declarado: number;
  notas_cierre?: string;
}

export interface MovimientoCajaInput {
  tipo: 'ingreso' | 'egreso';
  monto: number;
  metodo_pago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  descripcion?: string;
}