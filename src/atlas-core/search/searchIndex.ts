import type { IndexedItem, IndexCategory } from './buildIndex';

export type GroupedResults = Record<IndexCategory, IndexedItem[]>;

const PER_CATEGORY_LIMIT = 5;

const CATEGORIES: readonly IndexCategory[] = [
  'page', 'glossary', 'legal', 'scenario', 'note', 'content',
];

function emptyResults(): GroupedResults {
  return { page: [], glossary: [], legal: [], scenario: [], note: [], content: [] };
}

export function searchIndex(items: IndexedItem[], query: string): GroupedResults {
  const q = query.trim().toLowerCase();
  if (!q) return emptyResults();

  const matched: IndexedItem[] = items.filter((it) => it.haystack.includes(q));

  const grouped = emptyResults();
  for (const cat of CATEGORIES) {
    grouped[cat] = matched.filter((it) => it.category === cat).slice(0, PER_CATEGORY_LIMIT);
  }
  return grouped;
}
