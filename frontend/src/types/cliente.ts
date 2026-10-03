export interface Cliente {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  cupo_credito: string;
  saldo_deuda: string;
  notas: string | null;
  activo: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteInput {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  cupo_credito?: number;
  notas?: string;
  activo?: number;
}

export interface PagoCredito {
  id: number;
  monto: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta';
  notas: string | null;
  created_at: string;
  usuario_nombre?: string;
}

export interface EstadoCuenta {
  cliente: Cliente;
  ventas: VentaCreditoResumen[];
  pagos: PagoCredito[];
}

export interface VentaCreditoResumen {
  id: number;
  numero: string;
  total: string;
  tipo_pago: 'credito';
  estado: 'completada' | 'anulada';
  created_at: string;
}

export interface PagoInput {
  monto: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta';
  venta_id?: number;
  notas?: string;
}