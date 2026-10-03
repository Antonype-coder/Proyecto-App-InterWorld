import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORY_KEY = 'hidden_catalog_categories';
const SUPPLIER_KEY = 'hidden_catalog_suppliers';

type CatalogKind = 'categories' | 'suppliers';

const getStorageKey = (kind: CatalogKind): string =>
  kind === 'categories' ? CATEGORY_KEY : SUPPLIER_KEY;

export const getHiddenCatalogIds = async (
  kind: CatalogKind,
): Promise<Set<number>> => {
  const stored = await AsyncStorage.getItem(getStorageKey(kind));
  if (!stored) return new Set();

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(
    (id): id is number => Number.isSafeInteger(id) && id > 0,
  )) {
    throw new Error('No se pudo leer la lista de elementos quitados.');
  }

  return new Set(parsed);
};

export const hideCatalogId = async (
  kind: CatalogKind,
  id: number,
): Promise<void> => {
  const hiddenIds = await getHiddenCatalogIds(kind);
  hiddenIds.add(id);
  await AsyncStorage.setItem(
    getStorageKey(kind),
    JSON.stringify([...hiddenIds]),
  );
};
