import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL, STORAGE_TOKEN_KEY, STORAGE_USER_KEY } from '@utils/constants';
import type { ApiResponse } from '@tipos/index';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Callback opcional para notificar cierre de sesión
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// ============================================================================
// Interceptor de request: agrega el token JWT
// ============================================================================
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================================
// Interceptor de response: manejo uniforme de errores
// ============================================================================
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;

    if (status === 401) {
      await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_USER_KEY]);
      if (onUnauthorized) onUnauthorized();
    }

    let message = 'Error de conexión. Revisa tu red.';

    if (error.response?.data) {
      const data = error.response.data;
      if (
        typeof data === 'object' &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        message = data.message;
      }
    } else if (error.code === 'ECONNABORTED') {
      message = 'La petición tardó demasiado. Intenta de nuevo.';
    } else if (error.message) {
      message = error.message;
    }

    const requestError = new Error(message) as Error & {
      status?: number;
      code?: string;
    };
    requestError.status = status;
    requestError.code = error.code;
    return Promise.reject(requestError);
  },
);

// ============================================================================
// Helpers tipados
// ============================================================================
export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await api.get<ApiResponse<T>>(url, config);
    return res.data.data;
  },

  post: async <T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await api.post<ApiResponse<T>>(url, body, config);
    return res.data.data;
  },

  put: async <T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await api.put<ApiResponse<T>>(url, body, config);
    return res.data.data;
  },

  patch: async <T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await api.patch<ApiResponse<T>>(url, body, config);
    return res.data.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await api.delete<ApiResponse<T>>(url, config);
    return res.data.data;
  },
};

export default api;