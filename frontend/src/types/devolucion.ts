export type TipoDevolucion = 'total' | 'parcial';
export type EstadoDevolucion = 'completada' | 'anulada';
export type MetodoDevolucion = 'efectivo' | 'transferencia' | 'nota_credito' | 'reposicion';

export interface DevolucionResumen {
  id: number;
  numero: string;
  venta_id: number;
  venta_numero: string;
  usuario_id: number;
  usuario_nombre: string;
  cliente_id: number | null;
  cliente_nombre: string | null;
  tipo: TipoDevolucion;
  motivo: string;
  monto_devuelto: string;
  metodo_devolucion: MetodoDevolucion;
  estado: EstadoDevolucion;
  created_at: string;
}

export interface DevolucionDetalleItem {
  id: number;
  devolucion_id: number;
  producto_id: number;
  producto_nombre: string;
  codigo_barras: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

export interface Devolucion extends DevolucionResumen {
  tipo_pago: 'contado' | 'credito';
  detalle: DevolucionDetalleItem[];
}

export interface DevolucionInput {
  venta_id: number;
  motivo: string;
  metodo_devolucion: MetodoDevolucion;
  items: Array<{ producto_id: number; cantidad: number }>;
}