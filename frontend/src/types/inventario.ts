export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface MovimientoInventario {
  id: number;
  producto_id: number;
  usuario_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  created_at: string;
  producto_nombre?: string;
  producto_codigo?: string;
  usuario_nombre?: string;
}

export interface MovimientoInput {
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
}