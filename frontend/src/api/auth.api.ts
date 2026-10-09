import { http } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterNegocioRequest,
  Usuario,
} from '@tipos/index';

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    http.post<LoginResponse>('/auth/login', data),

  registrarNegocio: (data: RegisterNegocioRequest): Promise<LoginResponse> =>
    http.post<LoginResponse>('/auth/registrar-negocio', data),

  logout: (): Promise<null> => http.post<null>('/auth/logout'),

  me: (): Promise<Usuario> => http.get<Usuario>('/auth/me'),

  register: (data: {
    nombre: string;
    email: string;
    password: string;
    rol: 'admin' | 'vendedor';
  }): Promise<Usuario> => http.post<Usuario>('/auth/register', data),
};