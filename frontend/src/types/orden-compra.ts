export type EstadoOC = 'borrador' | 'enviada' | 'recibida_parcial' | 'recibida' | 'cancelada';

export interface OrdenCompraResumen {
  id: number;
  numero: string;
  proveedor_id: number;
  proveedor_nombre: string;
  usuario_id: number;
  usuario_nombre: string;
  subtotal: string;
  impuesto: string;
  total: string;
  estado: EstadoOC;
  fecha_esperada: string | null;
  fecha_recepcion: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdenCompraDetalleItem {
  id: number;
  orden_compra_id: number;
  producto_id: number;
  producto_nombre: string;
  codigo_barras: string;
  stock_actual: number;
  cantidad: number;
  cantidad_recibida: number;
  precio_unitario: string;
  subtotal: string;
}

export interface OrdenCompra extends OrdenCompraResumen {
  proveedor_email?: string | null;
  proveedor_contacto?: string | null;
  detalle: OrdenCompraDetalleItem[];
}

export interface OrdenCompraInput {
  proveedor_id: number;
  fecha_esperada?: string;
  notas?: string;
  estado?: EstadoOC;
  items: Array<{
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
  }>;
}

export interface RecepcionItem {
  detalle_id: number;
  cantidad: number;
}