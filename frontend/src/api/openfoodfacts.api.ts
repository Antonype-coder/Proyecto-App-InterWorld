export interface OpenFoodFactsProduct {
  code?: string | null;
  product_name?: string | null;
  brands?: string | null;
  categories?: string | null;
  ingredients_text?: string | null;
  image_front_url?: string | null;
  image_url?: string | null;
  nutriments?: Record<string, number | string | null> | null;
}

interface OpenFoodFactsSearchResponse {
  count?: number;
  products?: OpenFoodFactsProduct[];
}

export const openFoodFactsApi = {
  buscarPorCodigo: async (
    codigo: string,
    signal?: AbortSignal,
  ): Promise<OpenFoodFactsProduct | null> => {
    const normalized = String(codigo).trim();
    if (!normalized) {
      return null;
    }

    const url =
      `https://world.openfoodfacts.org/api/v2/search?code=${encodeURIComponent(normalized)}` +
      '&fields=code,product_name,brands,categories,ingredients_text,image_front_url,image_url,nutriments';

    console.log('[API] Consultando Open Food Facts:', url);

    const response = await fetch(url, {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[API] Open Food Facts no disponible:', response.status);
      throw new Error('Open Food Facts no disponible');
    }

    const data = (await response.json()) as OpenFoodFactsSearchResponse;
    const product = data.products?.[0] ?? null;

    if (!product) {
      console.log('[API] Producto no encontrado en Open Food Facts');
      return null;
    }

    console.log('[API] Producto encontrado en Open Food Facts:', {
      code: product.code,
      name: product.product_name,
      brand: product.brands,
    });

    return product;
  },
};
