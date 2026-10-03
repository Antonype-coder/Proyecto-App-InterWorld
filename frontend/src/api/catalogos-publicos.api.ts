import {
  openFoodFactsApi,
  type OpenFoodFactsProduct,
} from './openfoodfacts.api';
import { upcitemdbApi, type UpcItemDbProduct } from './upcitemdb.api';

export type FuenteCatalogoPublico =
  | 'openfoodfacts'
  | 'openproductsfacts'
  | 'openbeautyfacts'
  | 'openpetfoodfacts'
  | 'upcitemdb';

export interface ProductoCatalogoPublico {
  code: string;
  product_name: string | null;
  brands: string | null;
  categories: string | null;
  ingredients_text: string | null;
  image_front_url: string | null;
  image_url: string | null;
}

export interface ResultadoCatalogoPublico {
  source: FuenteCatalogoPublico;
  producto: ProductoCatalogoPublico;
}

export const catalogoPublicoLabel: Record<FuenteCatalogoPublico, string> = {
  openfoodfacts: 'Open Food Facts',
  openproductsfacts: 'Open Products Facts',
  openbeautyfacts: 'Open Beauty Facts',
  openpetfoodfacts: 'Open Pet Food Facts',
  upcitemdb: 'UPCitemdb',
};

interface OpenFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

const normalizeOpenFacts = (
  product: OpenFoodFactsProduct,
  code: string,
): ProductoCatalogoPublico => ({
  code: product.code ?? code,
  product_name: product.product_name ?? null,
  brands: product.brands ?? null,
  categories: product.categories ?? null,
  ingredients_text: product.ingredients_text ?? null,
  image_front_url: product.image_front_url ?? null,
  image_url: product.image_url ?? null,
});

const normalizeUpcItemDb = (
  product: UpcItemDbProduct,
  code: string,
): ProductoCatalogoPublico => ({
  code: product.upc ?? code,
  product_name: product.title ?? null,
  brands: product.brand ?? null,
  categories: product.category ?? null,
  ingredients_text: product.description ?? null,
  image_front_url: product.images?.[0] ?? null,
  image_url: product.images?.[0] ?? null,
});

async function buscarEnOpenFacts(
  host: string,
  code: string,
  signal: AbortSignal,
): Promise<ProductoCatalogoPublico | null> {
  const fields =
    'code,product_name,brands,categories,ingredients_text,image_front_url,image_url';
  const url =
    `https://${host}/api/v2/product/${encodeURIComponent(code)}.json` +
    `?fields=${fields}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) return null;

  const data = (await response.json()) as OpenFactsResponse;
  return data.status === 1 && data.product
    ? normalizeOpenFacts(data.product, code)
    : null;
}

async function conTimeout<T>(
  request: (signal: AbortSignal) => Promise<T | null>,
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    return await request(controller.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function buscarEnCatalogosPublicos(
  codigo: string,
): Promise<ResultadoCatalogoPublico | null> {
  const normalized = String(codigo ?? '').trim();
  if (!normalized) return null;

  const lookups: Array<Promise<ResultadoCatalogoPublico | null>> = [
    conTimeout(async (signal) => {
      const product = await openFoodFactsApi.buscarPorCodigo(normalized, signal);
      return product
        ? {
            source: 'openfoodfacts',
            producto: normalizeOpenFacts(product, normalized),
          }
        : null;
    }),
    conTimeout(async (signal) => {
      const product = await buscarEnOpenFacts(
        'world.openproductsfacts.org',
        normalized,
        signal,
      );
      return product ? { source: 'openproductsfacts', producto: product } : null;
    }),
    conTimeout(async (signal) => {
      const product = await buscarEnOpenFacts(
        'world.openbeautyfacts.org',
        normalized,
        signal,
      );
      return product ? { source: 'openbeautyfacts', producto: product } : null;
    }),
    conTimeout(async (signal) => {
      const product = await buscarEnOpenFacts(
        'world.openpetfoodfacts.org',
        normalized,
        signal,
      );
      return product ? { source: 'openpetfoodfacts', producto: product } : null;
    }),
    conTimeout(async (signal) => {
      const product = await upcitemdbApi.buscarPorCodigo(normalized, signal);
      return product
        ? {
            source: 'upcitemdb',
            producto: normalizeUpcItemDb(product, normalized),
          }
        : null;
    }),
  ];

  const results = await Promise.all(lookups);
  return results.find((result) => result !== null) ?? null;
}