export interface Producto {
  id: number;
  codigo_barras: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: number | null;
  proveedor_id: number | null;
  categoria_nombre?: string | null;
  proveedor_nombre?: string | null;
  precio_compra: string;
  precio_venta: string;
  stock: number;
  stock_minimo: number;
  imagen: string | null;
  imagenes?: string[];
  activo: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductoInput {
  codigo_barras: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: number | null;
  proveedor_id?: number | null;
  precio_compra?: number;
  precio_venta: number;
  stock?: number;
  stock_minimo?: number;
  imagen?: string | null;
  imagenes?: string[];
  activo?: number;
}