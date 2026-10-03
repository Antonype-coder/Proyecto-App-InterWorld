import api from './client';
import { Directory, File, Paths } from 'expo-file-system';
import type { ApiResponse } from '@tipos/index';

export interface UploadResponse {
  path: string;
}

export const uploadsApi = {
  imagenProducto: async (file: {
    uri: string;
    name: string;
    type: string;
  }): Promise<UploadResponse> => {
    const form = new FormData();
    form.append('imagen', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    const res = await api.post<ApiResponse<UploadResponse>>(
      '/uploads/productos',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
  },

  imagenProductoDesdeUrl: async (url: string): Promise<UploadResponse> => {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('La dirección de la imagen no es válida.');
    }

    const directory = new Directory(Paths.cache, 'imagenes-productos');
    directory.create({ idempotent: true, intermediates: true });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let downloadedFile: File | null = null;

    try {
      downloadedFile = await File.downloadFileAsync(url, directory, {
        signal: controller.signal,
      });

      if (!downloadedFile.exists || downloadedFile.size === 0) {
        throw new Error('No se pudo descargar la imagen del catálogo.');
      }
      if (downloadedFile.size > 10 * 1024 * 1024) {
        throw new Error('La imagen supera el límite de 10 MB.');
      }
      if (downloadedFile.type && !downloadedFile.type.startsWith('image/')) {
        throw new Error('El catálogo no devolvió un archivo de imagen.');
      }

      return await uploadsApi.imagenProducto({
        uri: downloadedFile.uri,
        name: downloadedFile.name || 'producto.jpg',
        type: downloadedFile.type || 'image/jpeg',
      });
    } finally {
      clearTimeout(timeoutId);
      downloadedFile?.delete();
    }
  },

  imagenLogo: async (file: {
    uri: string;
    name: string;
    type: string;
  }): Promise<UploadResponse> => {
    const form = new FormData();
    form.append('imagen', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    const res = await api.post<ApiResponse<UploadResponse>>(
      '/uploads/logo',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
  },
};