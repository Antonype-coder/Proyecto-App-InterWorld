export type TipoPromocion = 'porcentaje' | 'monto_fijo' | 'precio_especial' | '2x1' | '3x2';
export type AplicaA = 'producto' | 'categoria' | 'global';

export interface Promocion {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: TipoPromocion;
  valor: string;
  aplica_a: AplicaA;
  producto_id: number | null;
  categoria_id: number | null;
  producto_nombre: string | null;
  categoria_nombre: string | null;
  cantidad_minima: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
  created_at: string;
  updated_at: string;
}

export interface PromocionInput {
  nombre: string;
  descripcion?: string;
  tipo: TipoPromocion;
  valor?: number;
  aplica_a: AplicaA;
  producto_id?: number | null;
  categoria_id?: number | null;
  cantidad_minima?: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo?: number;
}