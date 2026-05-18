/**
 * Tolerant fetch for optional bundle JSON files.
 *
 * - 200 + valid array → parsed array
 * - 200 + non-array → [] (no throw; bundle author error, log nothing)
 * - 404 → [] (file simply absent)
 * - other non-OK → [] + console.warn
 * - network/JSON-parse error → [] + console.warn
 */
export async function fetchOptional<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (res.status === 404) return [];
    if (!res.ok) {
      console.warn(`fetchOptional: ${url} returned ${res.status}, using []`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch (e) {
    console.warn(`fetchOptional: ${url} threw, using []`, e);
    return [];
  }
}
