export type Rol = 'admin' | 'vendedor';

export interface Usuario {
   id: number;
  negocio_id?: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'vendedor';
  activo: 1 | 0;
  ultimo_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioInput {
  nombre: string;
  email: string;
  password?: string;
  rol: Rol;
  activo?: number;
}