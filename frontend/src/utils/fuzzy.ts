/**
 * Score de similitud entre `query` y `text`. Devuelve un número ≥ 0.
 * 0 = no match, mayor score = mejor match.
 *
 * Reglas:
 * - Match exacto desde el inicio: score alto
 * - Match como subsecuencia: score medio
 * - Coincidencias con separadores de palabra: bonus
 */
export function fuzzyScore(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (t === q) return 1000;

  const direct = t.indexOf(q);
  if (direct === 0) return 900;
  if (direct > 0) {
    // Penalizar por distancia al inicio
    return 700 - Math.min(direct, 100);
  }

  // Subsequence match: todos los caracteres de `q` aparecen en `t` en orden
  let qi = 0;
  let score = 0;
  let lastIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus si el caracter anterior es un separador
      if (ti === 0 || /[\s\-_.,/]/.test(t[ti - 1])) score += 20;
      // Bonus por cercanía con el anterior
      if (lastIdx >= 0) score += Math.max(0, 10 - (ti - lastIdx));
      lastIdx = ti;
      qi++;
    }
  }

  return qi === q.length ? score : 0;
}

/**
 * Filtra y ordena una lista por score de similitud. Devuelve solo los
 * que tengan score > 0, ordenados descendentemente.
 */
export function fuzzyFilter<T>(
  query: string,
  items: T[],
  getText: (item: T) => string,
): T[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}