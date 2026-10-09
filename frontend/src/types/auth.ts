import type { Usuario } from './usuario';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}

export interface RegisterNegocioRequest {
  negocio_nombre: string;
  nit?: string;
  telefono?: string;
  nombre: string;
  email: string;
  password: string;
}