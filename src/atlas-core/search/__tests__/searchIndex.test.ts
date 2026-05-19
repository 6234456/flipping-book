import { describe, it, expect } from 'vitest';
import { searchIndex } from '../searchIndex';
import type { IndexedItem } from '../buildIndex';

const ITEMS: IndexedItem[] = [
  { category: 'page', id: 'p-01', haystack: 'vat framework five steps', display: { primary: 'VAT Framework' }, pageId: 'p-01' },
  { category: 'page', id: 'p-15', haystack: 'reverse charge invoice', display: { primary: 'Reverse Charge' }, pageId: 'p-15' },
  { category: 'glossary', id: 'reverse-charge', haystack: 'reverse charge reverse charge', display: { primary: 'Reverse Charge (反向征税)' } },
  { category: 'glossary', id: 'werklieferung', haystack: 'werklieferung 加工供货', display: { primary: '加工供货 (Werklieferung)' } },
  { category: 'legal', id: '§ 13b', haystack: '§ 13b reverse charge ustg', display: { primary: '§ 13b UStG' } },
];

describe('searchIndex', () => {
  it('returns empty grouped result for empty query', () => {
    const r = searchIndex(ITEMS, '');
    expect(r).toEqual({ page: [], glossary: [], legal: [], scenario: [], note: [], content: [] });
  });

  it('returns empty grouped result for whitespace-only query', () => {
    const r = searchIndex(ITEMS, '   ');
    expect(r.page).toEqual([]);
  });

  it('matches case-insensitively', () => {
    const r = searchIndex(ITEMS, 'REVERSE');
    expect(r.page.length).toBeGreaterThan(0);
    expect(r.glossary.length).toBeGreaterThan(0);
  });

  it('returns matches grouped by category', () => {
    const r = searchIndex(ITEMS, 'reverse');
    expect(r.page.map((i) => i.id)).toContain('p-15');
    expect(r.glossary.map((i) => i.id)).toContain('reverse-charge');
    expect(r.legal.map((i) => i.id)).toContain('§ 13b');
  });

  it('limits each category to 5 results', () => {
    const many: IndexedItem[] = Array.from({ length: 8 }, (_, i) => ({
      category: 'page', id: `p-${i}`, haystack: 'reverse common', display: { primary: `Page ${i}` },
    }));
    const r = searchIndex(many, 'reverse');
    expect(r.page).toHaveLength(5);
  });

  it('Chinese substring works', () => {
    const r = searchIndex(ITEMS, '加工');
    expect(r.glossary.map((i) => i.id)).toContain('werklieferung');
  });

  it('non-matching query returns empty groups', () => {
    const r = searchIndex(ITEMS, 'zzzzz');
    expect(r.page).toEqual([]);
    expect(r.glossary).toEqual([]);
  });
});
