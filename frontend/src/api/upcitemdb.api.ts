export interface UpcItemDbProduct {
  title?: string | null;
  description?: string | null;
  brand?: string | null;
  category?: string | null;
  upc?: string | null;
  model?: string | null;
  images?: string[] | null;
}

interface UpcItemDbResponse {
  items?: UpcItemDbProduct[];
}

export const upcitemdbApi = {
  buscarPorCodigo: async (
    codigo: string,
    signal?: AbortSignal,
  ): Promise<UpcItemDbProduct | null> => {
    const normalized = String(codigo).trim();
    if (!normalized) {
      return null;
    }

    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(normalized)}`;

    console.log('[API] Consultando UPCitemdb:', url);

    const response = await fetch(url, {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[API] UPCitemdb no disponible:', response.status);
      throw new Error('UPCitemdb no disponible');
    }

    const data = (await response.json()) as UpcItemDbResponse;
    const product = data.items?.[0] ?? null;

    if (!product) {
      console.log('[API] Producto no encontrado en UPCitemdb');
      return null;
    }

    console.log('[API] Producto encontrado en UPCitemdb:', {
      title: product.title,
      brand: product.brand,
      upc: product.upc,
    });

    return product;
  },
};
