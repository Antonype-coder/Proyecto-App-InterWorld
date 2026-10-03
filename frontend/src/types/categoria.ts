export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaInput {
  nombre: string;
  descripcion?: string;
  activo?: number;
}