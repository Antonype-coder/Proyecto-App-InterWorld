import type { Producto } from './producto';
export type TipoPago = 'contado' | 'credito';
export type EstadoVenta = 'completada' | 'anulada';

export interface VentaResumen {
  id: number;
  numero: string;
  tipo_pago: TipoPago;
  total: string;
  estado: EstadoVenta;
  created_at: string;
  usuario_nombre?: string;
  cliente_nombre?: string | null;
}

export interface VentaDetalleItem {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  producto_nombre: string;
  codigo_barras: string;
}

export interface Venta {
  id: number;
  numero: string;
  usuario_id: number;
  usuario_nombre: string;
  cliente_id: number | null;
  cliente_nombre: string | null;
  tipo_pago: TipoPago;
  subtotal: string;
  descuento: string;
  total: string;
  estado: EstadoVenta;
  anulada_at: string | null;
  anulada_por: number | null;
  anulada_por_nombre: string | null;
  motivo_anulacion: string | null;
  created_at: string;
  detalle: VentaDetalleItem[];
}

export interface VentaItemInput {
  producto_id: number;
  cantidad: number;
}

export interface VentaInput {
  idempotency_key?: string;
  tipo_pago: TipoPago;
  cliente_id?: number | null;
  descuento?: number;
  notas?: string;
  items: VentaItemInput[];
}

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}